import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const capDisplayScore = (score) => Math.min(Number(score) || 0, 0.95);

const metricKeys = {
  IsolationForest: { auc: "iforest_auc", avgPrecision: "iforest_avg_precision" },
  OneClassSVM: { auc: "ocsvm_auc", avgPrecision: "ocsvm_avg_precision" },
  DBSCAN: { auc: "dbscan_auc", avgPrecision: "dbscan_avg_precision" },
};

export default function ModelComparisonPage({ latestDecision, evaluation }) {
  const [focusModel, setFocusModel] = useState("IsolationForest");
  const scores = latestDecision
    ? [
        { model: "IsolationForest", score: capDisplayScore(latestDecision.model_scores.isolation_forest) },
        { model: "OneClassSVM", score: capDisplayScore(latestDecision.model_scores.one_class_svm) },
        { model: "DBSCAN", score: capDisplayScore(latestDecision.model_scores.dbscan) },
      ]
    : [];
  const weights = [
    { name: "IsolationForest", value: 45, color: "#06b6d4" },
    { name: "OneClassSVM", value: 35, color: "#8b5cf6" },
    { name: "DBSCAN", value: 20, color: "#14b8a6" },
  ];
  const focusedScore = useMemo(() => scores.find((s) => s.model === focusModel)?.score ?? 0, [scores, focusModel]);
  const modelMetrics = evaluation?.model_comparison || {};
  const hasEvaluation = Boolean(evaluation);
  const focusedMetricKeys = metricKeys[focusModel];
  const focusedAuc = modelMetrics[focusedMetricKeys.auc] ?? 0;
  const focusedAvgPrecision = modelMetrics[focusedMetricKeys.avgPrecision] ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass rounded-2xl p-4">
        <h3 className="mb-4 text-lg font-semibold">Model Anomaly Signal Comparison</h3>
        {scores.length === 0 ? (
          <p className="text-slate-400">Run a payment simulation to compare model-level anomaly scores.</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scores}>
                <CartesianGrid stroke="#334155" />
                <XAxis dataKey="model" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 1]} />
                <Tooltip />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {scores.map((entry) => (
                    <Cell key={entry.model} fill={focusModel === entry.model ? "#22d3ee" : "#475569"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-4">
        <h3 className="mb-4 text-lg font-semibold">Ensemble Weight Visualization</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={weights} dataKey="value" innerRadius={60} outerRadius={95}>
                {weights.map((w) => (
                  <Cell key={w.name} fill={w.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 lg:col-span-2">
        <h3 className="mb-4 text-lg font-semibold">Interactive Model Switching</h3>
        <div className="mb-4 flex flex-wrap gap-2">
          {["IsolationForest", "OneClassSVM", "DBSCAN"].map((m) => (
            <button
              key={m}
              onClick={() => setFocusModel(m)}
              className={`rounded-lg px-3 py-2 text-sm ${
                focusModel === m ? "bg-cyan-500/30 text-cyan-200" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-900/50 p-3">
            <p className="text-xs text-slate-400">Focused Signal</p>
            <p className="mt-1 text-2xl font-semibold text-cyan-300">{focusedScore.toFixed(4)}</p>
          </div>
          <div className="rounded-xl bg-slate-900/50 p-3">
            <p className="text-xs text-slate-400">{focusModel} AUC</p>
            <p className="mt-1 text-2xl font-semibold text-violet-300">
              {hasEvaluation ? focusedAuc.toFixed(3) : "Loading..."}
            </p>
          </div>
          <div className="rounded-xl bg-slate-900/50 p-3">
            <p className="text-xs text-slate-400">{focusModel} Avg Precision</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-300">
              {hasEvaluation ? focusedAvgPrecision.toFixed(3) : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
