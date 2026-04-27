import { supabase } from "./supabaseClient";

/**
 * On every login we make sure a profiles row exists for the auth user.
 * The insert uses ONLY the always-present columns (id, full_name, email,
 * role) so it works even before the personalization migration has been
 * applied. We then attempt to upsert the avatar_url + email separately —
 * if those columns are missing the call errors silently and we continue.
 */
export const syncProfile = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;

  const meta = user.user_metadata ?? {};
  const fullName =
    meta.full_name || meta.name || user.email?.split("@")[0] || "User";
  const avatarUrl = meta.avatar_url || meta.picture || null;

  // Does a row already exist?
  const { data: existing, error: lookupErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (lookupErr && lookupErr.code !== "PGRST116") return;

  if (!existing) {
    // Minimal insert — guaranteed to succeed against any version of the schema
    await supabase.from("profiles").insert({
      id:        user.id,
      full_name: fullName,
      email:     user.email,
      role:      "farmer",
    });
  }

  // Best-effort: fill in avatar_url + email if those columns exist.
  // Errors here mean the migration hasn't been applied yet — that's fine.
  if (avatarUrl) {
    await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id)
      .then(() => undefined, () => undefined);
  }
};
