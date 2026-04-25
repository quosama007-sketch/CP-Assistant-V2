import { useState, useRef, useCallback } from "react";
import Head from "next/head";

const LOADING_MSGS = [
  "Identifying equipment...",
  "Cross-referencing Peabody's...",
  "Generating field guidance...",
  "Checking safety protocols...",
  "Almost ready...",
];

function parseBlocks(text) {
  let stepCount = 0;
  return text.split("\n").map((line) => {
    const t = line.trim();
    if (!t) return { type: "space" };
    if (/^#{1,3} /.test(t)) { stepCount = 0; return { type: "header", text: t.replace(/^#{1,3} /, "") }; }
    if (/^\*\*[^*]+\*\*$/.test(t) && t.length < 80) { stepCount = 0; return { type: "header", text: t.replace(/\*\*/g, "") }; }
    if (/^(\d+\.|[-*•]) /.test(t)) {
      stepCount++;
      const numbered = /^\d+\./.test(t);
      const content = t.replace(/^(\d+\.|[-*•]) /, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return { type: "step", num: stepCount, content, numbered };
    }
    if (/⚠|warning|caution|danger/i.test(t)) return { type: "warn", text: t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") };
    return { type: "para", text: t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") };
  });
}

export default function Home() {
  const [image, setImage] = useState(null);
  const [b64, setB64] = useState(null);
  const [mime, setMime] = useState("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const timerRef = useRef(null);

  const processFile = useCallback((file) => {
    if (!file?.type.startsWith("image/")) return;
    setMime(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setB64(e.target.result.split(",")[1]);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const reset = () => {
    setImage(null); setB64(null); setResult(null); setError(null); setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const analyze = async () => {
    if (!b64 || loading) return;
    setLoading(true); setResult(null); setError(null);
    let i = 0; setLoadingMsg(LOADING_MSGS[0]);
    timerRef.current = setInterval(() => { i = (i + 1) % LOADING_MSGS.length; setLoadingMsg(LOADING_MSGS[i]); }, 1300);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: b64, imageMime: mime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
      setResult(data.result);
    } catch (e) {
      setError(e.message || "Analysis failed. Please try again.");
    } finally {
      clearInterval(timerRef.current);
      setLoading(false);
    }
  };

  const blocks = result ? parseBlocks(result) : [];
  const G = "#1D9E75", GL = "#E1F5EE", GD = "#0F6E56";

  return (
    <>
      <Head>
        <title>CP Field Assistant — Powered by Peabody's</title>
        <meta name="description" content="AI-powered Cathodic Protection field guidance — free, no API key needed by users" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh", background: "#f5f5f0" }}>

        {/* Header */}
        <header style={{ background: "#fff", borderBottom: "1px solid #e8e8e0", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ width: 38, height: 38, background: G, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>CP Field Assistant</div>
            <div style={{ fontSize: 11, color: "#888" }}>Powered by Peabody's · AI expert on site</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: GL, color: GD, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.6px" }}>
              FREE
            </div>
            <div style={{ background: "#E6F1FB", color: "#0C447C", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.6px" }}>
              AI Expert
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 60px" }}>

          {/* Hero */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: "#111", marginBottom: 8 }}>
              Identify any CP equipment instantly
            </h1>
            <p style={{ fontSize: 14, color: "#666", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
              Upload a photo and get expert step-by-step guidance — backed by Peabody's Control of Pipeline Corrosion. Completely free to use.
            </p>
          </div>

          {/* Upload Zone */}
          {!image && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); processFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${drag ? G : "#d0d0c8"}`, borderRadius: 16, padding: "48px 24px", textAlign: "center", cursor: "pointer", background: drag ? "#E1F5EE44" : "#fff", transition: "all 0.2s" }}
            >
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => processFile(e.target.files[0])} />
              <div style={{ width: 64, height: 64, background: GL, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "#222", marginBottom: 6 }}>Upload a CP equipment photo</div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>
                Rectifiers · Test stations · Anodes · Instruments · Any field equipment<br />
                <span style={{ fontSize: 12, color: "#bbb" }}>PNG, JPG, WEBP up to 10MB</span>
              </div>
            </div>
          )}

          {/* Preview */}
          {image && (
            <div className="fade-in">
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8e8e0", overflow: "hidden" }}>
                <img src={image} alt="CP Equipment" style={{ width: "100%", maxHeight: 340, objectFit: "contain", background: "#f8f8f4", display: "block" }} />
                <div style={{ padding: 16, borderTop: "1px solid #f0f0e8" }}>
                  <button onClick={analyze} disabled={loading} style={{ width: "100%", padding: 14, background: loading ? "#9ecfbd" : G, color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {loading ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                        </svg>
                        {loadingMsg}
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        Identify & Guide Me
                      </>
                    )}
                  </button>
                  {loading && (
                    <div style={{ height: 3, background: "#e8f5f0", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: G, borderRadius: 2, animation: "loadpulse 1.5s ease-in-out infinite" }} />
                    </div>
                  )}
                  <button onClick={reset} style={{ width: "100%", marginTop: 8, padding: 10, background: "transparent", color: "#888", border: "1px solid #e8e8e0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                    Upload a different image
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#7f1d1d", marginTop: 16, display: "flex", gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="fade-in" style={{ marginTop: 24, background: "#fff", borderRadius: 16, border: "1px solid #e8e8e0", overflow: "hidden" }}>
              <div style={{ background: G, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <div>
                  <div style={{ color: "white", fontSize: 14, fontWeight: 600 }}>Expert Analysis Complete</div>
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>Backed by Peabody's Control of Pipeline Corrosion, 2nd Ed.</div>
                </div>
              </div>
              <div style={{ padding: 20 }}>
                {blocks.map((b, i) => {
                  if (b.type === "space") return <div key={i} style={{ height: 8 }} />;
                  if (b.type === "header") return (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: GD, margin: "20px 0 10px", display: "flex", alignItems: "center", gap: 10 }}>
                      {b.text}<div style={{ flex: 1, height: 1, background: GL }} />
                    </div>
                  );
                  if (b.type === "step") return (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 24, height: 24, flexShrink: 0, background: b.numbered ? GL : "#f5f5f0", color: b.numbered ? GD : "#888", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: b.numbered ? 11 : 16, fontWeight: 600, marginTop: 1 }}>
                        {b.numbered ? b.num : "·"}
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.65, color: "#333" }} dangerouslySetInnerHTML={{ __html: b.content }} />
                    </div>
                  );
                  if (b.type === "warn") return (
                    <div key={i} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#78350f", display: "flex", gap: 10, margin: "10px 0", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                      <span dangerouslySetInnerHTML={{ __html: b.text }} />
                    </div>
                  );
                  return <p key={i} style={{ fontSize: 14, lineHeight: 1.7, color: "#444", marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: b.text }} />;
                })}
              </div>
            </div>
          )}

          {/* Feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginTop: 32 }}>
            {[
              { icon: "📸", title: "Any CP photo", desc: "Rectifiers, anodes, test stations" },
              { icon: "🆓", title: "100% free", desc: "Powered by Google Gemini" },
              { icon: "📖", title: "Peabody-backed", desc: "NACE-certified knowledge" },
              { icon: "📱", title: "Works on mobile", desc: "Share with your whole team" },
            ].map((c) => (
              <div key={c.title} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e8e0", padding: "16px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#222", marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </main>

        <footer style={{ borderTop: "1px solid #e8e8e0", background: "#fff", padding: "16px 24px", textAlign: "center", fontSize: 12, color: "#aaa" }}>
          CP Field Assistant · Peabody's Control of Pipeline Corrosion (2nd Ed.) · NACE International · Powered by Google Gemini (Free)
        </footer>
      </div>
    </>
  );
}
