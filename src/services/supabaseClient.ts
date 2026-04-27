import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export const signInWithGoogle = async () => {
  // Always come back to the page that started the sign-in. Works on Replit
  // dev domains, custom domains, localhost, and production deploys alike.
  const redirectTo =
    typeof window !== "undefined" ? window.location.origin : undefined
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  })
  if (error) throw error
  return data
}
