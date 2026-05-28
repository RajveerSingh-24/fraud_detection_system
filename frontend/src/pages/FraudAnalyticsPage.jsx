import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function FraudAnalyticsPage({ history }) {
  const chartData = history
    .slice()
    .reverse()
    .map((item, index) => ({
      idx: index + 1,
      risk: item.risk_score,
      anomaly: item.anomaly_score,
    }));

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="mb-4 text-lg font-semibold">Fraud Analytics Timeline</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="riskGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#334155" />
            <XAxis dataKey="idx" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 1]} />
            <Tooltip />
            <Area type="monotone" dataKey="risk" stroke="#22d3ee" fill="url(#riskGradient)" />
            <Area type="monotone" dataKey="anomaly" stroke="#f472b6" fillOpacity={0} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
