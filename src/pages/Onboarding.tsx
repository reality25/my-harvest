import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, ArrowRight, ArrowLeft, MapPin, Check } from "lucide-react";

const farmingTypes = [
  { id: "livestock", label: "Livestock Farming", emoji: "🐄" },
  { id: "crop", label: "Crop Farming", emoji: "🌾" },
  { id: "poultry", label: "Poultry Farming", emoji: "🐔" },
  { id: "fruit", label: "Fruit Farming", emoji: "🥭" },
  { id: "aquaculture", label: "Aquaculture", emoji: "🐟" },
  { id: "beekeeping", label: "Beekeeping", emoji: "🐝" },
  { id: "mixed", label: "Mixed Farming", emoji: "🌿" },
];

const farmScales = [
  { id: "garden", label: "Home Garden", desc: "Growing for personal/family use" },
  { id: "small", label: "Small Farm", desc: "Less than 5 acres" },
  { id: "medium", label: "Medium Farm", desc: "5–50 acres" },
  { id: "large", label: "Large Scale", desc: "Over 50 acres" },
];

const steps = [
  { title: "Welcome to Harvest", subtitle: "Let's personalize your experience" },
  { title: "What's your name?", subtitle: "We'll use this across the platform" },
  { title: "Where are you located?", subtitle: "For localized weather and market info" },
  { title: "What do you farm?", subtitle: "Select all that apply" },
  { title: "What's your farm scale?", subtitle: "This helps us tailor our tools" },
  { title: "You're all set! 🎉", subtitle: "Welcome to the Harvest community" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("Nairobi, Kenya");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedScale, setSelectedScale] = useState("");

  const toggleType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return location.trim().length > 0;
    if (step === 3) return selectedTypes.length > 0;
    if (step === 4) return selectedScale.length > 0;
    return true;
  };

  const next = () => {
    if (step === steps.length - 1) {
      navigate("/");
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex flex-1 flex-col"
          >
            <h1 className="font-display text-2xl font-bold text-foreground">
              {steps[step].title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{steps[step].subtitle}</p>

            <div className="mt-8 flex-1">
              {step === 0 && (
                <div className="flex flex-col items-center justify-center gap-6 py-12">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
                    <Leaf className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <p className="max-w-xs text-center text-sm text-muted-foreground leading-relaxed">
                    Harvest connects you with farmers, experts, weather data, markets, and tools — all in one place.
                  </p>
                </div>
              )}

              {step === 1 && (
                <div>
                  <label className="text-sm font-medium text-foreground">Your name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Wanjiku"
                    className="mt-2 w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {step === 2 && (
                <div>
                  <label className="text-sm font-medium text-foreground">Your location</label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Nakuru, Kenya"
                      className="w-full rounded-xl border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button className="mt-2 text-xs font-medium text-primary">
                    📍 Detect my location
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-2 gap-3">
                  {farmingTypes.map((type) => {
                    const selected = selectedTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        onClick={() => toggleType(type.id)}
                        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-primary/30"
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

              {step === 4 && (
                <div className="space-y-3">
                  {farmScales.map((scale) => (
                    <button
                      key={scale.id}
                      onClick={() => setSelectedScale(scale.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                        selectedScale === scale.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-foreground">{scale.label}</p>
                        <p className="text-xs text-muted-foreground">{scale.desc}</p>
                      </div>
                      {selectedScale === scale.id && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {step === 5 && (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="text-5xl">🌾</div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                    Your personalized farming dashboard is ready. Connect with farmers, check weather, and grow smarter.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={next}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {step === steps.length - 1 ? "Get Started" : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
