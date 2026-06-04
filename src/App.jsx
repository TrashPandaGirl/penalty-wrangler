import { useState, useCallback, useEffect } from "react";

// ── WFTDA Penalty Codes — official Quick Reference Guide (updated March 2019) ─
// Source: https://static.wftda.com/officiating/wftda-penalty-quick-reference-guide.pdf
const PENALTY_CODES = [
    { code: "A", label: "High Block" },           // 4.1.1 Impact to Illegal Target Zone
    { code: "B", label: "Back Block" },           // 4.1.1
    { code: "L", label: "Low Block" },            // 4.1.1
    { code: "H", label: "Head Block" },           // 4.1.2 Impact with Illegal Blocking Zone
    { code: "F", label: "Forearm" },              // 4.1.2
    { code: "C", label: "Illegal Contact" },      // 4.1.2 incl. Illegal Assist, Early Hit
    { code: "D", label: "Direction" },            // 4.1.2 incl. Stop Block
    { code: "E", label: "Leg Block" },            // 4.1.2
    { code: "M", label: "Multiplayer" },          // 4.1.4
    { code: "P", label: "Illegal Position" },     // 4.2.1 incl. Destruction, Skating OOB, Failure to Reform/Return/Yield
    { code: "X", label: "Cut" },                  // 4.2.2 incl. Illegal Re-Entry
    { code: "I", label: "Interference" },         // 4.2.3 incl. Delay of Game
    { code: "N", label: "Illegal Procedure" },    // 4.2.4 incl. Star Pass Violation/Interference
    { code: "G", label: "Misconduct" },           // 4.3 incl. Insubordination
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const alphanumSort = (a, b) => a.toString().localeCompare(b.toString());

const SCREEN = { SETUP: "setup", GAME: "game", REVIEW: "review" };

const emptyJam = () => ({
    lead: { teamA: null, teamB: null },        // null | "lead" | "lost"
    jamEnd: null,                               // null | "lead" | "2min" | "injury"
    starPass: { teamA: false, teamB: false },   // boolean per team
    penalties: [],                              // [{ skater, team, code }]
});

const C = {
    bg: "#0d0f12",
    surface: "#161a1f",
    surfaceHigh: "#1e242b",
    surfaceMid: "#181d23",
    border: "#2a3140",
    accent: "#f0c040",
    accentDim: "#7a6020",
    textPrimary: "#e8eaed",
    textSecondary: "#7a8694",
    danger: "#ef4444",
    lost: "#a855f7",
    foulout: "#ff6b35",
};

const btn = (extra = {}) => ({
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 700,
    letterSpacing: "0.04em",
    borderRadius: 8,
    transition: "all 0.12s ease",
    ...extra,
});

// ════════════════════════════════════════════════════════════════════════════
// SETUP SCREEN
// ════════════════════════════════════════════════════════════════════════════
function SetupScreen({ onStart }) {
    const [teamAName, setTeamAName] = useState("");
    const [teamBName, setTeamBName] = useState("");
    const [teamAColor, setTeamAColor] = useState("#3b82f6");
    const [teamBColor, setTeamBColor] = useState("#ef4444");
    const [teamARosterRaw, setTeamARosterRaw] = useState("");
    const [teamBRosterRaw, setTeamBRosterRaw] = useState("");

    const parseRoster = (raw) =>
        raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).sort(alphanumSort);

    const rosterA = parseRoster(teamARosterRaw);
    const rosterB = parseRoster(teamBRosterRaw);
    const canStart = teamAName.trim() && teamBName.trim() && rosterA.length > 0 && rosterB.length > 0;

    const inputStyle = {
        background: C.surfaceHigh,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        color: C.textPrimary,
        fontFamily: "inherit",
        fontSize: 15,
        padding: "10px 12px",
        width: "100%",
        boxSizing: "border-box",
        outline: "none",
    };

    return (
        <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 40 }}>
            <div style={{ width: "100%", background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "16px 32px", marginBottom: 32 }}>
                <div style={{ fontSize: 11, color: C.accent, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 2 }}>WFTDA</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.textPrimary }}>Penalty Wrangler <span style={{ color: C.textSecondary, fontWeight: 400, fontSize: 14 }}>· Game Setup</span></div>
            </div>

            <div style={{ width: "100%", maxWidth: 920, padding: "0 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {[
                    { label: "Team A", name: teamAName, setName: setTeamAName, color: teamAColor, setColor: setTeamAColor, raw: teamARosterRaw, setRaw: setTeamARosterRaw, roster: rosterA },
                    { label: "Team B", name: teamBName, setName: setTeamBName, color: teamBColor, setColor: setTeamBColor, raw: teamBRosterRaw, setRaw: setTeamBRosterRaw, roster: rosterB },
                ].map(({ label, name, setName, color, setColor, raw, setRaw, roster }) => (
                    <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, borderTop: `3px solid ${color}` }}>
                        <div style={{ fontSize: 12, color, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{label}</div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                            <input style={{ ...inputStyle, flex: 1 }} placeholder="Team name" value={name} onChange={(e) => setName(e.target.value)} />
                            <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 12px" }}>
                                <span style={{ color: C.textSecondary, fontSize: 12 }}>Color</span>
                                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 32, height: 32, border: "none", background: "none", cursor: "pointer", padding: 0 }} />
                            </div>
                        </div>
                        <textarea style={{ ...inputStyle, height: 120, resize: "vertical", fontSize: 14 }}
                                  placeholder={"Roster numbers, one per line or comma-separated\ne.g. 42, 007, 1312, 69"}
                                  value={raw} onChange={(e) => setRaw(e.target.value)} />
                        {roster.length > 0 && <div style={{ color: C.textSecondary, fontSize: 12, marginTop: 6 }}>{roster.length} skaters: {roster.slice(0, 8).join(", ")}{roster.length > 8 ? " …" : ""}</div>}
                    </div>
                ))}
            </div>

            <div style={{ width: "100%", maxWidth: 920, padding: "20px 32px 0" }}>
                <button
                    style={{ ...btn(), width: "100%", padding: "16px 0", fontSize: 16, background: canStart ? C.accent : C.surfaceHigh, color: canStart ? "#000" : C.textSecondary }}
                    disabled={!canStart}
                    onClick={() => onStart({
                        teamA: { name: teamAName.trim(), color: teamAColor, roster: rosterA },
                        teamB: { name: teamBName.trim(), color: teamBColor, roster: rosterB },
                    })}
                >
                    START GAME →
                </button>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PENALTY PANEL — slides up, shows only selected team's roster + all codes
