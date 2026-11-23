import { supabase } from '../supabase/client'

/**
 * Whether the account has a row in `admins`. A user may read only their own
 * row, so an empty result means "not an administrator". A failed query throws,
 * so a network error is never reported to a real administrator as "not an
 * administrator".
 */
export async function isAdministrator(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data !== null
}
