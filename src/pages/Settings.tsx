import AppLayout from "@/components/AppLayout";
import { ArrowLeft, Moon, Sun, Bell, Lock, User, ChevronRight, MapPin, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { countries, kenyanCounties } from "@/components/onboarding/locationData";
import { useManualLocation } from "@/hooks/useManualLocation";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const [notifPrefs, setNotifPrefs] = useState({
    likes: true,
    comments: true,
    follows: true,
    marketplace: true,
    alerts: true,
  });

  const [privacyPrefs, setPrivacyPrefs] = useState({
    profilePublic: true,
    showLocation: true,
    showFarmDetails: true,
  });

  // Manual location override (any user can set this)
  const { location: manualLoc, setLocation: setManualLoc } = useManualLocation();
  const [locCountry, setLocCountry] = useState(manualLoc?.countryCode ?? "KE");
  const [locRegion, setLocRegion] = useState(manualLoc?.region ?? "");

  useEffect(() => {
    setLocCountry(manualLoc?.countryCode ?? "KE");
    setLocRegion(manualLoc?.region ?? "");
  }, [manualLoc]);

  const selectedCountry = countries.find((c) => c.id === locCountry) ?? countries[0];

  const saveLocation = () => {
    if (!locRegion.trim()) {
      toast.error("Please enter your " + selectedCountry.regionLabel.toLowerCase());
      return;
    }
    setManualLoc({
      country: selectedCountry.name.replace(/\s.+$/, ""), // strip emoji
      countryCode: selectedCountry.id,
      region: locRegion.trim(),
    });
    toast.success("Location saved — weather and news will refresh");
  };

  const clearLocation = () => {
    setManualLoc(null);
    setLocRegion("");
    toast.success("Using device location again");
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );

  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>

        {/* Theme */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="harvest-card p-4">
          <div className="flex items-center gap-3 mb-3">
            {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Dark Mode</p>
              <p className="text-[11px] text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <ToggleSwitch checked={darkMode} onChange={setDarkMode} />
          </div>
        </motion.div>

        {/* Location */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="harvest-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Location</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            Set your location manually so weather, news, and AI advice are accurate even when GPS is off.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Country</label>
              <select
                value={locCountry}
                onChange={(e) => { setLocCountry(e.target.value); setLocRegion(""); }}
                className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                {selectedCountry.regionLabel}
              </label>
              {locCountry === "KE" ? (
                <select
                  value={locRegion}
                  onChange={(e) => setLocRegion(e.target.value)}
                  className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="">Select a county…</option>
                  {kenyanCounties.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={locRegion}
                  onChange={(e) => setLocRegion(e.target.value)}
                  placeholder={`Enter your ${selectedCountry.regionLabel.toLowerCase()}`}
                  className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                />
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={saveLocation}
                className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90"
              >
                <Check className="h-4 w-4" />
                Save location
              </button>
              {manualLoc && (
                <button
                  onClick={clearLocation}
                  className="h-11 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-muted"
                >
                  Use GPS
                </button>
              )}
            </div>

            {manualLoc && (
              <p className="text-[11px] text-muted-foreground">
                Currently pinned to <span className="font-medium text-foreground">{manualLoc.region}, {manualLoc.country}</span>
              </p>
            )}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="harvest-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(notifPrefs).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <p className="text-sm capitalize text-foreground">{key === "marketplace" ? "Marketplace activity" : key === "alerts" ? "Regional alerts" : key}</p>
                <ToggleSwitch
                  checked={value}
                  onChange={(v) => setNotifPrefs((p) => ({ ...p, [key]: v }))}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Privacy */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="harvest-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Privacy</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Public profile</p>
              <ToggleSwitch checked={privacyPrefs.profilePublic} onChange={(v) => setPrivacyPrefs((p) => ({ ...p, profilePublic: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Show location</p>
              <ToggleSwitch checked={privacyPrefs.showLocation} onChange={(v) => setPrivacyPrefs((p) => ({ ...p, showLocation: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Show farm details</p>
              <ToggleSwitch checked={privacyPrefs.showFarmDetails} onChange={(v) => setPrivacyPrefs((p) => ({ ...p, showFarmDetails: v }))} />
            </div>
          </div>
        </motion.div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="harvest-card">
          <button
            onClick={() => navigate("/profile")}
            className="flex w-full items-center gap-3 p-4"
          >
            <User className="h-5 w-5 text-primary" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Edit Profile</p>
              <p className="text-[11px] text-muted-foreground">Update your name, location, and farming details</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Settings;
