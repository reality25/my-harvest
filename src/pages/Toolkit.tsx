import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wheat, Droplets, TrendingUp, DollarSign, Bot,
  ChevronDown, ChevronUp, AlertTriangle, ArrowRight,
  RefreshCw, Syringe, BookmarkCheck, Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Bug as Cow } from "lucide-react";
import { toast } from "sonner";

// ─── Fertilizer data ──────────────────────────────────────
const FERT_DATA: Record<string, { dap: number; can: number; notes: string }> = {
  maize:     { dap: 50, can: 50, notes: "Top-dress CAN at knee height (4–6 weeks)" },
  wheat:     { dap: 50, can: 50, notes: "Split CAN into 2 applications" },
  rice:      { dap: 40, can: 40, notes: "Apply urea at tillering and panicle initiation" },
  potato:    { dap: 100, can: 50, notes: "High-demand crop — split CAN into 2 doses" },
  bean:      { dap: 40, can: 0, notes: "Legume — no N top-dressing needed" },
  soybean:   { dap: 40, can: 0, notes: "Fix own nitrogen — apply only phosphorus" },
  tomato:    { dap: 60, can: 60, notes: "Frequent small applications throughout season" },
  sorghum:   { dap: 40, can: 40, notes: "Drought-tolerant; reduce by 20% in dry areas" },
  cabbage:   { dap: 50, can: 60, notes: "Heavy nitrogen feeder — apply CAN in 3 splits" },
  sunflower: { dap: 40, can: 40, notes: "Apply DAP at planting; CAN at 30–35 days" },
};
const DAP_PRICE = 4000;  // KES per 50kg bag
const CAN_PRICE = 3000;  // KES per 50kg bag

// ─── Feed data ─────────────────────────────────────────────
const FEED_DATA: Record<string, { pct: number; fixed?: number; unit: string; notes: string }> = {
  "Dairy cattle":     { pct: 3.5, unit: "kg/day", notes: "Increase by 1 kg per 3 litres of milk" },
  "Beef cattle":      { pct: 2.5, unit: "kg/day", notes: "Adjust upward for fast-growing breeds" },
  "Goat":             { pct: 4.0, unit: "kg/day", notes: "Mix browse with 30% concentrate" },
  "Sheep":            { pct: 3.5, unit: "kg/day", notes: "Reduce 20% on good pasture" },
  "Pig (grower)":     { pct: 3.0, unit: "kg/day", notes: "High-energy diet — include maize bran" },
  "Broiler chicken":  { fixed: 0.1, pct: 0, unit: "kg/bird/day", notes: "~15% protein grower mash" },
  "Layer chicken":    { fixed: 0.12, pct: 0, unit: "kg/bird/day", notes: "Include extra calcium for shells" },
  "Tilapia":          { pct: 3.0, unit: "kg/day", notes: "Feed 2–3× daily; adjust to feed conversion" },
};

// ─── Crop irrigation needs (mm/day peak season) ──────────
const IRRIG_DATA: Record<string, { mmDay: number }> = {
  maize: { mmDay: 6 }, wheat: { mmDay: 5 }, rice: { mmDay: 8 },
  potato: { mmDay: 6 }, tomato: { mmDay: 7 }, bean: { mmDay: 4 },
  sorghum: { mmDay: 4 }, cabbage: { mmDay: 5 }, default: { mmDay: 5 },
};
const IRRIG_EFFICIENCY = { drip: 0.90, sprinkler: 0.75, furrow: 0.60 };
const ACRE_M2 = 4047;

// ─── Yield data (90 kg bags/acre) ────────────────────────
const YIELD_DATA: Record<string, {
  conv: [number, number]; improved: [number, number]; certified: [number, number];
  unit: string; price: number;
}> = {
  maize:     { conv: [15, 20], improved: [25, 35], certified: [35, 50], unit: "90kg bags", price: 3500 },
  wheat:     { conv: [10, 15], improved: [18, 25], certified: [25, 35], unit: "90kg bags", price: 4500 },
  bean:      { conv: [4, 6],   improved: [8, 12],  certified: [12, 18], unit: "90kg bags", price: 12000 },
  potato:    { conv: [50, 70], improved: [80, 120], certified: [120, 180], unit: "50kg bags", price: 1500 },
  rice:      { conv: [20, 25], improved: [35, 45], certified: [45, 60], unit: "90kg bags", price: 8000 },
  sorghum:   { conv: [10, 15], improved: [18, 25], certified: [25, 35], unit: "90kg bags", price: 3000 },
  tomato:    { conv: [4000, 6000], improved: [8000, 12000], certified: [12000, 18000], unit: "kg", price: 50 },
};

