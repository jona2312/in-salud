/**
 * app/(tabs)/asistente.tsx — Asistente IA con visión
 * v2: chat con Claude, carga de imagen, extracción automática de datos
 *
 * SEGURIDAD:
 * - Imágenes se envían a la API de Claude (Anthropic) via Edge Function segura
 * - Nunca se expone la API key en el cliente
 * - Las imágenes no se almacenan, solo se procesan en memoria
 */
import { useState, useRef } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUri?: string
  timestamp: Date
}

const SUGGESTIONS = [
  'Analizá este análisis de sangre',
  'Leé los datos de mi carnet de obra social',
  'Extraé los medicamentos de esta receta',
  'Interpretá estos resultados de laboratorio',
]

export default function AsistenteScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hola! Soy tu asistente de salud. Podés hacerme preguntas, o subir una foto de un análisis, receta o carnet de obra social y extraigo los datos automáticamente.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Necesitamos acceso a tus fotos para analizar imágenes.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    })
    if (!result.canceled && result.assets[0]) {
      setPendingImage(result.assets[0].uri)
      setInput(prev => prev || 'Analizá esta imagen y extraé todos los datos relevantes de salud.')
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Necesitamos acceso a la cámara.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    })
    if (!result.canceled && result.assets[0]) {
      setPendingImage(result.assets[0].uri)
      setInput(prev => prev || 'Analizá esta imagen y extraé todos los datos relevantes de salud.')
    }
  }

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content && !pendingImage) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content || '(imagen adjunta)',
      imageUri: pendingImage ?? undefined,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    const imgToSend = pendingImage
    setPendingImage(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: content,
          imageUri: imgToSend,
          history: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
      })

      if (error) throw new Error(error.message)

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.reply ?? 'No pude procesar la consulta. Intentá de nuevo.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Hubo un error al procesar tu consulta. Verificá tu conexión e intentá de nuevo.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } finally {
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={s.container}>
        <View style={s.header}>
          <View style={s.headerIcon}>
            <Text style={s.headerIconText}>✦</Text>
          </View>
          <View>
            <Text style={s.headerTitle}>Asistente de salud</Text>
            <Text style={s.headerSub}>Leer análisis · Extraer datos · Consultas</Text>
          </View>
        </View>

        <ScrollView ref={scrollRef} style={s.messages} contentContainerStyle={s.messagesContent}>
          {messages.length === 1 && (
            <View style={s.suggestions}>
              <Text style={s.suggestionsTitle}>Sugerencias</Text>
              {SUGGESTIONS.map((s_, i) => (
                <TouchableOpacity key={i} style={s.suggestionChip} onPress={() => sendMessage(s_)}>
                  <Text style={s.suggestionText}>{s_}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {messages.map(m => (
            <View key={m.id} style={[s.bubble, m.role === 'user' ? s.bubbleUser : s.bubbleAssistant]}>
              {m.imageUri && (
                <Image source={{ uri: m.imageUri }} style={s.bubbleImage} resizeMode="cover" />
              )}
              <Text style={[s.bubbleText, m.role === 'user' ? s.bubbleTextUser : s.bubbleTextAssistant]}>
                {m.content}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={[s.bubble, s.bubbleAssistant, s.loadingBubble]}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={[s.bubbleText, s.bubbleTextAssistant, { marginLeft: 8 }]}>Analizando…</Text>
            </View>
          )}
        </ScrollView>

        {pendingImage && (
          <View style={s.pendingImageRow}>
            <Image source={{ uri: pendingImage }} style={s.pendingImage} />
            <Text style={s.pendingImageText}>Imagen lista para enviar</Text>
            <TouchableOpacity onPress={() => setPendingImage(null)}>
              <Text style={s.pendingImageRemove}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.inputRow}>
          <TouchableOpacity style={s.mediaBtn} onPress={takePhoto}>
            <Text style={s.mediaBtnText}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.mediaBtn} onPress={pickImage}>
            <Text style={s.mediaBtnText}>🖼️</Text>
          </TouchableOpacity>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Preguntá o describí la imagen…"
            placeholderTextColor={COLORS.gray400}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() && !pendingImage) && s.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() && !pendingImage}
          >
            <Text style={s.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  headerIconText: { fontSize: 18, color: COLORS.white, fontWeight: '700' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  suggestions: { marginBottom: 20 },
  suggestionsTitle: { fontSize: 12, fontWeight: '600', color: COLORS.gray500, textTransform: 'uppercase', marginBottom: 10 },
  suggestionChip: { backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: COLORS.gray200 },
  suggestionText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 12, marginBottom: 8 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: COLORS.white, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: COLORS.white },
  bubbleTextAssistant: { color: COLORS.text },
  bubbleImage: { width: 200, height: 150, borderRadius: 8, marginBottom: 8 },
  loadingBubble: { flexDirection: 'row', alignItems: 'center' },
  pendingImageRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  pendingImage: { width: 44, height: 44, borderRadius: 8 },
  pendingImageText: { flex: 1, fontSize: 13, color: COLORS.gray500 },
  pendingImageRemove: { fontSize: 16, color: COLORS.gray500, padding: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  mediaBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center' },
  mediaBtnText: { fontSize: 16 },
  input: { flex: 1, backgroundColor: COLORS.gray100, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: COLORS.text, maxHeight: 100 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: COLORS.gray200 },
  sendBtnText: { fontSize: 18, color: COLORS.white, fontWeight: '700', lineHeight: 22 },
})
