// supabase/functions/ai-assistant/index.ts
// Edge Function: Asistente IA con visión — usa OpenAI GPT-4o
// Deploy: Dashboard → Edge Functions → Deploy a new function → pegar este código

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o'

const SYSTEM_PROMPT = `Eres un asistente médico personal de apoyo para una app de historial clínico familiar llamada in-salud.

Tu rol:
- Ayudás a interpretar resultados de estudios médicos y documentos de salud
- Explicás terminología médica en lenguaje sencillo
- Respondés preguntas sobre medicamentos, condiciones y signos vitales
- Podés analizar imágenes de estudios médicos (radiografías, análisis, etc.)

Límites claros:
- NO hacés diagnósticos médicos
- NO reemplazás la consulta con un médico
- NO recetás medicamentos
- Siempre recomendás consultar con un profesional de la salud para decisiones médicas importantes

Estilo: claro, empático, en español rioplatense, conciso. Usá listas cuando sea útil.`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  message: string
  imageUri?: string
  history?: Message[]
}

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY no configurada' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body: RequestBody = await req.json()
    const { message, imageUri, history = [] } = body

    if (!message) {
      return new Response(JSON.stringify({ error: 'message requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Construir historial de mensajes
    const messages: Array<{ role: string; content: unknown }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ]

    // Agregar historial previo
    for (const h of history.slice(-10)) { // máximo 10 mensajes de historial
      messages.push({ role: h.role, content: h.content })
    }

    // Mensaje actual (con imagen opcional)
    if (imageUri) {
      // Con imagen: usar content array para visión
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message },
          {
            type: 'image_url',
            image_url: {
              url: imageUri,
              detail: 'high',
            },
          },
        ],
      })
    } else {
      messages.push({ role: 'user', content: message })
    }

    // Llamar a OpenAI
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 1024,
        temperature: 0.3, // más conservador para contexto médico
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenAI error:', response.status, errText)
      return new Response(
        JSON.stringify({ error: `Error OpenAI: ${response.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content ?? 'Sin respuesta'

    return new Response(
      JSON.stringify({ reply }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    console.error('Error interno:', err)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
