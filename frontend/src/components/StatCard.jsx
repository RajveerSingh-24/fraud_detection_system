import { motion } from "framer-motion";

export default function StatCard({ label, value, tone = "text-cyan-300" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 shadow-glow">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    </motion.div>
  );
}
