import { supabase } from './supabase'
// Client preflight is UX/defense in depth; server RLS MUST also validate ownership.
export async function requireOwnedPerson(personId: string): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Verificá tu sesión antes de guardar.')
  const { data: person, error: personError } = await supabase.from('persons')
    .select('id').eq('id', personId).eq('owner_id', user.id).single()
  if (personError || !person) throw new Error('No tenés acceso a esta persona.')
  return user.id
}