// ════════════════════════════════════════════════════════════════════════════
function PenaltyPanel({ teamKey, team, penaltyCount, fouledOut, onLog, onCancel }) {
    const [selectedSkater, setSelectedSkater] = useState(null);
    const color = team.color;
    const tc = penaltyCount[teamKey] || {};

    const handleCode = (code) => {
        if (!selectedSkater) return;
        onLog(selectedSkater, teamKey, code);
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
            <div style={{ width: "100%", height: "70%", background: C.surface, borderRadius: "20px 20px 0 0", display: "flex", overflow: "hidden" }}>

                {/* LEFT — this team's roster only */}
                <div style={{ flex: 1.3, borderRight: `1px solid ${C.border}`, padding: "18px 16px 24px", overflowY: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div>
                            <div style={{ fontSize: 11, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em" }}>Penalty for</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color, marginTop: 2 }}>{team.name}</div>
                            {selectedSkater && <div style={{ fontSize: 20, fontWeight: 900, color, marginTop: 2 }}>#{selectedSkater}</div>}
                        </div>
                        <button onClick={onCancel} style={{ ...btn(), background: C.surfaceHigh, color: C.textSecondary, padding: "6px 14px", fontSize: 13 }}>Cancel</button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                        {team.roster.map((num) => {
                            const count = tc[num] || 0;
                            const fo = fouledOut[teamKey]?.[num];
                            const selected = selectedSkater === num;
                            return (
                                <button key={num}
                                        style={{
                                            ...btn(),
                                            background: selected ? color : C.surfaceHigh,
                                            border: `2px solid ${selected ? color : count >= 6 ? C.foulout : count >= 4 ? C.accentDim : C.border}`,
                                            color: selected ? "#fff" : fo ? C.textSecondary : C.textPrimary,
                                            padding: "10px 4px",
                                            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                                            opacity: fo ? 0.35 : 1,
                                        }}
                                        onClick={() => !fo && setSelectedSkater(selected ? null : num)}
                                >
                                    <span style={{ fontSize: 15, fontWeight: 900 }}>{num}</span>
                                    {count > 0 && (
                                        <span style={{ fontSize: 9, fontWeight: 700, color: selected ? "rgba(255,255,255,0.75)" : count >= 6 ? C.foulout : C.accentDim }}>
                      {fo ? "FO" : `${count}p`}
                    </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT — penalty codes */}
                <div style={{ flex: 1, padding: "18px 16px 24px", overflowY: "auto", background: C.surfaceMid }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: selectedSkater ? C.textPrimary : C.textSecondary, marginBottom: 14 }}>
                        {selectedSkater ? "Select Code" : "← Pick skater first"}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        {PENALTY_CODES.map(({ code, label }) => (
                            <button key={code}
                                    style={{
                                        ...btn(),
                                        background: selectedSkater ? C.surfaceHigh : C.bg,
                                        border: `1px solid ${selectedSkater ? C.border : C.surfaceHigh}`,
                                        color: C.textPrimary,
                                        padding: "10px 8px",
                                        display: "flex", alignItems: "center", gap: 8,
                                        opacity: selectedSkater ? 1 : 0.35,
                                    }}
                                    onClick={() => handleCode(code)}
                                    disabled={!selectedSkater}
                            >
                                <span style={{ fontSize: 18, fontWeight: 900, color: selectedSkater ? C.accent : C.textSecondary, minWidth: 20, textAlign: "center" }}>{code}</span>
                                <span style={{ fontSize: 11, color: C.textSecondary, lineHeight: 1.3 }}>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// JAM REPORT OVERLAY
// ════════════════════════════════════════════════════════════════════════════
function JamReport({ period, jam, jamData, teams, onDismiss }) {
    const [remaining, setRemaining] = useState(20);

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining((r) => { if (r <= 1) { clearInterval(interval); onDismiss(); return 0; } return r - 1; });
        }, 1000);
        return () => clearInterval(interval);
    }, [onDismiss]);

    const teamColor = (key) => (key === "teamA" ? teams.teamA.color : teams.teamB.color);
    const teamName  = (key) => (key === "teamA" ? teams.teamA.name  : teams.teamB.name);
    const jamEndLabel = (v) => v === "lead" ? "Called Off" : v === "2min" ? "2 Min" : v === "injury" ? "Injury" : null;
    const pct = (remaining / 20) * 100;

    const leadTags = ["teamA", "teamB"].flatMap((tk) => {
        const s = jamData.lead?.[tk];
        if (s === "lead") return [{ key: tk, text: `Lead: ${teamName(tk)}`, color: teamColor(tk), bg: `${teamColor(tk)}22`, border: teamColor(tk) }];
        if (s === "lost") return [{ key: tk, text: `${teamName(tk)} Lost`,   color: C.lost,          bg: `${C.lost}22`,          border: C.lost }];
        return [];
    });
    const starTags = ["teamA", "teamB"].filter((tk) => jamData.starPass?.[tk]);
    const hasData  = jamData.penalties.length > 0 || leadTags.length > 0 || jamData.jamEnd || starTags.length > 0;

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 32 }}>
            <div style={{ width: "100%", maxWidth: 700, background: C.surface, borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <div style={{ height: 4, background: C.surfaceHigh }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: C.accent, transition: "width 1s linear" }} />
                </div>
                <div style={{ padding: "20px 24px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                            <div style={{ fontSize: 11, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.15em" }}>Jam Report</div>
                            <div style={{ fontSize: 30, fontWeight: 900, color: C.textPrimary, lineHeight: 1 }}>P{period} · <span style={{ color: C.accent }}>J{jam}</span></div>
                        </div>
                        <button onClick={onDismiss} style={{ ...btn(), background: C.surfaceHigh, color: C.textSecondary, padding: "8px 16px", fontSize: 13 }}>Dismiss · {remaining}s</button>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: jamData.penalties.length > 0 ? 16 : 0 }}>
                        {leadTags.length === 0 && (
                            <div style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px" }}>
                                <div style={{ fontSize: 10, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em" }}>Lead</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: C.textSecondary }}>No Lead</div>
                            </div>
                        )}
                        {leadTags.map((t) => (
                            <div key={t.key} style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 14px" }}>
                                <div style={{ fontSize: 10, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em" }}>Lead</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: t.color }}>{t.text}</div>
                            </div>
                        ))}
                        {jamData.jamEnd && (
                            <div style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px" }}>
                                <div style={{ fontSize: 10, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em" }}>End</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary }}>{jamEndLabel(jamData.jamEnd)}</div>
                            </div>
                        )}
                        {starTags.map((tk) => (
                            <div key={tk} style={{ background: `${teamColor(tk)}22`, border: `1px solid ${teamColor(tk)}`, borderRadius: 8, padding: "6px 14px" }}>
                                <div style={{ fontSize: 10, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em" }}>Star Pass</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: teamColor(tk) }}>{teamName(tk)}</div>
                            </div>
                        ))}
                    </div>

                    {jamData.penalties.length > 0 && (
                        <div>
                            <div style={{ fontSize: 11, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                                {jamData.penalties.length} {jamData.penalties.length === 1 ? "Penalty" : "Penalties"}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                {jamData.penalties.map((p, i) => {
                                    const tc = teamColor(p.team);
                                    return (
                                        <div key={i} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderLeft: `4px solid ${tc}`, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <span style={{ fontSize: 15, fontWeight: 900, color: tc }}>#{p.skater}</span>
                                                <span style={{ fontSize: 11, color: C.textSecondary }}>{teamName(p.team)}</span>
                                            </div>
                                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                <span style={{ fontSize: 18, fontWeight: 900, color: C.accent }}>{p.code}</span>
                                                <span style={{ fontSize: 10, color: C.textSecondary }}>{PENALTY_CODES.find((x) => x.code === p.code)?.label}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {!hasData && <div style={{ color: C.textSecondary, fontSize: 14, textAlign: "center", padding: "8px 0" }}>No data recorded for this jam</div>}
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// TEAM PANEL — one half of the game screen
// ════════════════════════════════════════════════════════════════════════════
function TeamPanel({ teamKey, team, currentJam, penaltyCount, updateJam, onLogPenalty }) {
    const color = team.color;
    const isLeadActive = currentJam.lead?.[teamKey] === "lead";
    const isLostActive = currentJam.lead?.[teamKey] === "lost";
    const isStarPass   = currentJam.starPass?.[teamKey] === true;

    const handleLeadTap = () => {
        if (isLostActive) return;
        updateJam((j) => ({ ...j, lead: { ...j.lead, [teamKey]: isLeadActive ? null : "lead" } }));
    };
    const handleLostTap = () => {
        updateJam((j) => ({ ...j, lead: { ...j.lead, [teamKey]: isLostActive ? null : "lost" } }));
    };
    const handleStarPass = () => {
        updateJam((j) => ({ ...j, starPass: { ...j.starPass, [teamKey]: !isStarPass } }));
    };

    const teamPenalties = currentJam.penalties.filter((p) => p.team === teamKey);
    const totalCount = Object.values(penaltyCount[teamKey] || {}).reduce((a, b) => a + b, 0);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "12px 14px", gap: 8 }}>

            {/* Team header */}
            <div style={{ borderTop: `3px solid ${color}`, background: C.surface, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color }}>{team.name}</div>
                    <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 1 }}>{totalCount} penalties total</div>
                </div>
                {/* Lead + Lost inline */}
                <div style={{ display: "flex", gap: 6 }}>
                    <button
                        style={{ ...btn(), padding: "7px 14px", fontSize: 12, background: isLeadActive ? color : C.surfaceHigh, color: isLeadActive ? "#fff" : C.textSecondary, border: `2px solid ${isLeadActive ? color : C.border}`, opacity: isLostActive ? 0.4 : 1 }}
                        onClick={handleLeadTap}
                    >
                        {isLeadActive ? "✓ Lead" : "Lead"}
                    </button>
                    <button
                        style={{ ...btn(), padding: "7px 12px", fontSize: 12, background: isLostActive ? C.lost : C.surfaceHigh, color: isLostActive ? "#fff" : C.textSecondary, border: `2px solid ${isLostActive ? C.lost : C.border}` }}
                        onClick={handleLostTap}
                    >
                        {isLostActive ? "✓ Lost" : "Lost"}
                    </button>
                    <button
                        style={{ ...btn(), padding: "7px 12px", fontSize: 12, background: isStarPass ? color : C.surfaceHigh, color: isStarPass ? "#fff" : C.textSecondary, border: `2px solid ${isStarPass ? color : C.border}` }}
                        onClick={handleStarPass}
                    >
                        {isStarPass ? "★ SP ✓" : "★ SP"}
                    </button>
                </div>
            </div>

            {/* This jam's penalties for this team */}
            <div style={{ flex: 1, overflowY: "auto", background: C.surface, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                    This Jam — {teamPenalties.length} {teamPenalties.length === 1 ? "penalty" : "penalties"}
                </div>
                {teamPenalties.length === 0
                    ? <div style={{ fontSize: 12, color: C.textSecondary, fontStyle: "italic", textAlign: "center", paddingTop: 12 }}>No penalties this jam</div>
                    : <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {teamPenalties.map((p, i) => (
                            <div key={i} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 6, padding: "6px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 16, fontWeight: 900, color }}>#{p.skater}</span>
                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    <span style={{ fontSize: 17, fontWeight: 900, color: C.accent }}>{p.code}</span>
                                    <span style={{ fontSize: 10, color: C.textSecondary }}>{PENALTY_CODES.find((x) => x.code === p.code)?.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                }
            </div>

            {/* Log Penalty button */}
            <button
                style={{ ...btn(), padding: "14px 0", fontSize: 15, background: color, color: "#fff", letterSpacing: "0.05em", flexShrink: 0 }}
                onClick={onLogPenalty}
            >
                + LOG PENALTY
            </button>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// GAME SCREEN — landscape, two equal team panels + shared top bar
// ════════════════════════════════════════════════════════════════════════════
function GameScreen({ teams, onFinish }) {
    const [period, setPeriod] = useState(1);
    const [jam, setJam]       = useState(1);
    const [jams, setJams]     = useState({ 1: { 1: emptyJam() } });
    const [penaltyPanel, setPenaltyPanel] = useState(null); // null | "teamA" | "teamB"
    const [jamReport, setJamReport]       = useState(null);

    const currentJam = jams[period]?.[jam] || emptyJam();

    const updateJam = (updater) => {
        setJams((prev) => {
            const pd = prev[period] || {};
            const jd = pd[jam] || emptyJam();
            return { ...prev, [period]: { ...pd, [jam]: updater(jd) } };
        });
    };

    const penaltyCount = useCallback(() => {
        const counts = { teamA: {}, teamB: {} };
        Object.values(jams).forEach((pj) =>
            Object.values(pj).forEach((j) =>
                j.penalties.forEach(({ skater, team }) => {
                    counts[team][skater] = (counts[team][skater] || 0) + 1;
                })
            )
        );
        return counts;
    }, [jams])();

    const fouledOut = {
        teamA: Object.fromEntries(Object.entries(penaltyCount.teamA).filter(([, v]) => v >= 7)),
        teamB: Object.fromEntries(Object.entries(penaltyCount.teamB).filter(([, v]) => v >= 7)),
    };

    const handleLog = (skaterNum, teamKey, code) => {
        updateJam((j) => ({ ...j, penalties: [...j.penalties, { skater: skaterNum, team: teamKey, code }] }));
        setPenaltyPanel(null);
    };

    const doNextJam = () => {
        const snapshot = jams[period]?.[jam] || emptyJam();
        const nextJ = jam + 1;
        setJam(nextJ);
        setJams((prev) => {
            const pd = prev[period] || {};
            if (!pd[nextJ]) return { ...prev, [period]: { ...pd, [nextJ]: emptyJam() } };
            return prev;
        });
        setJamReport({ period, jam, jamData: snapshot });
    };

    const nextPeriod = () => {
        if (period === 2) { onFinish(jams); return; }
        setPeriod(2); setJam(1);
        setJams((prev) => ({ ...prev, 2: { 1: emptyJam() } }));
    };

    const undoLastPenalty = () => updateJam((j) => ({ ...j, penalties: j.penalties.slice(0, -1) }));

    return (
        <div style={{ height: "100vh", background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* ── Top bar ── */}
            <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>

                {/* Period + Jam */}
                <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span style={{ fontSize: 10, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.12em" }}>Period</span>
                    <span style={{ fontSize: 26, fontWeight: 900, color: C.textPrimary, lineHeight: 1 }}>{period}</span>
                    <span style={{ color: C.border, fontSize: 18 }}>·</span>
                    <span style={{ fontSize: 10, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.12em" }}>Jam</span>
                    <span style={{ fontSize: 26, fontWeight: 900, color: C.accent, lineHeight: 1 }}>{jam}</span>
                </div>

                {/* Jam End */}
                <div style={{ display: "flex", gap: 5, marginLeft: 8 }}>
                    {[["lead", "Called Off"], ["2min", "2 Min"], ["injury", "Injury"]].map(([value, label]) => {
                        const active = currentJam.jamEnd === value;
                        return (
                            <button key={value}
                                    style={{ ...btn(), padding: "6px 12px", fontSize: 12, background: active ? C.accent : C.surfaceHigh, color: active ? "#000" : C.textSecondary, border: `2px solid ${active ? C.accent : C.border}` }}
                                    onClick={() => updateJam((j) => ({ ...j, jamEnd: active ? null : value }))}>
                                {label}
                            </button>
                        );
                    })}
                </div>

                <div style={{ flex: 1 }} />

                {/* Undo + navigation */}
                <div style={{ display: "flex", gap: 8 }}>
                    {currentJam.penalties.length > 0 && (
                        <button style={{ ...btn(), background: "none", color: C.danger, fontSize: 13, padding: "6px 12px", border: `1px solid ${C.danger}` }} onClick={undoLastPenalty}>↩ Undo</button>
                    )}
                    <button style={{ ...btn(), background: C.surfaceHigh, color: C.textSecondary, border: `1px solid ${C.border}`, padding: "6px 14px", fontSize: 13 }} onClick={doNextJam}>Next Jam →</button>
                    <button style={{ ...btn(), background: period === 2 ? C.danger : C.surfaceHigh, color: period === 2 ? "#fff" : C.textSecondary, border: `1px solid ${C.border}`, padding: "6px 14px", fontSize: 13 }} onClick={nextPeriod}>
                        {period === 2 ? "End Game" : "Period 2 →"}
                    </button>
                </div>
            </div>

            {/* ── Two team panels ── */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
                <div style={{ borderRight: `1px solid ${C.border}`, overflow: "hidden" }}>
                    <TeamPanel
                        teamKey="teamA" team={teams.teamA}
                        currentJam={currentJam} penaltyCount={penaltyCount}
                        updateJam={updateJam} onLogPenalty={() => setPenaltyPanel("teamA")}
                    />
                </div>
                <div style={{ overflow: "hidden" }}>
                    <TeamPanel
                        teamKey="teamB" team={teams.teamB}
                        currentJam={currentJam} penaltyCount={penaltyCount}
                        updateJam={updateJam} onLogPenalty={() => setPenaltyPanel("teamB")}
                    />
                </div>
            </div>

            {/* Penalty panel */}
            {penaltyPanel && (
                <PenaltyPanel
                    teamKey={penaltyPanel}
                    team={teams[penaltyPanel]}
                    penaltyCount={penaltyCount}
                    fouledOut={fouledOut}
                    onLog={handleLog}
                    onCancel={() => setPenaltyPanel(null)}
                />
            )}

            {/* Jam report */}
            {jamReport && (
                <JamReport period={jamReport.period} jam={jamReport.jam} jamData={jamReport.jamData} teams={teams} onDismiss={() => setJamReport(null)} />
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// REVIEW SCREEN
// ════════════════════════════════════════════════════════════════════════════
function ReviewScreen({ jams, teams, onReset }) {
    const [activeTab, setActiveTab] = useState("jams");
    const [filterTeam, setFilterTeam] = useState("all");

    const teamColor = (key) => (key === "teamA" ? teams.teamA.color : teams.teamB.color);
    const teamName  = (key) => (key === "teamA" ? teams.teamA.name  : teams.teamB.name);

    const allPenalties = [];
    Object.entries(jams).forEach(([p, pj]) =>
        Object.entries(pj).forEach(([j, jd]) =>
            jd.penalties.forEach((pen) => allPenalties.push({ period: parseInt(p), jam: parseInt(j), ...pen }))
        )
    );

    const skaterSummary = {};
    allPenalties.forEach(({ skater, team, code, period, jam }) => {
        const key = `${team}-${skater}`;
        if (!skaterSummary[key]) skaterSummary[key] = { skater, team, penalties: [] };
        skaterSummary[key].penalties.push({ code, period, jam });
    });

    const jamEndLabel = (v) => v === "lead" ? "Called Off" : v === "2min" ? "2 Min" : v === "injury" ? "Injury" : "—";

    const leadTagsForJam = (leadObj) =>
        ["teamA", "teamB"].flatMap((tk) => {
            const s = leadObj?.[tk];
            if (s === "lead") return [{ key: tk, text: `Lead: ${teamName(tk)}`, color: teamColor(tk) }];
            if (s === "lost") return [{ key: tk, text: `${teamName(tk)} Lost`,   color: C.lost }];
            return [];
        });

    return (
        <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
            <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                        <div style={{ fontSize: 11, color: C.accent, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>Post-Game</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: C.textPrimary }}>Review</div>
                    </div>
                    <button onClick={onReset} style={{ ...btn(), background: C.surfaceHigh, color: C.textSecondary, border: `1px solid ${C.border}`, padding: "8px 16px", fontSize: 13 }}>New Game</button>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                    {["teamA", "teamB"].map((tk) => (
                        <div key={tk} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderLeft: `4px solid ${teamColor(tk)}`, borderRadius: 8, padding: "8px 16px", display: "flex", gap: 16, alignItems: "center" }}>
                            <div style={{ fontSize: 13, color: teamColor(tk), fontWeight: 700 }}>{teams[tk].name}</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: C.textPrimary }}>{allPenalties.filter((p) => p.team === tk).length}</div>
                            <div style={{ fontSize: 12, color: C.textSecondary }}>penalties</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
                {["jams", "skaters"].map((id) => (
                    <button key={id} style={{ ...btn(), flex: 1, padding: "12px 0", background: activeTab === id ? C.accent : C.surfaceHigh, color: activeTab === id ? "#000" : C.textSecondary, fontSize: 14, borderRadius: 0 }} onClick={() => setActiveTab(id)}>
                        {id === "jams" ? "By Jam" : "By Skater"}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
                {activeTab === "jams" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {Object.entries(jams).flatMap(([p, pj]) =>
                            Object.entries(pj)
                                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                .map(([j, jd]) => {
                                    const tags = leadTagsForJam(jd.lead);
                                    const starTags = ["teamA", "teamB"].filter((tk) => jd.starPass?.[tk]);
                                    const has = jd.penalties.length > 0 || tags.length > 0 || jd.jamEnd || starTags.length > 0;
                                    if (!has) return null;
                                    return (
                                        <div key={`${p}-${j}`} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: C.textSecondary }}>P{p} · <span style={{ color: C.accent }}>J{j}</span></span>
                                                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                    {tags.map((t)     => <span key={t.key} style={{ fontSize: 10, color: t.color, border: `1px solid ${t.color}`, borderRadius: 4, padding: "2px 6px" }}>{t.text}</span>)}
                                                    {jd.jamEnd        && <span style={{ fontSize: 10, color: C.textSecondary, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 6px" }}>{jamEndLabel(jd.jamEnd)}</span>}
                                                    {starTags.map((tk) => <span key={tk} style={{ fontSize: 10, color: teamColor(tk), border: `1px solid ${teamColor(tk)}`, borderRadius: 4, padding: "2px 6px" }}>★ {teamName(tk)}</span>)}
                                                </div>
                                            </div>
                                            {jd.penalties.length > 0 && (
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                                    {jd.penalties.map((pen, i) => {
                                                        const tc = teamColor(pen.team);
                                                        return (
                                                            <div key={i} style={{ background: C.surfaceHigh, borderLeft: `3px solid ${tc}`, borderRadius: 5, padding: "3px 8px", display: "flex", gap: 5, alignItems: "center" }}>
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: tc }}>#{pen.skater}</span>
                                                                <span style={{ fontSize: 13, fontWeight: 900, color: C.accent }}>{pen.code}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                    </div>
                )}

                {activeTab === "skaters" && (
                    <div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                            {["all", "teamA", "teamB"].map((f) => (
                                <button key={f} style={{ ...btn(), padding: "7px 14px", fontSize: 13, background: filterTeam === f ? C.accent : C.surfaceHigh, color: filterTeam === f ? "#000" : C.textSecondary, border: `1px solid ${C.border}` }} onClick={() => setFilterTeam(f)}>
                                    {f === "all" ? "All" : teams[f].name}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {Object.values(skaterSummary)
                                .filter((s) => filterTeam === "all" || s.team === filterTeam)
                                .sort((a, b) => b.penalties.length - a.penalties.length || alphanumSort(a.skater, b.skater))
                                .map(({ skater, team, penalties }) => {
                                    const count = penalties.length;
                                    const isFO = count >= 7;
                                    const tc = teamColor(team);
                                    return (
                                        <div key={`${team}-${skater}`} style={{ background: C.surface, border: `1px solid ${isFO ? C.foulout : C.border}`, borderLeft: `4px solid ${isFO ? C.foulout : tc}`, borderRadius: 10, padding: "10px 14px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                    <span style={{ fontSize: 20, fontWeight: 900, color: tc }}>#{skater}</span>
                                                    <span style={{ fontSize: 12, color: C.textSecondary }}>{teamName(team)}</span>
                                                    {isFO && <span style={{ fontSize: 10, fontWeight: 800, color: C.foulout, background: `${C.foulout}22`, borderRadius: 4, padding: "2px 6px" }}>FOUL OUT</span>}
                                                </div>
                                                <span style={{ fontSize: 26, fontWeight: 900, color: isFO ? C.foulout : count >= 5 ? C.accent : C.textPrimary }}>{count}</span>
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                                {penalties.map((p, i) => (
                                                    <span key={i} style={{ fontSize: 11, background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 8px", color: C.textSecondary }}>
                            <span style={{ color: C.accent, fontWeight: 700 }}>{p.code}</span> P{p.period}J{p.jam}
                          </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
    const [screen, setScreen]       = useState(SCREEN.SETUP);
    const [gameData, setGameData]   = useState(null);
    const [finalJams, setFinalJams] = useState(null);

    return (
        <div style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif", background: C.bg, minHeight: "100vh" }}>
            {screen === SCREEN.SETUP && <SetupScreen onStart={(data) => { setGameData(data); setScreen(SCREEN.GAME); }} />}
            {screen === SCREEN.GAME && gameData && <GameScreen teams={gameData} onFinish={(jams) => { setFinalJams(jams); setScreen(SCREEN.REVIEW); }} />}
            {screen === SCREEN.REVIEW && finalJams && gameData && <ReviewScreen jams={finalJams} teams={gameData} onReset={() => { setGameData(null); setFinalJams(null); setScreen(SCREEN.SETUP); }} />}
        </div>
    );
}