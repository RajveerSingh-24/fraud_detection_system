import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const statusClass = {
  SAFE: "bg-green-500/20 text-green-300",
  REVIEW: "bg-amber-500/20 text-amber-300",
  BLOCKED: "bg-red-500/20 text-red-300",
};

export default function TransactionHistoryPage({ history, onDelete, onFaceVerify }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [capturedImage, setCapturedImage] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [faceResult, setFaceResult] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const openVerification = (transaction) => {
    setSelectedTransaction(transaction);
    setCapturedImage("");
    setCameraError("");
    setFaceResult(null);
    setScanLoading(false);
  };

  const closeVerification = () => {
    stopCamera();
    setSelectedTransaction(null);
    setScanLoading(false);
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !selectedTransaction) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
    stopCamera();

    setScanLoading(true);
    try {
      const result = await onFaceVerify(selectedTransaction.id);
      setFaceResult({ ...result, message: "Verified" });
    } catch (error) {
      setFaceResult({ message: error.message || "Verification failed", confidence: "0.00" });
    } finally {
      setScanLoading(false);
    }
  };

  const deleteTransaction = async (id) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!selectedTransaction || capturedImage) return undefined;

    let cancelled = false;

    const openCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not available in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        if (!cancelled) {
          setCameraError(error.message || "Unable to access the camera.");
        }
      }
    };

    openCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [capturedImage, selectedTransaction]);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-cyan-200">Transaction History</h3>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
          {history.length} records
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="pb-2">User</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">Time</th>
              <th className="pb-2">Location</th>
              <th className="pb-2">Risk</th>
              <th className="pb-2">Status</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((tx) => {
              const canVerify = ["REVIEW", "BLOCKED"].includes(tx.classification);

              return (
                <tr key={tx.id} className="border-t border-slate-800 transition hover:bg-slate-800/30">
                  <td className="py-2">#{tx.user_id}</td>
                  <td className="py-2">INR {tx.amount.toFixed(2)}</td>
                  <td className="py-2">{tx.transaction_time}</td>
                  <td className="py-2">{tx.location}</td>
                  <td className="py-2">{tx.risk_score.toFixed(3)}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => canVerify && openVerification(tx)}
                      disabled={!canVerify}
                      className={`rounded px-2 py-1 text-xs transition ${
                        statusClass[tx.classification] || "bg-slate-500/20 text-slate-300"
                      } ${canVerify ? "cursor-pointer hover:ring-2 hover:ring-cyan-400/30" : "cursor-default"}`}
                    >
                      {tx.classification}
                    </button>
                  </td>
                  <td className="py-2">
                    <div className="flex justify-end gap-2">
                      {canVerify && (
                        <button
                          type="button"
                          onClick={() => openVerification(tx)}
                          className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 transition hover:bg-cyan-500/20"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteTransaction(tx.id)}
                        disabled={deletingId === tx.id}
                        className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {deletingId === tx.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {history.length === 0 && <p className="py-8 text-center text-slate-400">No transactions yet. Use Payment Simulator to generate activity.</p>}
      </div>

      <AnimatePresence>
        {selectedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          >
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} className="glass-strong w-full max-w-2xl rounded-3xl p-5 shadow-glow md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">History Verification</p>
                  <h4 className="mt-2 text-xl font-semibold text-slate-50">
                    Transaction #{selectedTransaction.id}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={closeVerification}
                  className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500 hover:text-slate-100"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-slate-950/70 p-4">
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900">
                  {capturedImage ? (
                    <img src={capturedImage} alt="Captured verification frame" className="h-full w-full object-cover" />
                  ) : (
                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
                  {!cameraError && !capturedImage && (
                    <>
                      <div className="pointer-events-none absolute inset-8 rounded-[42%] border border-cyan-300/35" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs uppercase tracking-[0.22em] text-cyan-300/90">
                        Align Face In Frame
                      </div>
                    </>
                  )}
                  {scanLoading && (
                    <motion.div
                      initial={{ top: "0%" }}
                      animate={{ top: "100%" }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-8 bg-gradient-to-b from-emerald-300/0 via-emerald-300/35 to-emerald-300/0"
                    />
                  )}
                  {cameraError && (
                    <div className="absolute inset-0 grid place-items-center bg-slate-950/80 p-5 text-center text-sm text-red-200">
                      {cameraError}
                    </div>
                  )}
                  {faceResult?.message === "Verified" && !scanLoading && (
                    <div className="absolute inset-0 grid place-items-center bg-emerald-950/45">
                      <div className="rounded-2xl border border-emerald-300/40 bg-emerald-400/20 px-5 py-3 text-center">
                        <p className="text-2xl font-semibold text-emerald-100">Verified</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-200/80">Status Updated To Safe</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-300">
                    {scanLoading
                      ? "Validating captured frame..."
                      : faceResult
                      ? `${faceResult.message} (confidence: ${faceResult.confidence})`
                      : "Camera is active. Capture a clear face image to verify this transaction."}
                  </p>
                  {!capturedImage && (
                    <button
                      type="button"
                      onClick={captureAndVerify}
                      disabled={Boolean(cameraError) || scanLoading}
                      className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Capture Image
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
