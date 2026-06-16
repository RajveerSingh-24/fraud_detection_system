import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "./api/client";
import NavTabs from "./components/NavTabs";
import DashboardPage from "./pages/DashboardPage";
import FraudAnalyticsPage from "./pages/FraudAnalyticsPage";
import ModelComparisonPage from "./pages/ModelComparisonPage";
import PaymentSimulatorPage from "./pages/PaymentSimulatorPage";
import TransactionHistoryPage from "./pages/TransactionHistoryPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [dashboard, setDashboard] = useState({
    total_transactions: 0,
    blocked_count: 0,
    review_count: 0,
    safe_count: 0,
    avg_risk_score: 0,
  });
  const [history, setHistory] = useState([]);
  const [latestDecision, setLatestDecision] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshData = async () => {
    try {
      const [dashboardData, historyData] = await Promise.all([api.getDashboard(), api.getHistory()]);
      setDashboard(dashboardData);
      setHistory(historyData);
      if (historyData.length > 0) {
        setLatestDecision(historyData[0]);
      }
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

    api
      .getEvaluation()
      .then((evaluationData) => setEvaluation(evaluationData))
      .catch(() => {
        // Keep the UI responsive even if heavy evaluation payload is slow/unavailable.
      });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSimulate = async (payload) => {
    const result = await api.simulatePayment(payload);
    setLatestDecision(result);
    await refreshData();
  };

  const handleFaceVerify = async (id) => {
    const result = await api.faceVerify(id);
    if (result.transaction) {
      setLatestDecision(result.transaction);
    }
    await refreshData();
    return result;
  };

  const handleDeleteTransaction = async (id) => {
    await api.deleteTransaction(id);
    if (latestDecision?.id === id) {
      setLatestDecision(null);
    }
    await refreshData();
  };

  const pageContent = useMemo(() => {
    if (currentPage === "Dashboard") return <DashboardPage dashboard={dashboard} history={history} />;
    if (currentPage === "Payment Simulator")
      return <PaymentSimulatorPage onSimulate={handleSimulate} latestDecision={latestDecision} onFaceVerify={handleFaceVerify} />;
    if (currentPage === "Fraud Analytics") return <FraudAnalyticsPage history={history} evaluation={evaluation} />;
    if (currentPage === "Model Comparison") return <ModelComparisonPage latestDecision={latestDecision} evaluation={evaluation} />;
    return <TransactionHistoryPage history={history} onDelete={handleDeleteTransaction} onFaceVerify={handleFaceVerify} />;
  }, [currentPage, dashboard, history, latestDecision, evaluation]);

  return (
    <div className="cyber-grid min-h-screen p-4 text-slate-100 md:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-7xl">
        <header className="glass-strong mb-6 rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">AI Cyber Defense Matrix</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-cyan-200 md:text-4xl">Fraud Intelligence Command Center</h1>
          <p className="mt-2 text-slate-400">
            Unsupervised anomaly detection using Isolation Forest, One-Class SVM, and DBSCAN with ensemble risk scoring.
          </p>
        </header>
        <NavTabs current={currentPage} onChange={setCurrentPage} />
        {error && <div className="glass mb-4 rounded-xl border border-red-500/30 p-3 text-red-200">{error}</div>}
        {loading ? (
          <div className="glass rounded-2xl p-8 text-center text-slate-300">Bootstrapping fraud intelligence signals...</div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
            >
              {pageContent}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
