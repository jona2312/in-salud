// Source-only containment. Deploy separately after reviewing live consumers.
// General medical chat is suspended until authorized document retrieval is implemented.
Deno.serve((req: Request) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
  }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  return new Response(JSON.stringify({ error: 'DOCUMENT_ASSISTANT_NOT_READY' }), { status: 503, headers })
})
