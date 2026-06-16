import { motion } from "framer-motion";

export default function StatCard({ label, value, tone = "text-cyan-300", icon = "●", hint = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="glass cyber-pulse rounded-2xl p-4 shadow-glow transition-all"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <span className="text-cyan-300/80">{icon}</span>
      </div>
      <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </motion.div>
  );
}
