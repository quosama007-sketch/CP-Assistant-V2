import { useState, useRef, useCallback } from "react";
import Head from "next/head";

const LOADING_MSGS = [
  "Scanning your equipment...",
  "Checking Peabody's manual...",
  "Building your field guide...",
  "Almost done...",
];

function parseBlocks(text) {
  let stepCount = 0;
  return text.split("\n").map((line) => {
    const t = line.trim();
    if (!t) return { type: "space" };
    if (/^#{1,3} /.test(t)) {
      stepCount = 0;
      return { type: "header", text: t.replace(/^#{1,3} /, "") };
    }
    if (/^\*\*[^*]+\*\*$/.test(t) && t.length < 80) {
      stepCount = 0;
      return { type: "header", text: t.replace(/\*\*/g, "") };
    }
    if (/^(\d+\.|[-*•]) /.test(t)) {
      stepCount++;
      const numbered = /^\d+\./.test(t);
      const content = t.replace(/^(\d+\.|[-*•]) /, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return { type: "step", num: stepCount, content, numbered };
    }
    if (/⚠|warning|caution|danger/i.test(t)) {
      return { type: "warn", text: t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") };
    }
    return { type: "para", text: t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") };
  });
}

// SVG Logo Component
function CPLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="var(--cp-green)" />
      <path d="M20 8L10 13.5V20C10 25.5 14.5 30.5 20 32C25.5 30.5 30 25.5 30 20V13.5L20 8Z" fill="white" fillOpacity="0.2" />
      <path d="M20 10L11 15V20C11 25 15 29.5 20 31C25 29.5 29 25 29 20V15L20 10Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 20L18.5 22.5L24 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
    setImage(null); setB64(null); setResult(null); setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const analyze = async () => {
    if (!b64 || loading) return;
    setLoading(true); setResult(null); setError(null);
    let i = 0; setLoadingMsg(LOADING_MSGS[0]);
    timerRef.current = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[i]);
    }, 1400);
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

  return (
    <>
      <Head>
        <title>CP Field Assistant — Your AI Expert On Site</title>
        <meta name="description" content="Identify any cathodic protection equipment instantly. Step-by-step guidance for field freshers." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#1D9E75" />
        <meta property="og:title" content="CP Field Assistant" />
        <meta property="og:description" content="AI-powered cathodic protection field guide for freshers" />
      </Head>

      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

        {/* ── HEADER ── */}
        <header style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, zIndex: 50,
          boxShadow: "var(--shadow-sm)",
        }}>
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px", height: 58, display: "flex", alignItems: "center", gap: 12 }}>
            <CPLogo size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>
                CP Field Assistant
              </div>

            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{
                background: "var(--cp-green-light)", color: "var(--cp-green-dark)",
                fontSize: 9, fontWeight: 700, padding: "3px 8px",
                borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.8px",
              }}>Free</span>
              <span style={{
                background: "var(--surface2)", color: "var(--text2)",
                fontSize: 9, fontWeight: 600, padding: "3px 8px",
                borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.8px",
                border: "1px solid var(--border)",
              }}>AI Expert</span>
            </div>
          </div>
        </header>

        {/* ── HERO BANNER ── */}
        <div style={{
          background: "linear-gradient(135deg, var(--cp-green) 0%, var(--cp-green-dark) 100%)",
          padding: "28px 20px 32px",
        }}>
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.15)", borderRadius: 20,
              padding: "4px 12px", marginBottom: 14,
            }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
                👷 Built for Field Freshers
              </span>
            </div>
            <h1 style={{
              fontSize: 24, fontWeight: 800, color: "#fff",
              letterSpacing: "-0.5px", lineHeight: 1.25, marginBottom: 10,
            }}>
              CP Troubleshooting Guide
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
              Point your camera, get instant expert guidance.
            </p>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <main style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 80px" }}>

          {/* Upload Zone */}
          {!image && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); processFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${drag ? "var(--cp-green)" : "var(--border)"}`,
                borderRadius: "var(--radius)",
                padding: "40px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: drag ? "var(--cp-green-light)" : "var(--surface)",
                transition: "all 0.2s",
                boxShadow: "var(--shadow)",
              }}
            >
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => processFile(e.target.files[0])} />

              <div style={{
                width: 70, height: 70,
                background: "var(--cp-green-light)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
                border: "2px solid var(--cp-green-mid)",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--cp-green)" strokeWidth="1.8">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>

              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                Take a photo or upload
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5, marginBottom: 14 }}>
                Rectifiers · Test stations · Anodes<br />Instruments · Any CP equipment
              </div>

              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "var(--cp-green)", color: "#fff",
                padding: "10px 24px", borderRadius: 30,
                fontSize: 14, fontWeight: 600,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Open Camera / Upload
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 10 }}>
                PNG · JPG · WEBP · up to 10MB
              </div>
            </div>
          )}

          {/* Image Preview */}
          {image && (
            <div className="fade-up">
              <div style={{
                background: "var(--surface)", borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                overflow: "hidden", boxShadow: "var(--shadow)",
              }}>
                {/* Image */}
                <div style={{ background: "var(--surface2)", position: "relative" }}>
                  <img src={image} alt="CP Equipment" style={{ width: "100%", maxHeight: 320, objectFit: "contain", display: "block" }} />
                  <button
                    onClick={reset}
                    style={{
                      position: "absolute", top: 10, right: 10,
                      width: 32, height: 32,
                      background: "rgba(0,0,0,0.55)", color: "#fff",
                      border: "none", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                {/* Analyze Button */}
                <div style={{ padding: "14px 16px" }}>
                  <button
                    onClick={analyze}
                    disabled={loading}
                    style={{
                      width: "100%", padding: "15px",
                      background: loading ? "var(--cp-green-mid)" : "var(--cp-green)",
                      color: "#fff", border: "none",
                      borderRadius: 10, fontSize: 16, fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      transition: "background 0.2s",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {loading ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                        </svg>
                        {loadingMsg}
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        Identify & Guide Me
                      </>
                    )}
                  </button>
                  {loading && (
                    <div style={{ height: 3, background: "var(--border)", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "var(--cp-green)", animation: "loadpulse 1.5s ease-in-out infinite" }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "var(--error-bg)", border: "1px solid var(--error-border)",
              borderRadius: "var(--radius-sm)", padding: "12px 16px",
              fontSize: 13, color: "var(--error-text)", marginTop: 14,
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="fade-up" style={{ marginTop: 16 }}>

              {/* Result Header */}
              <div style={{
                background: "linear-gradient(135deg, var(--cp-green) 0%, var(--cp-green-dark) 100%)",
                borderRadius: "var(--radius) var(--radius) 0 0",
                padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>Expert Analysis Ready</div>

                </div>
              </div>

              {/* Result Body */}
              <div style={{
                background: "var(--surface)",
                borderRadius: "0 0 var(--radius) var(--radius)",
                border: "1px solid var(--border)",
                borderTop: "none",
                padding: "20px 18px",
                boxShadow: "var(--shadow)",
              }}>
                {blocks.map((b, i) => {
                  if (b.type === "space") return <div key={i} style={{ height: 8 }} />;

                  if (b.type === "header") return (
                    <div key={i} style={{
                      fontSize: 10, fontWeight: 800,
                      textTransform: "uppercase", letterSpacing: "1.2px",
                      color: "var(--cp-green-dark)",
                      margin: "20px 0 10px",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span>{b.text}</span>
                      <div style={{ flex: 1, height: 1, background: "var(--cp-green-light)" }} />
                    </div>
                  );

                  if (b.type === "step") return (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                      <div style={{
                        width: 26, height: 26, flexShrink: 0,
                        background: b.numbered ? "var(--cp-green-light)" : "var(--surface2)",
                        color: b.numbered ? "var(--cp-green-dark)" : "var(--text3)",
                        borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: b.numbered ? 12 : 18, fontWeight: 700,
                        border: b.numbered ? "1.5px solid var(--cp-green-mid)" : "1px solid var(--border)",
                        marginTop: 1,
                      }}>
                        {b.numbered ? b.num : "·"}
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text)", paddingTop: 2 }}
                        dangerouslySetInnerHTML={{ __html: b.content }} />
                    </div>
                  );

                  if (b.type === "warn") return (
                    <div key={i} style={{
                      background: "var(--warn-bg)", border: "1px solid var(--warn-border)",
                      borderRadius: "var(--radius-sm)", padding: "11px 14px",
                      fontSize: 13, color: "var(--warn-text)",
                      display: "flex", gap: 10, margin: "12px 0",
                      alignItems: "flex-start",
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                      <span dangerouslySetInnerHTML={{ __html: b.text }} />
                    </div>
                  );

                  return (
                    <p key={i} style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text2)", marginBottom: 8 }}
                      dangerouslySetInnerHTML={{ __html: b.text }} />
                  );
                })}

                {/* Analyze Another */}
                <button
                  onClick={reset}
                  style={{
                    width: "100%", marginTop: 20, padding: "12px",
                    background: "transparent", color: "var(--cp-green)",
                    border: "1.5px solid var(--cp-green)", borderRadius: 10,
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Analyse Another Equipment
                </button>
              </div>
            </div>
          )}

          {/* Feature Pills — shown only before upload */}
          {!image && !result && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>
                What you get instantly
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { icon: "🔍", title: "Equipment ID", desc: "Name, type & manufacturer" },
                  { icon: "📋", title: "Step-by-step Guide", desc: "What to do, in order" },
                  { icon: "⚠️", title: "Safety Warnings", desc: "Critical checks flagged" },
                  { icon: "📖", title: "Peabody Reference", desc: "NACE standard cited" },
                ].map((c) => (
                  <div key={c.title} style={{
                    background: "var(--surface)", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    padding: "14px 12px",
                    boxShadow: "var(--shadow-sm)",
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.4 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>


      </div>
    </>
  );
}
