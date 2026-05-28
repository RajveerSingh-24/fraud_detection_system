import { useState } from "react";
import { motion } from "framer-motion";

const defaultForm = {
  amount: 2500,
  transaction_time: "13:30",
  location: "Mumbai",
};

export default function PaymentSimulatorPage({ onSimulate, latestDecision, onFaceVerify }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [faceResult, setFaceResult] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFaceResult(null);
    try {
      await onSimulate({
        amount: Number(form.amount),
        transaction_time: form.transaction_time,
        location: form.location,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={submit} className="glass space-y-3 rounded-2xl p-4">
        <h3 className="text-lg font-semibold">Payment Simulator</h3>
        <input
          type="number"
          min="1"
          value={form.amount}
          onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-2"
          placeholder="Amount"
        />
        <input
          type="time"
          value={form.transaction_time}
          onChange={(e) => setForm((prev) => ({ ...prev, transaction_time: e.target.value }))}
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-2"
        />
        <input
          type="text"
          value={form.location}
          onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-2"
          placeholder="City"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-cyan-500/30 px-4 py-2 text-cyan-200 hover:bg-cyan-500/40 disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Run Fraud Analysis"}
        </button>
      </form>

      <div className="glass rounded-2xl p-4">
        <h3 className="text-lg font-semibold">Decision Engine</h3>
        {!latestDecision ? (
          <p className="mt-3 text-slate-400">Run a simulation to view anomaly and risk decisions.</p>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2">
            <p>
              Classification:{" "}
              <span className="font-semibold text-cyan-300">{latestDecision.classification}</span>
            </p>
            <p>Anomaly Score: {latestDecision.anomaly_score}</p>
            <p>Risk Score: {latestDecision.risk_score}</p>
            <p className="text-slate-300">{latestDecision.explanation}</p>
            {latestDecision.face_verification_required && (
              <button
                type="button"
                onClick={async () => setFaceResult(await onFaceVerify(latestDecision.id))}
                className="rounded-lg bg-red-500/20 px-3 py-2 text-red-200 hover:bg-red-500/30"
              >
                Simulate Face Verification
              </button>
            )}
            {faceResult && (
              <p className="rounded-md bg-slate-900/60 p-2 text-sm text-slate-200">
                {faceResult.message} (confidence: {faceResult.confidence})
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
