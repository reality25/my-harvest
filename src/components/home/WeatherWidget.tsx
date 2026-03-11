import { Cloud, Droplets, Sun, Thermometer, Wind } from "lucide-react";
import { motion } from "framer-motion";

const WeatherWidget = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="harvest-gradient rounded-2xl p-5 text-primary-foreground"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">Nairobi, Kenya</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="font-display text-4xl font-bold">24°</span>
            <span className="mb-1 text-sm opacity-80">Partly Cloudy</span>
          </div>
        </div>
        <Sun className="h-12 w-12 opacity-90" />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2 py-2">
          <Thermometer className="h-4 w-4" />
          <span className="text-[11px] font-medium">26° / 18°</span>
          <span className="text-[10px] opacity-70">Hi / Lo</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2 py-2">
          <Droplets className="h-4 w-4" />
          <span className="text-[11px] font-medium">65%</span>
          <span className="text-[10px] opacity-70">Humidity</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2 py-2">
          <Cloud className="h-4 w-4" />
          <span className="text-[11px] font-medium">30%</span>
          <span className="text-[10px] opacity-70">Rain</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2 py-2">
          <Wind className="h-4 w-4" />
          <span className="text-[11px] font-medium">12 km/h</span>
          <span className="text-[10px] opacity-70">Wind</span>
        </div>
      </div>

      <div className="mt-3 flex gap-4 overflow-x-auto pt-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
          <div key={day} className="flex flex-col items-center gap-1">
            <span className="text-[10px] opacity-70">{day}</span>
            <Sun className="h-4 w-4 opacity-80" />
            <span className="text-[11px] font-medium">{22 + i}°</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default WeatherWidget;
