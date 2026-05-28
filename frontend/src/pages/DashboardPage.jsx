import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from "recharts";
import StatCard from "../components/StatCard";

export default function DashboardPage({ dashboard }) {
  const data = [
    { name: "SAFE", value: dashboard.safe_count, color: "#22c55e" },
    { name: "REVIEW", value: dashboard.review_count, color: "#f59e0b" },
    { name: "BLOCKED", value: dashboard.blocked_count, color: "#ef4444" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Transactions" value={dashboard.total_transactions} />
        <StatCard label="Average Risk Score" value={dashboard.avg_risk_score.toFixed(2)} tone="text-fuchsia-300" />
        <StatCard label="Under Review" value={dashboard.review_count} tone="text-amber-300" />
        <StatCard label="Blocked" value={dashboard.blocked_count} tone="text-red-300" />
      </div>
      <div className="glass rounded-2xl p-4">
        <h3 className="mb-4 text-lg font-semibold text-slate-200">Risk Distribution</h3>
        <div className="h-64">
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
      </div>
    </div>
  );
}
