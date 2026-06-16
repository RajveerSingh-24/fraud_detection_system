import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatCard from "../components/StatCard";

export default function DashboardPage({ dashboard, history }) {
  const data = [
    { name: "SAFE", value: dashboard.safe_count, color: "#22c55e" },
    { name: "REVIEW", value: dashboard.review_count, color: "#f59e0b" },
    { name: "BLOCKED", value: dashboard.blocked_count, color: "#ef4444" },
  ];
  const trend = history
    .slice(0, 20)
    .reverse()
    .map((tx, idx) => ({ idx: idx + 1, risk: tx.risk_score, anomaly: tx.anomaly_score * 100 }));
  const liveFeed = history.slice(0, 20);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2">
        <StatCard label="Total Transactions" value={dashboard.total_transactions} icon="◉" hint="Behavioral stream volume" />
        <StatCard
          label="Average Risk Score"
          value={dashboard.avg_risk_score.toFixed(2)}
          tone="text-fuchsia-300"
          icon="◎"
          hint="Continuous ensemble baseline"
        />
        <StatCard label="Under Review" value={dashboard.review_count} tone="text-amber-300" icon="◈" hint="Escalated for manual inspection" />
        <StatCard label="Blocked" value={dashboard.blocked_count} tone="text-red-300" icon="⬢" hint="Policy auto-block interventions" />
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4">
        <h3 className="mb-4 text-lg font-semibold text-slate-200">Risk Distribution</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={55} outerRadius={90}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="glass flex h-[380px] flex-col rounded-2xl p-4 xl:col-span-2">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-200">Fraud Risk Trend</h3>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">LIVE SIGNALS</span>
        </div>
        <div className="min-h-0 flex-1 rounded-xl border border-slate-700/50 bg-slate-950/25 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="riskGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="idx" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="risk" stroke="#22d3ee" fill="url(#riskGlow)" />
              <Area type="monotone" dataKey="anomaly" stroke="#f472b6" fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass flex h-[380px] flex-col rounded-2xl p-4">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-200">Live Activity Feed</h3>
          <span className="rounded-full border border-slate-700 bg-slate-950/50 px-2.5 py-1 text-xs text-slate-400">{liveFeed.length}</span>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-color:#334155_transparent] [scrollbar-width:thin]">
          {liveFeed.map((tx) => (
            <div key={tx.id} className="rounded-xl border border-slate-700/60 bg-slate-950/45 p-3 transition hover:border-slate-600/80">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{tx.location}</span>
                <span>{tx.transaction_time}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm text-slate-100">INR {tx.amount.toLocaleString()}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    tx.classification === "SAFE"
                      ? "bg-green-500/20 text-green-300"
                      : tx.classification === "REVIEW"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {tx.classification}
                </span>
              </div>
            </div>
          ))}
          {liveFeed.length === 0 && <p className="text-sm text-slate-400">No activity yet. Simulate transactions to start live feed.</p>}
        </div>
      </div>
    </div>
  );
}
