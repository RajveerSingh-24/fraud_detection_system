import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
} from "recharts";

export default function FraudAnalyticsPage({ history, evaluation }) {
  const chartData = history
    .slice()
    .reverse()
    .map((item, index) => ({
      idx: index + 1,
      risk: item.risk_score,
      anomaly: item.anomaly_score * 100,
    }));
  const pcaPoints = evaluation?.pca_points || [];
  const clusters = (evaluation?.clusters || []).map((c) => ({ ...c, label: c.is_noise ? "Noise" : `C${c.cluster}` }));
  const riskDist = evaluation
    ? [
        { bucket: "SAFE", count: evaluation.risk_distribution.safe_0_35 },
        { bucket: "REVIEW", count: evaluation.risk_distribution.review_36_70 },
        { bucket: "BLOCKED", count: evaluation.risk_distribution.blocked_71_100 },
      ]
    : [];
  const locationData = history.reduce((acc, tx) => {
    const found = acc.find((x) => x.location === tx.location);
    if (found) found.risk += tx.risk_score;
    else acc.push({ location: tx.location, risk: tx.risk_score });
    return acc;
  }, []);

  if (!evaluation) {
    return (
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-cyan-200">Fraud Analytics</h3>
        <p className="mt-2 text-slate-400">Computing anomaly distribution, PCA scatter, and DBSCAN clusters...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass rounded-2xl p-4">
        <h3 className="mb-4 text-lg font-semibold">Hourly Fraud Activity</h3>
        <div className="h-72">
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
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="risk" stroke="#22d3ee" fill="url(#riskGradient)" />
              <Area type="monotone" dataKey="anomaly" stroke="#f472b6" fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <h3 className="mb-4 text-lg font-semibold">Anomaly Distribution Chart</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={riskDist}>
              <CartesianGrid stroke="#334155" />
              <XAxis dataKey="bucket" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {riskDist.map((entry) => (
                  <Cell
                    key={entry.bucket}
                    fill={entry.bucket === "SAFE" ? "#22c55e" : entry.bucket === "REVIEW" ? "#f59e0b" : "#ef4444"}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>


      <div className="glass lg:col-span-2 rounded-2xl p-4">
        <h3 className="mb-4 text-lg font-semibold">Location Anomaly Chart</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={locationData}>
              <CartesianGrid stroke="#334155" />
              <XAxis dataKey="location" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="risk" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
