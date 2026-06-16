import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const defaultForm = {
  user_id: "",
  amount: "",
  transaction_time: "",
  location: "",
};

const presets = [
  { label: "Routine", user_id: "318", amount: "6500", transaction_time: "20:45", location: "Kolkata" },
  { label: "High value", user_id: "204", amount: "98000", transaction_time: "01:15", location: "Dubai" },
  { label: "New city", user_id: "318", amount: "12600", transaction_time: "22:45", location: "Singapore" },
];

const fieldClass =
  "w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:bg-slate-950/80 focus:ring-2 focus:ring-cyan-500/20";

const modelLabels = [
  ["Isolation Forest", "isolation_forest"],
  ["One-Class SVM", "one_class_svm"],
  ["DBSCAN", "dbscan"],
];

const capDisplayScore = (score) => Math.min(Number(score) || 0, 0.95);

export default function PaymentSimulatorPage({ onSimulate, latestDecision, onFaceVerify }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [faceResult, setFaceResult] = useState(null);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [processingStep, setProcessingStep] = useState("idle");
  const [analysisOpened, setAnalysisOpened] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [cameraError, setCameraError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setAnalysisOpened(true);
    setLoading(true);
    setFaceResult(null);
    setProcessingStep("Encrypting payment signal...");
    try {
      await new Promise((r) => setTimeout(r, 350));
      setProcessingStep("Running unsupervised AI anomaly models...");
      await onSimulate({
        user_id: Number(form.user_id),
        amount: Number(form.amount),
        transaction_time: form.transaction_time,
        location: form.location,
      });
      setProcessingStep("Calibrating risk policy...");
      await new Promise((r) => setTimeout(r, 280));
    } finally {
      setLoading(false);
      setProcessingStep("idle");
    }
  };

  const resultTone = useMemo(() => {
    if (!latestDecision) return "text-slate-300 border-slate-700";
    if (latestDecision.classification === "SAFE") return "text-green-300 border-green-400/40";
    if (latestDecision.classification === "REVIEW") return "text-amber-300 border-amber-400/40";
    return "text-red-300 border-red-400/40";
  }, [latestDecision]);

  const startFaceScan = async () => {
    if (!latestDecision) return;
    setCapturedImage("");
    setFaceResult(null);
    setCameraError("");
    setScanLoading(false);
    setShowFaceModal(true);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const closeFaceModal = () => {
    stopCamera();
    setShowFaceModal(false);
    setScanLoading(false);
  };

  const captureFaceImage = async () => {
    if (!videoRef.current || !latestDecision) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
    stopCamera();

    setScanLoading(true);
    try {
      const result = await onFaceVerify(latestDecision.id);
      setFaceResult({ ...result, message: "Verified" });
    } catch (error) {
      setFaceResult({ message: error.message || "Verification failed", confidence: "0.00" });
    } finally {
      setScanLoading(false);
    }
  };

  useEffect(() => {
    if (!showFaceModal || capturedImage) return undefined;

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
  }, [capturedImage, showFaceModal]);

  const riskScore = latestDecision?.risk_score ?? 0;
  const riskWidth = `${Math.min(riskScore, 100)}%`;
  const riskColor = riskScore < 36 ? "bg-emerald-400" : riskScore < 71 ? "bg-amber-400" : "bg-red-400";
  const canVerifyFace = ["REVIEW", "BLOCKED"].includes(latestDecision?.classification);
  const decisionAccent =
    latestDecision?.classification === "SAFE"
      ? "from-emerald-400/20 via-emerald-400/5 to-transparent border-emerald-400/30"
      : latestDecision?.classification === "REVIEW"
      ? "from-amber-400/20 via-amber-400/5 to-transparent border-amber-400/30"
      : latestDecision
      ? "from-red-400/20 via-red-400/5 to-transparent border-red-400/30"
      : "from-cyan-400/15 via-cyan-400/5 to-transparent border-slate-700/70";

  return (
    <div className="space-y-5">
      <section className="glass-strong overflow-hidden rounded-3xl border border-cyan-400/20">
        <div className="relative grid gap-6 p-5 md:p-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Live Transaction Lab</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">Payment Simulator</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Stage a payment, run the ensemble fraud engine, and trigger identity verification when the policy asks for another check.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-700/60 bg-slate-950/40 p-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Mode</p>
              <p className="mt-2 text-sm font-medium text-cyan-200">Real time</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Models</p>
              <p className="mt-2 text-sm font-medium text-violet-200">3 active</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Policy</p>
              <p className="mt-2 text-sm font-medium text-emerald-200">Adaptive</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={submit} className="glass space-y-5 rounded-2xl p-5 shadow-glow md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">Transaction Input</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-50">Compose Payment</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setForm(preset)}
                  className="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-200"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-slate-950/35 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">User ID</span>
                <input
                  type="number"
                  min="1"
                  value={form.user_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, user_id: e.target.value }))}
                  className={fieldClass}
                  placeholder="101"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Amount (INR)</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className={fieldClass}
                  placeholder="3200"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Transaction Time</span>
                <input
                  type="time"
                  value={form.transaction_time}
                  onChange={(e) => setForm((prev) => ({ ...prev, transaction_time: e.target.value }))}
                  className={fieldClass}
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Location</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  className={fieldClass}
                  placeholder="Mumbai"
                  required
                />
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Run Fraud Analysis"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(defaultForm);
                setFaceResult(null);
              }}
              className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
            >
              Reset
            </button>
          </div>

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl border border-cyan-400/20 bg-slate-950/60 p-4 text-sm text-cyan-100"
              >
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    initial={{ width: "10%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-violet-400 to-emerald-400"
                  />
                </div>
                {processingStep}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className={`glass overflow-hidden rounded-2xl border bg-gradient-to-br p-5 md:p-6 ${decisionAccent}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">AI Decision Engine</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-50">Risk Outcome</h3>
            </div>
            {latestDecision && (
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${resultTone}`}>
                {latestDecision.classification}
              </span>
            )}
          </div>

          {loading && !latestDecision ? (
            <div className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-950/45 p-5 text-slate-400">Analyzing transaction behavior...</div>
          ) : !latestDecision || !analysisOpened ? (
            <div className="mt-6 grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/35 p-6 text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-2xl text-cyan-200">
                  AI
                </div>
                <p className="mt-4 text-sm text-slate-400">Run a simulation to populate model scores, policy result, and identity checks.</p>
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-[0.85fr_1.15fr]">
                <div className={`rounded-2xl border bg-slate-950/45 p-4 ${resultTone}`}>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Result State</p>
                  <p className="mt-2 text-4xl font-semibold tracking-tight">{latestDecision.classification}</p>
                  <p className="mt-2 text-xs text-slate-400">Behavior profile user: {latestDecision.user_id}</p>
                </div>
                <div className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dynamic Risk Meter</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-100">{riskScore}/100</p>
                    </div>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                    <motion.div initial={{ width: 0 }} animate={{ width: riskWidth }} className={`h-full rounded-full ${riskColor}`} />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    <span>Safe</span>
                    <span>Review</span>
                    <span>Blocked</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {modelLabels.map(([label, key]) => (
                  <div key={key} className="rounded-2xl border border-slate-700/60 bg-slate-950/45 p-3 text-sm">
                    <p className="text-slate-400">{label}</p>
                    <p className="mt-2 text-xl font-semibold text-cyan-300">{capDisplayScore(latestDecision.model_scores?.[key]).toFixed(4)}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Explainability</p>
                <p className="mt-2 leading-6 text-slate-300">{latestDecision.explanation}</p>
              </div>

              {canVerifyFace && (
                <div className="flex flex-col gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-100">Identity verification required</p>
                    <p className="mt-1 text-xs text-red-200/70">Step-up check is available for this transaction.</p>
                  </div>
                  <button
                    type="button"
                    onClick={startFaceScan}
                    className="rounded-xl bg-red-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-red-300"
                  >
                    Open Camera Verification
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFaceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          >
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} className="glass-strong w-full max-w-2xl rounded-3xl p-5 shadow-glow md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">Step-Up Security</p>
                  <h4 className="mt-2 text-xl font-semibold text-slate-50">Face Verification</h4>
                </div>
                <button
                  onClick={closeFaceModal}
                  className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500 hover:text-slate-100"
                >
                  Close
                </button>
              </div>
              <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-slate-950/70 p-4">
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900">
                  {capturedImage ? (
                    <img src={capturedImage} alt="Captured face verification frame" className="h-full w-full object-cover" />
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
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-200/80">Identity Match Confirmed</p>
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
                      : capturedImage
                      ? "Image captured. Waiting for verification result..."
                      : "Camera is active. Capture a clear face image to verify."}
                  </p>
                  <div className="flex gap-2">
                    {capturedImage && !scanLoading && !faceResult && (
                      <button
                        type="button"
                        onClick={() => {
                          setCapturedImage("");
                          setCameraError("");
                        }}
                        className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
                      >
                        Retake
                      </button>
                    )}
                    {!capturedImage && (
                      <button
                        type="button"
                        onClick={captureFaceImage}
                        disabled={Boolean(cameraError) || scanLoading}
                        className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Capture Image
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
