import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ClipboardList, ChevronRight, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fetchFarmTasks, completeTask, type FarmTask } from "@/services/farmService";
import { getCachedTasks, cacheTasksLocally, hasPendingSync, isOnline } from "@/services/offlineCache";
import { useAuth } from "@/contexts/AuthContext";
import { log } from "@/services/systemLogger";

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-400",
  low: "bg-muted-foreground",
};

function isTodayOrOverdue(task: FarmTask): boolean {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  due.setHours(23, 59, 59, 999);
  return due <= new Date();
}

export default function TodaysTasks() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const pendingSync = hasPendingSync();

  const load = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchFarmTasks();
      cacheTasksLocally(data);
      setTasks(data.filter((t) => !t.isCompleted));
      setOffline(false);
    } catch (err) {
      log("warn", "TodaysTasks", "Could not fetch tasks, using cache", err);
      const cached = getCachedTasks();
      if (cached) {
        setTasks((cached as FarmTask[]).filter((t) => !t.isCompleted));
        setOffline(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [isAuthenticated]);

  const todayTasks = tasks.filter(isTodayOrOverdue);
  const upcoming = tasks.filter((t) => !isTodayOrOverdue(t)).slice(0, 2);

  if (!isAuthenticated) return null;
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="h-16 rounded-xl bg-muted animate-pulse" />
        <div className="h-16 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (todayTasks.length === 0 && upcoming.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <h2 className="harvest-section-title">Today's Tasks</h2>
        </div>
        <div className="harvest-card p-4 text-center">
          <p className="text-sm text-muted-foreground">All caught up! No tasks due today.</p>
          <button
            onClick={() => navigate("/farm")}
            className="mt-2 text-xs font-medium text-primary"
          >
            Add a task →
          </button>
        </div>
      </motion.div>
    );
  }

  const handleComplete = async (taskId: string) => {
    if (!isOnline()) return;
    try {
      await completeTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      log("error", "TodaysTasks", "Failed to complete task", err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <h2 className="harvest-section-title">Today's Tasks</h2>
          {todayTasks.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {todayTasks.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {offline && <WifiOff className="h-3.5 w-3.5 text-amber-500" />}
          {pendingSync && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              Pending sync
            </span>
          )}
          <button onClick={() => navigate("/farm")} className="flex items-center gap-1 text-[11px] font-medium text-primary">
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {todayTasks.map((task) => (
          <div key={task.id} className="harvest-card flex items-start gap-3 p-3">
            <button
              onClick={() => handleComplete(task.id)}
              className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
              disabled={!isOnline()}
            >
              <Circle className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.medium}`} />
                <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
              </div>
              {task.description && (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{task.description}</p>
              )}
              {task.dueDate && (
                <p className="mt-0.5 text-[10px] text-red-500 font-medium">
                  {new Date(task.dueDate) < new Date() ? "Overdue" : "Due today"}
                </p>
              )}
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
              task.priority === "urgent" ? "bg-red-100 text-red-700" :
              task.priority === "high" ? "bg-amber-100 text-amber-700" :
              "bg-muted text-muted-foreground"
            }`}>
              {task.priority}
            </span>
          </div>
        ))}

        {upcoming.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1 pt-1">Upcoming</p>
            {upcoming.map((task) => (
              <div key={task.id} className="harvest-card flex items-start gap-3 p-3 opacity-70">
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                  {task.dueDate && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Due {new Date(task.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
}
