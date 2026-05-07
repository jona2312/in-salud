/**
 * app/(tabs)/documentos.tsx — Documentos y estudios médicos
 *
 * Permite subir PDFs e imágenes (análisis, recetas, estudios) asociados a una persona.
 * Los archivos se guardan en Supabase Storage bucket 'documents'.
 * Path: {user_id}/{person_id}/{uuid}.{ext}
 *
 * SEGURIDAD:
 * - Bucket 'documents' es privado (no public)
 * - RLS: solo el owner puede acceder a sus carpetas
 * - URLs firmadas con expiración de 1 hora para visualización
 * - owner_id siempre tomado del servidor via RLS, nunca del cliente
 */

import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Linking, Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { COLORS } from '@/constants/theme'
import { MedicalDocument, DocumentFileType } from '@/types/database'

// ─── helpers ─────────────────────────────────────────────────────────────────

function fileTypeFromMime(mime: string): DocumentFileType {
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('image/')) return 'imagen'
  return 'otro'
}

function fileIcon(type: DocumentFileType): string {
  if (type === 'pdf') return '📄'
  if (type === 'imagen') return '🖼️'
  return '📎'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

// ─── fetch ────────────────────────────────────────────────────────────────────

async function fetchDocuments(personId: string): Promise<MedicalDocument[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('person_id', personId)
    .order('uploaded_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchPersonName(personId: string): Promise<string> {
  const { data } = await supabase
    .from('persons')
    .select('full_name')
    .eq('id', personId)
    .single()
  return data?.full_name ?? 'Persona'
}

// ─── componente ──────────────────────────────────────────────────────────────

export default function DocumentosScreen() {
  const { id: personId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { session } = useAuthStore()
  const [uploading, setUploading] = useState(false)

  const docsQuery = useQuery({
    queryKey: ['documents', personId],
    queryFn: () => fetchDocuments(personId!),
    enabled: !!personId,
  })

  const nameQuery = useQuery({
    queryKey: ['person-name', personId],
    queryFn: () => fetchPersonName(personId!),
    enabled: !!personId,
  })

  const docs = docsQuery.data ?? []

  // ── upload ─────────────────────────────────────────────────────────────────

  async function uploadFile(uri: string, mimeType: string, fileName: string) {
    if (!session?.user?.id || !personId) return

    setUploading(true)
    try {
      const ext = fileName.split('.').pop() ?? 'bin'
      const uuid = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const storagePath = `${session.user.id}/${personId}/${uuid}.${ext}`

      // Leer el archivo como blob
      const response = await fetch(uri)
      const blob = await response.blob()

      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(storagePath, blob, {
          contentType: mimeType,
          upsert: false,
        })

      if (storageError) throw new Error(storageError.message)

      const fileType = fileTypeFromMime(mimeType)

      // Guardar metadata en DB
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          person_id: personId,
          name: fileName,
          file_url: storagePath,
          file_type: fileType,
        })

      if (dbError) throw new Error(dbError.message)

      await queryClient.invalidateQueries({ queryKey: ['documents', personId] })
      Alert.alert('✓ Subido', `"${fileName}" guardado correctamente.`)
    } catch (e: any) {
      Alert.alert('Error al subir', e.message)
    } finally {
      setUploading(false)
    }
  }

  async function pickDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      })
      if (result.canceled) return
      const file = result.assets[0]
      await uploadFile(file.uri, file.mimeType ?? 'application/pdf', file.name)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Necesitamos acceso a tus fotos.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    })
    if (result.canceled) return
    const asset = result.assets[0]
    const ext = asset.uri.split('.').pop() ?? 'jpg'
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
    const name = `imagen_${new Date().toISOString().slice(0, 10)}.${ext}`
    await uploadFile(asset.uri, mime, name)
  }

  function showUploadOptions() {
    Alert.alert('Subir documento', 'Elegí el tipo de archivo', [
      { text: 'PDF', onPress: pickDocument },
      { text: 'Imagen / Foto', onPress: pickImage },
      { text: 'Cancelar', style: 'cancel' },
    ])
  }

  // ── abrir documento ────────────────────────────────────────────────────────

  async function openDocument(doc: MedicalDocument) {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_url, 3600) // 1 hora
      if (error) throw new Error(error.message)
      if (data?.signedUrl) {
        await Linking.openURL(data.signedUrl)
      }
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo abrir el archivo: ' + e.message)
    }
  }

  // ── eliminar ───────────────────────────────────────────────────────────────

  async function deleteDocument(doc: MedicalDocument) {
    Alert.alert(
      'Eliminar documento',
      `¿Eliminar "${doc.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await supabase.storage.from('documents').remove([doc.file_url])
              await supabase.from('documents').delete().eq('id', doc.id)
              await queryClient.invalidateQueries({ queryKey: ['documents', personId] })
            } catch (e: any) {
              Alert.alert('Error', e.message)
            }
          },
        },
      ]
    )
  }

  // ── render ─────────────────────────────────────────────────────────────────

  if (!personId) {
    return (
      <View style={s.center}>
        <Text style={s.hint}>Seleccioná una persona desde la Ficha</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Ficha</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Documentos</Text>
          {nameQuery.data && (
            <Text style={s.subtitle}>{nameQuery.data}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[s.uploadBtn, uploading && s.uploadBtnDisabled]}
          onPress={showUploadOptions}
          disabled={uploading}
        >
          {uploading
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Text style={s.uploadBtnText}>+ Subir</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {docsQuery.isLoading ? (
        <ActivityIndicator style={s.center} color={COLORS.primary} size="large" />
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {docs.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>📁</Text>
              <Text style={s.emptyTitle}>Sin documentos</Text>
              <Text style={s.emptyDesc}>
                Subí análisis, recetas, estudios o cualquier documento médico.
              </Text>
              <TouchableOpacity style={s.emptyBtn} onPress={showUploadOptions}>
                <Text style={s.emptyBtnText}>+ Subir primer documento</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Agrupados por tipo */}
              {(['pdf', 'imagen', 'otro'] as DocumentFileType[]).map(type => {
                const group = docs.filter(d => d.file_type === type)
                if (group.length === 0) return null
                const label = type === 'pdf' ? 'PDFs' : type === 'imagen' ? 'Imágenes' : 'Otros'
                return (
                  <View key={type}>
                    <Text style={s.groupLabel}>{label} ({group.length})</Text>
                    {group.map(doc => (
                      <TouchableOpacity
                        key={doc.id}
                        style={s.docCard}
                        onPress={() => openDocument(doc)}
                        onLongPress={() => deleteDocument(doc)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.docIcon}>{fileIcon(doc.file_type)}</Text>
                        <View style={s.docInfo}>
                          <Text style={s.docName} numberOfLines={2}>{doc.name}</Text>
                          <Text style={s.docDate}>{formatDate(doc.uploaded_at)}</Text>
                          {doc.ai_summary && (
                            <Text style={s.aiSummary} numberOfLines={2}>
                              🤖 {doc.ai_summary}
                            </Text>
                          )}
                        </View>
                        <View style={s.docActions}>
                          <Text style={s.openText}>Abrir ›</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )
              })}
              <Text style={s.hint}>Mantené presionado un documento para eliminarlo.</Text>
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}

// ─── estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { paddingRight: 4 },
  backText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },
  uploadBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

  list: { padding: 16, paddingBottom: 40 },

  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
  },

  docCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  docIcon: { fontSize: 28 },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  docDate: { fontSize: 11, color: COLORS.gray500, marginTop: 3 },
  aiSummary: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  docActions: { alignItems: 'flex-end' },
  openText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptyDesc: {
    fontSize: 14, color: COLORS.gray500, textAlign: 'center', lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },

  hint: { fontSize: 11, color: COLORS.gray400, textAlign: 'center', marginTop: 16 },
})
