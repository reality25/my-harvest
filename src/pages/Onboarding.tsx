import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  Leaf, ArrowRight, ArrowLeft, MapPin, Check, Globe, ChevronDown,
  User as UserIcon, Languages, Sparkles,
} from "lucide-react";
import OnboardingStepWrapper from "@/components/onboarding/OnboardingStepWrapper";
import FollowUpSteps from "@/components/onboarding/FollowUpSteps";
import {
  farmingTypes, farmScales, defaultOnboardingData, userRoles, languages,
  interestTopics, type OnboardingData,
} from "@/components/onboarding/onboardingData";
import { kenyanCounties, countries, type LocationData } from "@/components/onboarding/locationData";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/lib/supabaseService";
import { toast } from "sonner";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, updateUser, setOnboardingComplete } = useAuth();

  // Pre-fill from existing user so editing is non-destructive
  const [data, setData] = useState<OnboardingData>({
    ...defaultOnboardingData,
    name:              user?.name || "",
    role:              (user?.role as OnboardingData["role"]) || "",
    language:          user?.language || "en",
    selectedTypes:     user?.farmingActivities || [],
    selectedScale:     user?.farmScale || "",
    selectedInterests: user?.interests || [],
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [locationData, setLocationData] = useState<LocationData>({
    country:     user?.country ? guessCountryCode(user.country) : "KE",
    countryCode: user?.country ? guessCountryCode(user.country) : "KE",
    region:      user?.region || "",
  });

  const isFarmer = data.role === "farmer" || data.role === ""; // "" treated as farmer-style flow

  const steps = useMemo(() => {
    const base = [
      { id: "welcome",  title: "Welcome to Harvest",      subtitle: "Let's personalize your experience" },
      { id: "name",     title: "What should we call you?", subtitle: "We'll show this on your profile" },
      { id: "role",     title: "What best describes you?", subtitle: "We'll tailor the app to fit" },
      { id: "location", title: "Where are you located?",   subtitle: "For localized weather and market info" },
      { id: "language", title: "Preferred language",       subtitle: "We'll use this where translations are available" },
    ];

    const farmerSteps = isFarmer ? [
      { id: "types", title: "What do you farm?",  subtitle: "Select all that apply — skip if none" },
      ...data.selectedTypes
        .filter((t) => ["livestock", "poultry", "crop", "fruit", "aquaculture", "beekeeping"].includes(t))
        .map((t) => {
          const type = farmingTypes.find((ft) => ft.id === t);
          return {
            id: `followup-${t}`,
            title: `${type?.emoji} ${type?.label} Details`,
            subtitle: "Tell us more to personalize your advice",
          };
        }),
      { id: "scale", title: "What's your farm scale?", subtitle: "This helps us tailor our tools" },
    ] : [];

    return [
      ...base,
      ...farmerSteps,
      { id: "interests", title: "What are you interested in?", subtitle: "We'll surface news and tips on these topics" },
      { id: "done",      title: "You're all set! 🎉",          subtitle: "Welcome to the Harvest community" },
    ];
  }, [data.selectedTypes, isFarmer]);

  const currentStep = steps[stepIndex];
  const isLastStep  = stepIndex === steps.length - 1;
  const isFirstStep = stepIndex === 0;

  const finish = async () => {
    setSaving(true);
    const country = countries.find(c => c.id === locationData.countryCode);
    const countryName = country?.name.replace(/\s.+$/, "") || "";
    const locationString = locationData.region
      ? `${locationData.region}, ${countryName || locationData.countryCode}`
      : countryName;

    if (user) {
      // Optimistic local update
      updateUser({
        name:              data.name || user.name,
        role:              (data.role || user.role) as typeof user.role,
        location:          locationString || user.location,
        country:           countryName || user.country,
        region:            locationData.region || user.region,
        farmScale:         data.selectedScale || user.farmScale,
        language:          data.language,
        farmingActivities: data.selectedTypes.length ? data.selectedTypes : user.farmingActivities,
        interests:         data.selectedInterests.length ? data.selectedInterests : user.interests,
        primaryCrops:      data.crops.length ? data.crops : user.primaryCrops,
        livestockTypes:    data.livestockAnimals.length ? data.livestockAnimals : user.livestockTypes,
      });

      // Persist to Supabase. Defensive: extended columns silently no-op
      // before the personalization migration runs.
      try {
        await updateProfile(user.id, {
          full_name:            data.name || undefined,
          role:                 data.role || undefined,
          country:              countryName || undefined,
          region:               locationData.region || undefined,
          farm_scale:           data.selectedScale || undefined,
          language:             data.language || undefined,
          farming_activities:   data.selectedTypes.length ? data.selectedTypes : undefined,
          primary_crops:        data.crops.length ? data.crops : undefined,
          livestock_types:      data.livestockAnimals.length ? data.livestockAnimals : undefined,
          interests:            data.selectedInterests.length ? data.selectedInterests : undefined,
          farm_size:            data.selectedScale || undefined,
          onboarding_completed: true,
        });
        toast.success("Profile saved");
      } catch (err) {
        console.warn("[onboarding] save failed", err);
        toast.error("Saved locally — couldn't reach the server");
      }
    }

    setOnboardingComplete();
    setSaving(false);
    navigate("/");
  };

  const next = () => {
    if (isLastStep) { finish(); return; }
    setStepIndex((s) => Math.min(s + 1, steps.length - 1));
  };
  const skip = () => {
    if (isLastStep) { finish(); return; }
    setStepIndex((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => setStepIndex((s) => Math.max(s - 1, 0));

  const toggle = (key: "selectedTypes" | "selectedInterests", id: string) => {
    setData((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((t) => t !== id) : [...prev[key], id],
    }));
  };

  const selectedCountry = countries.find(c => c.id === locationData.countryCode);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="px-4 pt-4">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground text-right">
          Step {stepIndex + 1} of {steps.length}
        </p>
      </div>

      <div className="flex flex-1 flex-col px-6 py-6">
        <AnimatePresence mode="wait">
          <OnboardingStepWrapper key={currentStep.id} title={currentStep.title} subtitle={currentStep.subtitle}>
            {currentStep.id === "welcome" && (
              <div className="flex flex-col items-center justify-center gap-6 py-12">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
                  <Leaf className="h-10 w-10 text-primary-foreground" />
                </div>
                <p className="max-w-xs text-center text-sm text-muted-foreground leading-relaxed">
                  Harvest connects you with farmers, experts, weather data, markets, and tools — all in one place.
                </p>
                <p className="text-xs text-muted-foreground">All questions are optional — skip any time</p>
              </div>
            )}

            {currentStep.id === "name" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  <UserIcon className="mr-1 inline h-4 w-4" /> Full name
                </label>
                <input
                  value={data.name}
                  onChange={(e) => setData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {currentStep.id === "role" && (
              <div className="space-y-2.5">
                {userRoles.map((r) => {
                  const selected = data.role === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setData(p => ({ ...p, role: r.id }))}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3.5 transition-all text-left ${
                        selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <span className="text-2xl">{r.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{r.label}</p>
                        <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                      </div>
                      {selected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {currentStep.id === "location" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    <Globe className="mr-1 inline h-4 w-4" /> Country
                  </label>
                  <div className="relative">
                    <select
                      value={locationData.countryCode}
                      onChange={(e) => setLocationData({ country: e.target.value, countryCode: e.target.value, region: "" })}
                      className="w-full appearance-none rounded-xl border bg-card px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    <MapPin className="mr-1 inline h-4 w-4" /> {selectedCountry?.regionLabel || "Region"}
                  </label>
                  {locationData.countryCode === "KE" ? (
                    <div className="relative">
                      <select
                        value={locationData.region}
                        onChange={(e) => setLocationData(prev => ({ ...prev, region: e.target.value }))}
                        className="w-full appearance-none rounded-xl border bg-card px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select county...</option>
                        {kenyanCounties.map((county) => (
                          <option key={county} value={county}>{county}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : (
                    <input
                      value={locationData.region}
                      onChange={(e) => setLocationData(prev => ({ ...prev, region: e.target.value }))}
                      placeholder={`Enter your ${selectedCountry?.regionLabel?.toLowerCase() || "region"}`}
                      className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}
                </div>
              </div>
            )}

            {currentStep.id === "language" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  <Languages className="mr-1 inline h-4 w-4" /> Preferred language
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((l) => {
                    const selected = data.language === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => setData(p => ({ ...p, language: l.id }))}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                          selected ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:border-primary/30"
                        }`}
                      >
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep.id === "types" && (
              <div className="grid grid-cols-2 gap-3">
                {farmingTypes.map((type) => {
                  const selected = data.selectedTypes.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      onClick={() => toggle("selectedTypes", type.id)}
                      className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                        selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      {selected && (
                        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <span className="text-2xl">{type.emoji}</span>
                      <span className="text-xs font-medium text-foreground">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentStep.id.startsWith("followup-") && (
              <FollowUpSteps
                data={data}
                setData={setData}
                activityType={currentStep.id.replace("followup-", "")}
              />
            )}

            {currentStep.id === "scale" && (
              <div className="space-y-3">
                {farmScales.map((scale) => (
                  <button
                    key={scale.id}
                    onClick={() => setData((p) => ({ ...p, selectedScale: scale.id }))}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                      data.selectedScale === scale.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-foreground">{scale.label}</p>
                      <p className="text-xs text-muted-foreground">{scale.desc}</p>
                    </div>
                    {data.selectedScale === scale.id && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {currentStep.id === "interests" && (
              <div className="grid grid-cols-2 gap-2">
                {interestTopics.map((t) => {
                  const selected = data.selectedInterests.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggle("selectedInterests", t.id)}
                      className={`relative rounded-xl border-2 px-3 py-3 text-sm font-medium text-left transition-all ${
                        selected ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:border-primary/30"
                      }`}
                    >
                      {selected && (
                        <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                      {t.label}
                    </button>
                  );
                })}
              </div>
            )}

            {currentStep.id === "done" && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <Sparkles className="h-12 w-12 text-primary" />
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  Your personalized dashboard is ready. Weather, news, AI advice, and alerts will now be tailored to {data.name || "you"}.
                </p>
              </div>
            )}
          </OnboardingStepWrapper>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-6">
          {!isFirstStep ? (
            <button onClick={back} className="flex items-center gap-1 text-sm font-medium text-muted-foreground" disabled={saving}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {currentStep.id !== "welcome" && currentStep.id !== "done" && (
              <button
                onClick={skip}
                disabled={saving}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Skip
              </button>
            )}
            <button
              onClick={next}
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {isLastStep ? (saving ? "Saving..." : "Get Started") : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {currentStep.id === "welcome" && (
          <button
            onClick={() => { setOnboardingComplete(); navigate("/"); }}
            className="mt-3 text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Skip onboarding for now
          </button>
        )}
      </div>
    </div>
  );
};

function guessCountryCode(name: string): string {
  const map: Record<string, string> = {
    Kenya: "KE", Uganda: "UG", Tanzania: "TZ", Rwanda: "RW",
    Ethiopia: "ET", Burundi: "BI", "South Sudan": "SS", Somalia: "SO",
  };
  return map[name] ?? "KE";
}

export default Onboarding;