// ─── Sub-components ───────────────────────────────────────

function ResultBox({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
      {title && <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-primary">{title}</p>}
      {children}
    </div>
  );
}
function ResultRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
function Input({ label, value, onChange, type = "text", placeholder = "", children }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; children?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-foreground">{label}</label>
      {children ?? (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      )}
    </div>
  );
}
function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Input label={label} value={value} onChange={onChange}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Input>
  );
}

// ─── Fertilizer Calculator ────────────────────────────────
function FertilizerCalc() {
  const [crop, setCrop] = useState("maize");
  const [area, setArea] = useState("1");
  const [unit, setUnit] = useState("acres");

  const acres = parseFloat(area) * (unit === "hectares" ? 2.471 : 1);
  const data = FERT_DATA[crop] ?? { dap: 50, can: 50, notes: "Apply at recommended rates for your crop" };
  const totalDap = Math.round(data.dap * acres);
  const totalCan = Math.round(data.can * acres);
  const dapBags = Math.ceil(totalDap / 50);
  const canBags = Math.ceil(totalCan / 50);
  const totalCost = dapBags * DAP_PRICE + canBags * CAN_PRICE;

  return (
    <div className="space-y-3">
      <Select
        label="Crop type"
        value={crop}
        onChange={setCrop}
        options={Object.keys(FERT_DATA).map(k => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Farm size" value={area} onChange={setArea} type="number" placeholder="1" />
        <Select label="Unit" value={unit} onChange={setUnit} options={[{ value: "acres", label: "Acres" }, { value: "hectares", label: "Hectares" }]} />
      </div>

      {area && parseFloat(area) > 0 && (
        <ResultBox title="Recommended Inputs">
          <ResultRow label="DAP (planting)" value={`${totalDap} kg`} sub={`${dapBags} × 50kg bags`} />
          {totalCan > 0 && <ResultRow label="CAN (top-dress)" value={`${totalCan} kg`} sub={`${canBags} × 50kg bags`} />}
          <ResultRow label="Estimated cost" value={`KES ${totalCost.toLocaleString()}`} />
          <p className="mt-3 text-[11px] text-primary leading-relaxed">💡 {data.notes}</p>
        </ResultBox>
      )}
    </div>
  );
}

// ─── Feed Calculator ──────────────────────────────────────
function FeedCalc() {
  const [animalType, setAnimalType] = useState("Dairy cattle");
  const [count, setCount] = useState("10");
  const [weight, setWeight] = useState("400");

  const data = FEED_DATA[animalType];
  const n = parseFloat(count) || 0;
  const w = parseFloat(weight) || 0;
  const dailyPerHead = data.fixed ? data.fixed : (w * data.pct) / 100;
  const totalDaily = dailyPerHead * n;
  const weekly = totalDaily * 7;
  const monthly = totalDaily * 30;

  const showWeight = !data.fixed;

  return (
    <div className="space-y-3">
      <Select
        label="Animal type"
        value={animalType}
        onChange={setAnimalType}
        options={Object.keys(FEED_DATA).map(k => ({ value: k, label: k }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Number of animals" value={count} onChange={setCount} type="number" placeholder="10" />
        {showWeight && (
          <Input label="Avg weight (kg)" value={weight} onChange={setWeight} type="number" placeholder="400" />
        )}
      </div>

      {n > 0 && (
        <ResultBox title="Daily Feed Requirements">
          <ResultRow label="Per animal / day" value={`${dailyPerHead.toFixed(1)} ${data.unit}`} />
          <ResultRow label="Total herd / day" value={`${totalDaily.toFixed(1)} kg`} />
          <ResultRow label="Weekly total" value={`${weekly.toFixed(0)} kg`} />
          <ResultRow label="Monthly estimate" value={`${monthly.toFixed(0)} kg`} />
          <p className="mt-3 text-[11px] text-primary leading-relaxed">💡 {data.notes}</p>
        </ResultBox>
      )}
    </div>
  );
}

// ─── Irrigation Calculator ────────────────────────────────
function IrrigationCalc() {
  const [crop, setIrrigCrop] = useState("maize");
  const [area, setIrrigArea] = useState("1");
  const [unit, setIrrigUnit] = useState("acres");
  const [system, setSystem] = useState("drip");

  const acres = parseFloat(area) * (unit === "hectares" ? 2.471 : 1);
  const { mmDay } = IRRIG_DATA[crop] ?? IRRIG_DATA.default;
  const efficiency = IRRIG_EFFICIENCY[system as keyof typeof IRRIG_EFFICIENCY];
  const areaM2 = acres * ACRE_M2;
  const rawLitres = mmDay * areaM2;
  const adjustedLitres = Math.round(rawLitres / efficiency);
  const weeklyM3 = ((adjustedLitres * 7) / 1000).toFixed(1);

  return (
    <div className="space-y-3">
      <Select
        label="Crop type"
        value={crop}
        onChange={setIrrigCrop}
        options={Object.keys(IRRIG_DATA).filter(k => k !== "default").map(k => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Farm size" value={area} onChange={setIrrigArea} type="number" placeholder="1" />
        <Select label="Unit" value={unit} onChange={setIrrigUnit} options={[{ value: "acres", label: "Acres" }, { value: "hectares", label: "Hectares" }]} />
      </div>
      <Select
        label="Irrigation system"
        value={system}
        onChange={setSystem}
        options={[
          { value: "drip", label: "Drip Irrigation (90% efficiency)" },
          { value: "sprinkler", label: "Sprinkler (75% efficiency)" },
          { value: "furrow", label: "Furrow / Flood (60% efficiency)" },
        ]}
      />

      {area && parseFloat(area) > 0 && (
        <ResultBox title="Daily Water Needs">
          <ResultRow label="Net crop need" value={`${(rawLitres / 1000).toFixed(1)} m³/day`} sub={`${mmDay}mm/day × ${(acres * ACRE_M2).toFixed(0)} m²`} />
          <ResultRow label="With system losses" value={`${(adjustedLitres / 1000).toFixed(1)} m³/day`} sub={`${adjustedLitres.toLocaleString()} litres`} />
          <ResultRow label="Weekly total" value={`${weeklyM3} m³`} />
          <p className="mt-3 text-[11px] text-primary">💡 Drip irrigation saves up to 40% water vs furrow — best for tomato & potato.</p>
        </ResultBox>
      )}
    </div>
  );
}

// ─── Yield Estimator ─────────────────────────────────────
function YieldEstimator() {
  const [crop, setYieldCrop] = useState("maize");
  const [area, setYieldArea] = useState("1");
  const [unit, setYieldUnit] = useState("acres");
  const [practice, setPractice] = useState("improved");

  const acres = parseFloat(area) * (unit === "hectares" ? 2.471 : 1);
  const data = YIELD_DATA[crop];

  if (!data) return null;

  const range = data[practice as "conv" | "improved" | "certified"] as [number, number];
  const minYield = Math.round(range[0] * acres);
  const maxYield = Math.round(range[1] * acres);
  const minRevenue = Math.round(minYield * data.price);
  const maxRevenue = Math.round(maxYield * data.price);

  return (
    <div className="space-y-3">
      <Select
        label="Crop type"
        value={crop}
        onChange={setYieldCrop}
        options={Object.keys(YIELD_DATA).map(k => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Farm size" value={area} onChange={setYieldArea} type="number" placeholder="1" />
        <Select label="Unit" value={unit} onChange={setYieldUnit} options={[{ value: "acres", label: "Acres" }, { value: "hectares", label: "Hectares" }]} />
      </div>
      <Select
        label="Farming practice"
        value={practice}
        onChange={setPractice}
        options={[
          { value: "conv", label: "Conventional (local seeds, minimal inputs)" },
          { value: "improved", label: "Improved (hybrid seeds, fertilizer)" },
          { value: "certified", label: "Certified (optimal inputs + management)" },
        ]}
      />

      {area && parseFloat(area) > 0 && (
        <ResultBox title="Yield & Revenue Estimate">
          <ResultRow label="Expected yield" value={`${minYield}–${maxYield} ${data.unit}`} />
          <ResultRow label="Est. market revenue" value={`KES ${minRevenue.toLocaleString()}–${maxRevenue.toLocaleString()}`} sub={`@ KES ${data.price}/unit`} />
          <p className="mt-3 text-[11px] text-primary">
            💡 Switch to certified inputs to potentially double your yield. Consider input financing if costs are a barrier.
          </p>
        </ResultBox>
      )}
    </div>
  );
}

// ─── Profit Calculator ───────────────────────────────────
function ProfitCalc() {
  const [yield_, setYield] = useState("");
  const [yieldUnit, setYieldUnit] = useState("bags");
  const [price, setPrice] = useState("");
  const [inputCosts, setInputCosts] = useState("");
  const [laborCosts, setLaborCosts] = useState("");

  const yieldNum = parseFloat(yield_) || 0;
  const priceNum = parseFloat(price) || 0;
  const inputs = parseFloat(inputCosts) || 0;
  const labor = parseFloat(laborCosts) || 0;

  const revenue = yieldNum * priceNum;
  const totalCosts = inputs + labor;
  const profit = revenue - totalCosts;
  const roi = totalCosts > 0 ? ((profit / totalCosts) * 100) : 0;
  const breakEven = yieldNum > 0 ? totalCosts / yieldNum : 0;
  const isProfit = profit >= 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Expected yield" value={yield_} onChange={setYield} type="number" placeholder="30" />
        <Select label="Unit" value={yieldUnit} onChange={setYieldUnit} options={[
          { value: "bags", label: "Bags (90kg)" },
          { value: "kg", label: "Kilograms" },
          { value: "tonnes", label: "Tonnes" },
        ]} />
      </div>
      <Input label="Market price (KES per unit)" value={price} onChange={setPrice} type="number" placeholder="3500" />
      <Input label="Input costs (KES) — seeds, fertilizer, chemicals" value={inputCosts} onChange={setInputCosts} type="number" placeholder="15000" />
      <Input label="Labor costs (KES)" value={laborCosts} onChange={setLaborCosts} type="number" placeholder="8000" />

      {yieldNum > 0 && priceNum > 0 && (
        <ResultBox title="Financial Summary">
          <ResultRow label="Gross revenue" value={`KES ${revenue.toLocaleString()}`} />
          <ResultRow label="Total costs" value={`KES ${totalCosts.toLocaleString()}`} />
          <div className={`mt-2 flex items-center justify-between rounded-lg px-3 py-2 ${isProfit ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            <span className="text-sm font-semibold">{isProfit ? "Net Profit" : "Net Loss"}</span>
            <span className="text-sm font-bold">KES {Math.abs(profit).toLocaleString()}</span>
          </div>
          {totalCosts > 0 && <ResultRow label="Return on investment" value={`${roi.toFixed(0)}%`} />}
          {yieldNum > 0 && totalCosts > 0 && <ResultRow label="Break-even price" value={`KES ${breakEven.toFixed(0)}/unit`} />}
          {!isProfit && (
            <p className="mt-3 text-[11px] text-red-700">
              ⚠️ Review your input costs or target markets with higher prices to reach profitability.
            </p>
          )}
          {isProfit && roi > 50 && (
            <p className="mt-3 text-[11px] text-green-700">
              ✅ Strong returns! Consider reinvesting a portion into improving next season's inputs.
            </p>
          )}
        </ResultBox>
      )}
    </div>
  );
}

// ─── Vaccination Scheduler ───────────────────────────────
const VACCINE_SCHEDULES: Record<string, { vaccine: string; interval: string; notes: string; priority: "routine" | "seasonal" | "required" }[]> = {
  "Dairy cattle": [
    { vaccine: "Foot & Mouth Disease (FMD)", interval: "Every 6 months", notes: "Mandatory in Kenya — certificate required for movement", priority: "required" },
    { vaccine: "Lumpy Skin Disease", interval: "Annually", notes: "Critical during rainy season — insect-borne", priority: "seasonal" },
    { vaccine: "Blackleg (Clostridial)", interval: "Annually", notes: "Vaccinate calves at 3 months then annually", priority: "routine" },
    { vaccine: "Brucellosis (heifers)", interval: "Once at 3–6 months", notes: "One-time vaccination for heifers only", priority: "required" },
    { vaccine: "East Coast Fever (ECF)", interval: "Once (immunization)", notes: "Tick-borne — one-time living vaccine in ECF zones", priority: "routine" },
  ],
  "Beef cattle": [
    { vaccine: "FMD", interval: "Every 6 months", notes: "Required for livestock movement in Kenya", priority: "required" },
    { vaccine: "Lumpy Skin Disease", interval: "Annually", notes: "Especially before long rains (March)", priority: "seasonal" },
    { vaccine: "Anthrax", interval: "Annually", notes: "In Anthrax-endemic areas only", priority: "seasonal" },
    { vaccine: "Blackleg", interval: "Annually", notes: "In high-risk or previously affected areas", priority: "routine" },
  ],
  "Goat": [
    { vaccine: "CCPP (Contagious Caprine Pleuropneumonia)", interval: "Annually", notes: "Highly contagious — vaccinate whole herd", priority: "required" },
    { vaccine: "Peste des Petits Ruminants (PPR)", interval: "Every 3 years", notes: "Once-every-3-year schedule after primary dose", priority: "required" },
    { vaccine: "Foot & Mouth (if in risk zone)", interval: "Every 6 months", notes: "Required in FMD-risk areas near cattle", priority: "seasonal" },
    { vaccine: "Enterotoxemia (Clostridium)", interval: "Annually", notes: "Before rainy season when pasture changes", priority: "routine" },
  ],
  "Sheep": [
    { vaccine: "PPR", interval: "Every 3 years", notes: "Critical — high mortality if unvaccinated", priority: "required" },
    { vaccine: "Enterotoxemia", interval: "Annually", notes: "Especially for lambs before weaning", priority: "routine" },
    { vaccine: "Rift Valley Fever (RVF)", interval: "Every 3 years", notes: "Vaccinate before flooding/rainy season if in risk area", priority: "seasonal" },
  ],
  "Pig (grower)": [
    { vaccine: "African Swine Fever (ASF)", interval: "No vaccine — biosecurity only", notes: "Control through movement restrictions and hygiene", priority: "routine" },
    { vaccine: "Erysipelas", interval: "Twice yearly", notes: "2 doses 3–4 weeks apart initially, then every 6 months", priority: "routine" },
    { vaccine: "Parvovirus (sows)", interval: "Before each breeding", notes: "Prevents reproductive failure", priority: "routine" },
  ],
  "Broiler chicken": [
    { vaccine: "Newcastle Disease (ND)", interval: "Day 7, 21, then every 2 months", notes: "Critical — wipe-out risk; use eye-drop method", priority: "required" },
    { vaccine: "Gumboro (IBD)", interval: "Day 10 and 24", notes: "Causes immunosuppression — protects other vaccines", priority: "required" },
    { vaccine: "Marek's Disease", interval: "At hatchery (day 1)", notes: "Usually done at hatchery; confirm with supplier", priority: "routine" },
  ],
  "Layer chicken": [
    { vaccine: "Newcastle Disease", interval: "Every 6–8 weeks", notes: "Continuous vaccination throughout layer cycle", priority: "required" },
    { vaccine: "Gumboro", interval: "Day 10 and 24", notes: "Critical for pullets before 6 weeks", priority: "required" },
    { vaccine: "Infectious Bronchitis", interval: "Every 8 weeks", notes: "Protects respiratory and reproductive tract", priority: "routine" },
    { vaccine: "Fowl Pox", interval: "Once at 8–10 weeks", notes: "Wing-web stab method; check take at 7 days", priority: "seasonal" },
  ],
};

const PRIORITY_COLORS = {
  required: "bg-red-100 text-red-700",
  seasonal: "bg-amber-100 text-amber-700",
  routine:  "bg-blue-100 text-blue-700",
};

const SAVED_VACC_KEY = "harvest_vacc_records";

interface VaccRecord {
  id: string;
  animal: string;
  vaccine: string;
  date: string;
  nextDue: string;
  notes: string;
}

function loadVaccRecords(): VaccRecord[] {
  try { return JSON.parse(localStorage.getItem(SAVED_VACC_KEY) || "[]"); } catch { return []; }
}

function VaccinationScheduler() {
  const [animal, setAnimal] = useState("Dairy cattle");
  const [showLog, setShowLog] = useState(false);
  const [records, setRecords] = useState<VaccRecord[]>(loadVaccRecords);
  const [logVaccine, setLogVaccine] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logNotes, setLogNotes] = useState("");

  const schedule = VACCINE_SCHEDULES[animal] ?? [];

  const addRecord = () => {
    if (!logVaccine.trim()) return;
    const record: VaccRecord = {
      id: crypto.randomUUID(),
      animal,
      vaccine: logVaccine.trim(),
      date: logDate,
      nextDue: "",
      notes: logNotes.trim(),
    };
    const updated = [record, ...records];
    setRecords(updated);
    localStorage.setItem(SAVED_VACC_KEY, JSON.stringify(updated));
    setLogVaccine(""); setLogNotes("");
    setShowLog(false);
    toast.success("Vaccination record saved!");
  };

  const deleteRecord = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem(SAVED_VACC_KEY, JSON.stringify(updated));
  };

  const animalRecords = records.filter(r => r.animal === animal);

  return (
    <div className="space-y-4">
      <Select
        label="Animal type"
        value={animal}
        onChange={setAnimal}
        options={Object.keys(VACCINE_SCHEDULES).map(k => ({ value: k, label: k }))}
      />

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recommended Schedule</p>
        {schedule.map((v, i) => (
          <div key={i} className="rounded-xl border bg-background p-3 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{v.vaccine}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${PRIORITY_COLORS[v.priority]}`}>{v.priority}</span>
            </div>
            <p className="text-[11px] text-primary font-medium">⏰ {v.interval}</p>
            <p className="text-[11px] text-muted-foreground leading-snug">💡 {v.notes}</p>
          </div>
        ))}
      </div>

      {/* Vaccination log */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">My Vaccination Records ({animalRecords.length})</p>
          <button
            onClick={() => setShowLog(v => !v)}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            <Syringe className="h-3 w-3" /> Log
          </button>
        </div>

        <AnimatePresence>
          {showLog && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border bg-background p-3 mb-3 space-y-2">
              <input value={logVaccine} onChange={e => setLogVaccine(e.target.value)} placeholder="Vaccine name" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <input value={logNotes} onChange={e => setLogNotes(e.target.value)} placeholder="Notes (dosage, vet, batch no.)" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <div className="flex gap-2">
                <button onClick={() => setShowLog(false)} className="flex-1 rounded-lg border py-2 text-xs font-medium text-muted-foreground">Cancel</button>
                <button onClick={addRecord} disabled={!logVaccine.trim()} className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40">Save</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {animalRecords.length === 0 && !showLog && (
          <p className="py-4 text-center text-xs text-muted-foreground">No vaccination records logged yet for {animal}.</p>
        )}
        <div className="space-y-2">
          {animalRecords.map(r => (
            <div key={r.id} className="flex items-start gap-2 rounded-xl border bg-background p-3">
              <Syringe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{r.vaccine}</p>
                <p className="text-[11px] text-muted-foreground">{r.date}{r.notes ? ` · ${r.notes}` : ""}</p>
              </div>
              <button onClick={() => deleteRecord(r.id)} className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Toolkit Page ───────────────────────────────────
const TABS = [
  { id: "fertilizer", label: "Fertilizer", emoji: "🌿", component: FertilizerCalc },
  { id: "feed",       label: "Feed",        emoji: "🐄", component: FeedCalc },
  { id: "irrigation", label: "Irrigation",  emoji: "💧", component: IrrigationCalc },
  { id: "yield",      label: "Yield",       emoji: "📊", component: YieldEstimator },
  { id: "profit",     label: "Profit",      emoji: "💰", component: ProfitCalc },
  { id: "vaccines",   label: "Vaccines",    emoji: "💉", component: VaccinationScheduler },
];

const Toolkit = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("fertilizer");

  const ActiveCalc = TABS.find(t => t.id === activeTab)?.component ?? FertilizerCalc;

  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-4 pb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Farming Toolkit</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Professional agricultural calculators</p>
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Calculator card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="harvest-card p-5"
          >
            <h2 className="mb-4 text-base font-bold text-foreground">
              {TABS.find(t => t.id === activeTab)?.emoji}{" "}
              {TABS.find(t => t.id === activeTab)?.label} Calculator
            </h2>
            <ActiveCalc />
          </motion.div>
        </AnimatePresence>

        {/* AI Assistant CTA */}
        <button
          onClick={() => navigate("/assistant")}
          className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">AI Farm Assistant</p>
            <p className="text-xs text-muted-foreground">Get personalized advice for your specific farm</p>
          </div>
          <ArrowRight className="h-4 w-4 text-primary" />
        </button>

        {/* Disclaimer */}
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[11px] text-amber-800 leading-relaxed dark:text-amber-200">
            All calculator results are estimates based on standard agronomic recommendations for East Africa. Consult your local agricultural extension officer for precise site-specific recommendations.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Toolkit;
