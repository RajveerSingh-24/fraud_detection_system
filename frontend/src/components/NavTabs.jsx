import { motion } from "framer-motion";

const pages = ["Dashboard", "Payment Simulator", "Fraud Analytics", "Model Comparison", "Transaction History"];

export default function NavTabs({ current, onChange }) {
  return (
    <div className="glass mb-6 flex flex-wrap items-center gap-2 rounded-2xl p-2 shadow-glow">
      {pages.map((tab) => (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          key={tab}
          onClick={() => onChange(tab)}
          className={`rounded-xl px-4 py-2 text-sm transition ${
            current === tab
              ? "bg-cyan-500/25 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              : "bg-slate-900/40 text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          {tab}
        </motion.button>
      ))}
    </div>
  );
}
