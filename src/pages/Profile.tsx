import AppLayout from "@/components/AppLayout";
import {
  Settings, ChevronRight, MapPin, Edit, BookOpen, Star, ShoppingBag,
  Users, User as UserIcon, LogOut, Save, X, ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { updateProfile } from "@/lib/supabaseService";
import { toast } from "sonner";
import {
  farmingTypes, farmScales, userRoles, languages, interestTopics,
  crops as cropOptions, livestockAnimals,
} from "@/components/onboarding/onboardingData";
import { countries, kenyanCounties } from "@/components/onboarding/locationData";

const menuItems = [
  { icon: ShoppingBag, label: "My Listings",      desc: "Manage marketplace items",      path: "/marketplace" },
  { icon: Users,       label: "Following",        desc: "Farmers you follow",            path: "/community" },
  { icon: Star,        label: "Saved Posts",      desc: "Bookmarked content",            path: "/community" },
  { icon: BookOpen,    label: "Expert Directory", desc: "Find agricultural experts",     path: "/experts" },
  { icon: Settings,    label: "Settings",         desc: "Notifications, privacy, theme", path: "/settings" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);

  const [form, setForm] = useState(() => ({
    full_name:          user?.name ?? "",
    bio:                user?.bio ?? "",
    role:               (user?.role ?? "farmer") as string,
    country:            user?.country ?? "Kenya",
    region:             user?.region ?? "",
    language:           user?.language ?? "en",
    farm_scale:         user?.farmScale ?? "",
    phone:              user?.phone ?? "",
    farming_activities: user?.farmingActivities ?? [],
    primary_crops:      user?.primaryCrops ?? [],
    livestock_types:    user?.livestockTypes ?? [],
    interests:          user?.interests ?? [],
  }));

  const handleLogout = () => { logout(); navigate("/"); };

  const toggleArr = (key: keyof typeof form, id: string) => {
    setForm((f) => {
      const cur = f[key] as string[];
      return { ...f, [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });
  };

  const startEdit = () => {
    setForm({
      full_name:          user?.name ?? "",
      bio:                user?.bio ?? "",
      role:               (user?.role ?? "farmer") as string,
      country:            user?.country ?? "Kenya",
      region:             user?.region ?? "",
      language:           user?.language ?? "en",
      farm_scale:         user?.farmScale ?? "",
      phone:              user?.phone ?? "",
      farming_activities: user?.farmingActivities ?? [],
      primary_crops:      user?.primaryCrops ?? [],
      livestock_types:    user?.livestockTypes ?? [],
      interests:          user?.interests ?? [],
    });
    setEditing(true);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const locationString = form.region ? `${form.region}, ${form.country}` : form.country;
    updateUser({
      name:              form.full_name || user.name,
      bio:               form.bio,
      role:              form.role as typeof user.role,
      country:           form.country,
      region:            form.region,
      location:          locationString,
      language:          form.language,
      farmScale:         form.farm_scale,
      phone:             form.phone,
      farmingActivities: form.farming_activities,
      primaryCrops:      form.primary_crops,
      livestockTypes:    form.livestock_types,
      interests:         form.interests,
    });
    try {
      await updateProfile(user.id, {
        full_name:          form.full_name || undefined,
        bio:                form.bio || undefined,
        role:               form.role || undefined,
        country:            form.country || undefined,
        region:             form.region || undefined,
        language:           form.language || undefined,
        farm_scale:         form.farm_scale || undefined,
        farm_size:          form.farm_scale || undefined,
        phone:              form.phone || undefined,
        farming_activities: form.farming_activities,
        primary_crops:      form.primary_crops,
        livestock_types:    form.livestock_types,
        interests:          form.interests,
      });
      toast.success("Profile updated");
      setEditing(false);
    } catch (err) {
      console.warn("[profile] save failed", err);
      toast.error("Saved locally — couldn't reach the server");
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const isFarmer = form.role === "farmer";

  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-6">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="harvest-card p-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                : <UserIcon className="h-8 w-8" />}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{user?.name || "Guest User"}</h1>
              <p className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0" /> {user?.location || "Location not set"}
              </p>
              {user?.farmingActivities && user.farmingActivities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {user.farmingActivities.slice(0, 4).map((act) => (
                    <span key={act} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary capitalize">
                      {act}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {isAuthenticated && !editing && (
              <button
                onClick={startEdit}
                aria-label="Edit profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-muted/70"
              >
                <Edit className="h-4 w-4 text-foreground" />
              </button>
            )}
          </div>

          {user?.bio && !editing && (
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{user.bio}</p>
          )}

          {isAuthenticated && (
            <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4">
              <Stat label="Posts"     value={user?.postsCount ?? 0} />
              <Stat label="Followers" value={user?.followers ?? 0} />
              <Stat label="Following" value={user?.following ?? 0} />
            </div>
          )}
        </motion.div>

        {/* Edit form */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="harvest-card p-4 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Edit Profile</h2>
              <button onClick={() => setEditing(false)} aria-label="Cancel" className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <Field label="Full name">
              <input
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className="harvest-input"
                placeholder="Your full name"
              />
            </Field>

            <Field label="Bio">
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
                maxLength={240}
                className="harvest-input resize-none"
                placeholder="A short description about you and your farm"
              />
            </Field>

            <Field label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="harvest-input"
                placeholder="+254 …"
              />
            </Field>

            <Field label="I am a">
              <div className="grid grid-cols-2 gap-2">
                {userRoles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: r.id }))}
                    className={`rounded-xl border-2 px-3 py-2 text-left text-xs font-medium transition-all ${
                      form.role === r.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card text-foreground"
                    }`}
                  >
                    <span className="mr-1">{r.emoji}</span>{r.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Country">
                <Select
                  value={form.country}
                  onChange={(v) => setForm((f) => ({ ...f, country: v, region: "" }))}
                  options={countries.map((c) => ({ value: c.name.replace(/\s.+$/, ""), label: c.name }))}
                />
              </Field>
              <Field label="Region / County">
                {form.country.startsWith("Kenya") || form.country === "Kenya" ? (
                  <Select
                    value={form.region}
                    onChange={(v) => setForm((f) => ({ ...f, region: v }))}
                    options={[{ value: "", label: "Select…" }, ...kenyanCounties.map((c) => ({ value: c, label: c }))]}
                  />
                ) : (
                  <input
                    value={form.region}
                    onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                    className="harvest-input"
                    placeholder="Region"
                  />
                )}
              </Field>
            </div>

            <Field label="Language">
              <Select
                value={form.language}
                onChange={(v) => setForm((f) => ({ ...f, language: v }))}
                options={languages.map((l) => ({ value: l.id, label: l.label }))}
              />
            </Field>

            {isFarmer && (
              <>
                <Field label="Farm scale">
                  <Select
                    value={form.farm_scale}
                    onChange={(v) => setForm((f) => ({ ...f, farm_scale: v }))}
                    options={[{ value: "", label: "Select…" }, ...farmScales.map((s) => ({ value: s.id, label: s.label }))]}
                  />
                </Field>

                <Field label="Farming activities">
                  <ChipGrid
                    items={farmingTypes.map((t) => ({ id: t.id, label: `${t.emoji} ${t.label}` }))}
                    selected={form.farming_activities}
                    onToggle={(id) => toggleArr("farming_activities", id)}
                  />
                </Field>

                <Field label="Primary crops">
                  <ChipGrid
                    items={cropOptions.map((c) => ({ id: c.id, label: `${c.emoji} ${c.label}` }))}
                    selected={form.primary_crops}
                    onToggle={(id) => toggleArr("primary_crops", id)}
                  />
                </Field>

                <Field label="Livestock">
                  <ChipGrid
                    items={livestockAnimals.map((a) => ({ id: a.id, label: `${a.emoji} ${a.label}` }))}
                    selected={form.livestock_types}
                    onToggle={(id) => toggleArr("livestock_types", id)}
                  />
                </Field>
              </>
            )}

            <Field label="Interests">
              <ChipGrid
                items={interestTopics.map((t) => ({ id: t.id, label: t.label }))}
                selected={form.interests}
                onToggle={(id) => toggleArr("interests", id)}
              />
            </Field>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={save}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="rounded-full border px-5 py-2.5 text-sm font-medium text-foreground"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {!isAuthenticated && (
          <div className="harvest-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Sign in to access your full profile and manage your farm.</p>
            <button onClick={() => navigate("/login")} className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
              Sign In
            </button>
          </div>
        )}

        {isAuthenticated && !editing && (
          <>
            <div className="space-y-1">
              {menuItems.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.03 }}
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-muted"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </>
        )}
      </div>
    </AppLayout>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="text-center">
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-[11px] text-muted-foreground">{label}</p>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-foreground">{label}</label>
    {children}
  </div>
);

const Select = ({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="harvest-input appearance-none pr-9"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
  </div>
);

const ChipGrid = ({ items, selected, onToggle }: {
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {items.map((item) => {
      const on = selected.includes(item.id);
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onToggle(item.id)}
          className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all ${
            on ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground"
          }`}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);

export default Profile;
