import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ModelComparisonPage({ latestDecision }) {
  const scores = latestDecision
    ? [
        { model: "IsolationForest", score: latestDecision.model_scores.isolation_forest },
        { model: "OneClassSVM", score: latestDecision.model_scores.one_class_svm },
        { model: "DBSCAN", score: latestDecision.model_scores.dbscan },
      ]
    : [];

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="mb-4 text-lg font-semibold">Unsupervised Model Comparison</h3>
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
              <Legend />
              <Bar dataKey="score" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
