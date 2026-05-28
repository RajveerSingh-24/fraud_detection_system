export default function TransactionHistoryPage({ history }) {
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="mb-4 text-lg font-semibold">Transaction History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="pb-2">Amount</th>
              <th className="pb-2">Time</th>
              <th className="pb-2">Location</th>
              <th className="pb-2">Risk</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((tx) => (
              <tr key={tx.id} className="border-t border-slate-800">
                <td className="py-2">INR {tx.amount.toFixed(2)}</td>
                <td className="py-2">{tx.transaction_time}</td>
                <td className="py-2">{tx.location}</td>
                <td className="py-2">{tx.risk_score.toFixed(3)}</td>
                <td className="py-2">
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      tx.classification === "SAFE"
                        ? "bg-green-500/20 text-green-300"
                        : tx.classification === "REVIEW"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {tx.classification}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
