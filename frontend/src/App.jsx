import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSimulate = async (payload) => {
    const result = await api.simulatePayment(payload);
    setLatestDecision(result);
    await refreshData();
  };

  const handleFaceVerify = async (id) => api.faceVerify(id);

  const pageContent = useMemo(() => {
    if (currentPage === "Dashboard") return <DashboardPage dashboard={dashboard} />;
    if (currentPage === "Payment Simulator")
      return <PaymentSimulatorPage onSimulate={handleSimulate} latestDecision={latestDecision} onFaceVerify={handleFaceVerify} />;
    if (currentPage === "Fraud Analytics") return <FraudAnalyticsPage history={history} />;
    if (currentPage === "Model Comparison") return <ModelComparisonPage latestDecision={latestDecision} />;
    return <TransactionHistoryPage history={history} />;
  }, [currentPage, dashboard, history, latestDecision]);

  return (
    <div className="min-h-screen p-6 text-slate-100">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-7xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-cyan-300">AI Fraud Payment Detection Console</h1>
          <p className="mt-2 text-slate-400">
            Unsupervised anomaly detection using Isolation Forest, One-Class SVM, and DBSCAN with ensemble risk scoring.
          </p>
        </header>
        <NavTabs current={currentPage} onChange={setCurrentPage} />
        {error && <div className="glass mb-4 rounded-xl border border-red-500/30 p-3 text-red-200">{error}</div>}
        {pageContent}
      </motion.div>
    </div>
  );
}
