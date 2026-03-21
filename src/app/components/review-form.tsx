"use client";

import { useState, useEffect } from "react";

interface ReviewComment {
  file: string;
  line: number;
  comment: string;
  severity: "critical" | "warning" | "suggestion" | "nitpick";
}

interface ReviewResult {
  pr: { title: string; owner: string; repo: string; number: number };
  stats: { filesReviewed: number; additions: number; deletions: number };
  summary: string;
  comments: ReviewComment[];
}

const SEV = {
  critical:   { label: "Severe",        badge: "Bug",  color: "#ef4444", bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.18)"  },
  warning:    { label: "Non-severe",    badge: "Bug",  color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.18)" },
  suggestion: { label: "Investigate",  badge: "Flag", color: "#6366f1", bg: "rgba(99,102,241,0.07)",  border: "rgba(99,102,241,0.18)" },
  nitpick:    { label: "Informational",badge: "Flag", color: "#6b7280", bg: "rgba(107,114,128,0.07)", border: "rgba(107,114,128,0.18)"},
};

function groupByFile(comments: ReviewComment[]) {
  const g: Record<string, ReviewComment[]> = {};
  for (const c of comments) { if (!g[c.file]) g[c.file] = []; g[c.file].push(c); }
  return g;
}

export default function ReviewForm({ prUrl, onBack }: { prUrl: string; onBack: () => void }) {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [result, setResult]     = useState<ReviewResult | null>(null);
  const [tab, setTab]           = useState<"issues" | "summary">("issues");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("Fetching diff from GitHub…");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Kick off the review as soon as we mount
  useEffect(() => {
    let cancelled = false;

    // Progress animation
    const t1 = setTimeout(() => { if (!cancelled) { setProgress(25); setStatusMsg("Parsing code changes…"); } }, 800);
    const t2 = setTimeout(() => { if (!cancelled) { setProgress(55); setStatusMsg("Running Bug Catcher analysis…"); } }, 2500);
    const t3 = setTimeout(() => { if (!cancelled) { setProgress(75); setStatusMsg("Reviewing with AI…"); } }, 5000);
    const t4 = setTimeout(() => { if (!cancelled) { setProgress(90); setStatusMsg("Finalizing review…"); } }, 9000);

    (async () => {
      try {
        const res  = await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prUrl }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) { setError(data.error || "Something went wrong"); setLoading(false); return; }
        setProgress(100);
        setTimeout(() => { if (!cancelled) { setResult(data); setLoading(false); } }, 350);
      } catch {
        if (!cancelled) { setError("Failed to connect to server"); setLoading(false); }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prUrl]);

  const fileGroups = result ? groupByFile(result.comments) : {};
  const files      = Object.keys(fileGroups);
  const count      = (s: string) => result?.comments.filter(c => c.severity === s).length ?? 0;
  const visibleComments = result
    ? selectedFile ? result.comments.filter(c => c.file === selectedFile) : result.comments
    : [];

  /* ── Loading / Error ── */
  if (loading || error) {
    return (
      <div style={{
        minHeight: "100vh", background: "#141414",
        display: "flex", flexDirection: "column",
      }}>
        {/* Slim top bar */}
        <div style={{
          height: 52, padding: "0 32px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <button
            onClick={onBack}
            style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 7, color: "rgba(255,255,255,0.5)", cursor: "pointer",
              padding: "5px 12px", fontSize: 12, fontWeight: 500, display: "flex",
              alignItems: "center", gap: 6, transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>
          <span style={{ fontSize: 12, color: "#6b7280", fontFamily: "monospace" }}>{prUrl}</span>
        </div>

        {error ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)",
              borderRadius: 10, padding: "20px 28px", maxWidth: 420, textAlign: "center",
            }}>
              <p style={{ color: "#ef4444", fontSize: 14, marginBottom: 12 }}>{error}</p>
              <button onClick={onBack} style={{
                background: "#141414", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 7, color: "rgba(255,255,255,0.75)", padding: "8px 20px",
                fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>
                Go back
              </button>
            </div>
          </div>
        ) : (
          /* ── Loading spinner ── */
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <div style={{ textAlign: "center", animation: "fadeIn 0.3s ease-out" }}>
              {/* Ring */}
              <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 24px" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.06)" }} />
                <div style={{
                  position: "absolute", top: 0, left: 0, width: 64, height: 64, borderRadius: "50%",
                  border: "1.5px solid transparent", borderTopColor: "#4ade80",
                  animation: "spin 0.9s linear infinite",
                }} />
                <div style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                  color: "#4ade80",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                  </svg>
                </div>
              </div>

              <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Analyzing Pull Request</p>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>{statusMsg}</p>

              {/* Progress bar */}
              <div style={{ width: 240, height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, margin: "20px auto 0", overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: "#4ade80", borderRadius: 2,
                  width: `${progress}%`, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>

              {/* Step dots */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
                {["Fetch","Parse","Analyze","Finalize"].map((s, i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: progress >= [0,25,55,75][i] ? "#4ade80" : "rgba(255,255,255,0.1)",
                      transition: "background 0.3s",
                    }} />
                    <span style={{ fontSize: 10, color: progress >= [0,25,55,75][i] ? "#9ca3af" : "#3d4852" }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Results ── */
  return (
    <div style={{ minHeight: "100vh", background: "#141414", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{
        height: 52, padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#141414", flexShrink: 0, animation: "fadeIn 0.3s ease-out",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 7, color: "rgba(255,255,255,0.5)", cursor: "pointer",
              padding: "5px 10px", fontSize: 12, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{result!.pr.title}</span>
            <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>
              {result!.pr.owner}/{result!.pr.repo}
            </span>
            <span style={{
              fontSize: 10, color: "#6b7280", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 5, fontFamily: "monospace",
            }}>
              #{result!.pr.number}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12 }}>
          <span style={{ color: "#4ade80", fontFamily: "monospace", fontWeight: 600 }}>+{result!.stats.additions}</span>
          <span style={{ color: "#f87171", fontFamily: "monospace", fontWeight: 600 }}>-{result!.stats.deletions}</span>
          <span style={{ color: "#6b7280" }}>{result!.stats.filesReviewed} files</span>
        </div>
      </div>

      {/* Body: file panel + content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* File panel */}
        <div style={{
          width: 240, minWidth: 240, borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", background: "#141414",
          animation: "fadeIn 0.35s ease-out",
        }}>
          {/* Panel header */}
          <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Files</span>
              <span style={{ fontSize: 10, color: "#6b7280" }}>{files.length} changed</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444" }} />
                <span style={{ fontSize: 10, color: "#6b7280" }}>{count("critical") + count("warning")} Bugs</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1" }} />
                <span style={{ fontSize: 10, color: "#6b7280" }}>{count("suggestion") + count("nitpick")} Flags</span>
              </div>
            </div>
          </div>

          {/* File list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
            <FileItem path="All files" count={result!.comments.length} active={selectedFile === null} isAll onClick={() => setSelectedFile(null)} />
            <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "4px 0" }} />
            {files.map(f => (
              <FileItem key={f} path={f} count={fileGroups[f].length} active={selectedFile === f}
                onClick={() => setSelectedFile(f)}
                severity={fileGroups[f].some(c => c.severity === "critical") ? "critical" : fileGroups[f].some(c => c.severity === "warning") ? "warning" : fileGroups[f].some(c => c.severity === "suggestion") ? "suggestion" : "nitpick"}
              />
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Sub-header */}
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#141414", flexShrink: 0 }}>
            {/* Bug Catcher bar */}
            <div style={{ padding: "8px 20px", display: "flex", gap: 16, alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#ef4444" }}>Bugs</span>
                {count("critical") > 0 && <Chip label={`${count("critical")} Severe`} color="#ef4444" />}
                {count("warning") > 0 && <Chip label={`${count("warning")} Non-severe`} color="#f59e0b" />}
                {count("critical") + count("warning") === 0 && <span style={{ fontSize: 11, color: "#3d4852" }}>None found</span>}
              </div>
              <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#6366f1" }}>Flags</span>
                {count("suggestion") > 0 && <Chip label={`${count("suggestion")} Investigate`} color="#6366f1" />}
                {count("nitpick") > 0 && <Chip label={`${count("nitpick")} Info`} color="#6b7280" />}
                {count("suggestion") + count("nitpick") === 0 && <span style={{ fontSize: 11, color: "#3d4852" }}>None</span>}
              </div>
            </div>
            {/* Tabs */}
            <div style={{ display: "flex", padding: "0 20px" }}>
              <TabBtn active={tab === "issues"} onClick={() => setTab("issues")}>Issues ({result!.comments.length})</TabBtn>
              <TabBtn active={tab === "summary"} onClick={() => setTab("summary")}>Summary</TabBtn>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            {tab === "issues" && (
              <div style={{ maxWidth: 760 }}>
                {visibleComments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", animation: "fadeIn 0.3s" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#4ade80" }}>No issues found</p>
                    <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>This pull request looks good to merge</p>
                  </div>
                ) : (
                  <IssuesList comments={visibleComments} />
                )}
              </div>
            )}
            {tab === "summary" && (
              <div style={{ maxWidth: 680, animation: "fadeIn 0.3s" }}>
                {/* PR meta */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 18, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{result!.pr.title}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{result!.pr.owner}/{result!.pr.repo} #{result!.pr.number}</span>
                  </div>
                  <div style={{ display: "flex", gap: 20 }}>
                    {[{ val: `+${result!.stats.additions}`, c: "#4ade80", lbl: "additions" }, { val: `-${result!.stats.deletions}`, c: "#f87171", lbl: "deletions" }, { val: String(result!.stats.filesReviewed), c: "rgba(255,255,255,0.85)", lbl: "files" }].map(({ val, c, lbl }) => (
                      <div key={lbl} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: c, fontFamily: "monospace" }}>{val}</div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Summary text */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>AI Review Summary</p>
                  <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{result!.summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function FileItem({ path, count, active, isAll, onClick, severity }: { path: string; count: number; active: boolean; isAll?: boolean; onClick: () => void; severity?: string }) {
  const s = severity ? SEV[severity as keyof typeof SEV] : null;
  const short = path.length > 28 ? "…" + path.slice(-26) : path;
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "5px 14px", cursor: "pointer",
      background: active ? "rgba(255,255,255,0.04)" : "transparent",
      borderLeft: `2px solid ${active ? "#4ade80" : "transparent"}`,
      transition: "all 0.12s",
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      {isAll
        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        : <svg width="12" height="12" viewBox="0 0 16 16" fill={s ? s.color : "#6b7280"} fillOpacity="0.6"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"/></svg>
      }
      <span style={{ flex: 1, fontSize: 11, color: active ? "rgba(255,255,255,0.85)" : "#6b7280", fontFamily: isAll ? "inherit" : "monospace", fontWeight: isAll ? 500 : 400, overflow: "hidden", whiteSpace: "nowrap", transition: "color 0.12s" }}>
        {isAll ? "All files" : short}
      </span>
      <span style={{ fontSize: 10, fontWeight: 600, color: s ? s.color : "#6b7280", background: s ? s.bg : "transparent", padding: "1px 5px", borderRadius: 4, minWidth: 16, textAlign: "center" }}>{count}</span>
    </div>
  );
}

function IssuesList({ comments }: { comments: ReviewComment[] }) {
  const grouped = groupByFile(comments);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {Object.entries(grouped).map(([file, fc]) => (
        <div key={file}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="#6b7280"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"/></svg>
            <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>{file}</span>
            <span style={{ fontSize: 10, color: "#6b7280", background: "rgba(255,255,255,0.04)", padding: "1px 6px", borderRadius: 4 }}>{fc.length} issue{fc.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {fc.map((c, i) => <IssueCard key={i} comment={c} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function IssueCard({ comment }: { comment: ReviewComment }) {
  const s = SEV[comment.severity];
  const [resolved, setResolved] = useState(false);
  return (
    <div style={{
      background: resolved ? "rgba(255,255,255,0.02)" : s.bg,
      border: `1px solid ${resolved ? "rgba(255,255,255,0.06)" : s.border}`,
      borderRadius: 8, padding: "12px 14px",
      borderLeft: `2px solid ${resolved ? "rgba(255,255,255,0.08)" : s.color}`,
      opacity: resolved ? 0.45 : 1, transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: s.color, background: `${s.color}14`, border: `1px solid ${s.color}22`, padding: "2px 6px", borderRadius: 4 }}>{s.badge}</span>
          <span style={{ fontSize: 10, fontWeight: 500, color: s.color }}>{s.label}</span>
          <span style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>L{comment.line}</span>
        </div>
        <button onClick={() => setResolved(!resolved)} style={{
          background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5,
          color: resolved ? "#4ade80" : "#6b7280", cursor: "pointer", padding: "2px 9px",
          fontSize: 10, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.22)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
        >
          {resolved ? <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>Resolved</> : "Resolve"}
        </button>
      </div>
      <p style={{ fontSize: 13, color: resolved ? "#6b7280" : "#9ca3af", lineHeight: 1.65, transition: "color 0.2s" }}>{comment.comment}</p>
    </div>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 500, color, background: `${color}12`, border: `1px solid ${color}25`, padding: "2px 7px", borderRadius: 4 }}>
      {label}
    </span>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", border: "none", cursor: "pointer",
      padding: "10px 16px", fontSize: 12, fontWeight: 500,
      color: active ? "rgba(255,255,255,0.9)" : "#6b7280",
      borderBottom: `2px solid ${active ? "#4ade80" : "transparent"}`,
      transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}
