import { useState, useCallback, useEffect } from "react";

const PENALTY_CODES = [
    { code: "?", label: "Unknown" },
    { code: "A", label: "High Block" },
    { code: "B", label: "Back Block" },
    { code: "C", label: "Illegal Contact" },
    { code: "D", label: "Direction" },
    { code: "E", label: "Leg Block" },
    { code: "F", label: "Forearm" },
    { code: "G", label: "Misconduct" },
    { code: "H", label: "Head Block" },
    { code: "I", label: "Interference" },
    { code: "L", label: "Low Block" },
    { code: "M", label: "Multiplayer" },
    { code: "N", label: "Illegal Procedure" },
    { code: "P", label: "Illegal Position" },
    { code: "X", label: "Cut" },
];

const alphanumSort = (a, b) => a.toString().localeCompare(b.toString());
const SCREEN = { SETUP: "setup", GAME: "game", REVIEW: "review" };

const emptyJam = () => ({
    lead: { teamA: false, teamB: false },
    lost: { teamA: false, teamB: false },
    jamEnd: null,
    starPass: { teamA: false, teamB: false },
    penalties: [],
});

const blendHex = (hex, targetHex, amount) => {
    const parse = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
    const [r1,g1,b1] = parse(hex), [r2,g2,b2] = parse(targetHex);
    return `#${[Math.round(r1+(r2-r1)*amount),Math.round(g1+(g2-g1)*amount),Math.round(b1+(b2-b1)*amount)].map(v=>v.toString(16).padStart(2,"0")).join("")}`;
};
const lostColor = tc => blendHex(tc, "#374151", 0.55);

const C = {
    bg:"#f0f2f5", surface:"#ffffff", surfaceHigh:"#e8eaed", surfaceMid:"#f5f6f8",
    border:"#d1d5db", accent:"#d97706", accentDim:"#fbbf24",
    textPrimary:"#111827", textSecondary:"#6b7280",
    danger:"#dc2626", foulout:"#dc2626",
    warn0:"#ca8a04",  // 4p — dark gold (confirmation needed)
    warn1:"#b45309",  // 5p — deeper amber
    warn2:"#ea580c",  // 6p — orange
};

const btn = (extra={}) => ({
    border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:700,
    letterSpacing:"0.04em", borderRadius:8, transition:"all 0.12s ease", ...extra,
});

// 4=darkgold, 5=amber, 6=orange, 7=red+disabled
const penaltyBorderColor = count => {
    if (count >= 7) return C.foulout;
    if (count === 6) return C.warn2;
    if (count === 5) return C.warn1;
    if (count === 4) return C.warn0;
    return C.border;
};

const isLeadDisabled = (myKey, lead, lost) => {
    const otherKey = myKey==="teamA"?"teamB":"teamA";
    return (lost[myKey] && !lead[myKey]) || lead[otherKey];
};

// Auto jamEnd logic
const computeAutoJamEnd = (jamData) => {
    if (jamData.jamEnd === "injury") return "injury"; // never override injury
    // only Lead WITHOUT Lost can call off
    const canCallOff = ["teamA","teamB"].some(tk => jamData.lead[tk] && !jamData.lost[tk]);
    if (canCallOff) return "lead";
    return "2min";
};

// ════════════════════════════════════════════════════════════════════════════
// SETUP
// ════════════════════════════════════════════════════════════════════════════
function SetupScreen({ onStart }) {
    const [teamAName, setTeamAName] = useState("");
    const [teamBName, setTeamBName] = useState("");
    const [teamAColor, setTeamAColor] = useState("#3b82f6");
    const [teamBColor, setTeamBColor] = useState("#dc2626");
    const [teamARosterRaw, setTeamARosterRaw] = useState("");
    const [teamBRosterRaw, setTeamBRosterRaw] = useState("");

    const parseRoster = raw => raw.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean).sort(alphanumSort);
    const rosterA = parseRoster(teamARosterRaw);
    const rosterB = parseRoster(teamBRosterRaw);
    const canStart = teamAName.trim() && teamBName.trim() && rosterA.length>0 && rosterB.length>0;

    const inp = { background:C.surfaceHigh, border:`1px solid ${C.border}`, borderRadius:8, color:C.textPrimary, fontFamily:"inherit", fontSize:15, padding:"10px 12px", width:"100%", boxSizing:"border-box", outline:"none" };

    return (
        <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", paddingBottom:40 }}>
            <div style={{ width:"100%", background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"16px 32px", marginBottom:32 }}>
                <div style={{ fontSize:11, color:C.accent, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:2 }}>WFTDA</div>
                <div style={{ fontSize:24, fontWeight:900, color:C.textPrimary }}>Penalty Wrangler <span style={{ color:C.textSecondary, fontWeight:400, fontSize:14 }}>· Game Setup</span></div>
            </div>
            <div style={{ width:"100%", maxWidth:920, padding:"0 32px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
                {[
                    { label:"Team A", name:teamAName, setName:setTeamAName, color:teamAColor, setColor:setTeamAColor, raw:teamARosterRaw, setRaw:setTeamARosterRaw, roster:rosterA },
                    { label:"Team B", name:teamBName, setName:setTeamBName, color:teamBColor, setColor:setTeamBColor, raw:teamBRosterRaw, setRaw:setTeamBRosterRaw, roster:rosterB },
                ].map(({ label,name,setName,color,setColor,raw,setRaw,roster }) => (
                    <div key={label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:20, borderTop:`3px solid ${color}` }}>
                        <div style={{ fontSize:12, color, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>{label}</div>
                        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                            <input style={{ ...inp, flex:1 }} placeholder="Team name" value={name} onChange={e=>setName(e.target.value)} />
                            <div style={{ display:"flex", alignItems:"center", gap:6, background:C.surfaceHigh, border:`1px solid ${C.border}`, borderRadius:8, padding:"0 12px" }}>
                                <span style={{ color:C.textSecondary, fontSize:12 }}>Color</span>
                                <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{ width:32, height:32, border:"none", background:"none", cursor:"pointer", padding:0 }} />
                            </div>
                        </div>
                        <textarea style={{ ...inp, height:120, resize:"vertical", fontSize:14 }} placeholder={"Roster numbers, one per line or comma-separated\ne.g. 42, 007, 1312, 69"} value={raw} onChange={e=>setRaw(e.target.value)} />
                        {roster.length>0 && <div style={{ color:C.textSecondary, fontSize:12, marginTop:6 }}>{roster.length} skaters: {roster.slice(0,8).join(", ")}{roster.length>8?" …":""}</div>}
                    </div>
                ))}
            </div>
            <div style={{ width:"100%", maxWidth:920, padding:"20px 32px 0" }}>
                <button style={{ ...btn(), width:"100%", padding:"16px 0", fontSize:16, background:canStart?C.accent:C.surfaceHigh, color:canStart?"#fff":C.textSecondary }}
                        disabled={!canStart}
                        onClick={()=>onStart({ teamA:{name:teamAName.trim(),color:teamAColor,roster:rosterA}, teamB:{name:teamBName.trim(),color:teamBColor,roster:rosterB} })}>
                    START GAME →
                </button>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// CODE GRID — reusable penalty code selector
// ════════════════════════════════════════════════════════════════════════════
function CodeGrid({ currentCode, onSelect, cols=5 }) {
    return (
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:5 }}>
            {PENALTY_CODES.map(({ code, label }) => (
                <button key={code}
                        style={{ ...btn(), background:currentCode===code?C.accent:C.surfaceHigh, color:currentCode===code?"#fff":C.textPrimary, border:`1px solid ${currentCode===code?C.accent:C.border}`, padding:"6px 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}
                        onClick={()=>onSelect(code)}>
                    <span style={{ fontSize:14, fontWeight:900 }}>{code}</span>
                    <span style={{ fontSize:8, color:currentCode===code?"rgba(255,255,255,0.75)":C.textSecondary, lineHeight:1.2, textAlign:"center" }}>{label}</span>
                </button>
            ))}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PENALTY PANEL
// ════════════════════════════════════════════════════════════════════════════
function PenaltyPanel({ teamKey, team, penaltyCount, fouledOut, onLog, onCancel }) {
    const [selectedSkater, setSelectedSkater] = useState(null);
    const color = team.color;
    const tc = penaltyCount[teamKey]||{};

    return (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-end", zIndex:100 }}>
            <div style={{ width:"100%", height:"70%", background:C.surface, borderRadius:"20px 20px 0 0", display:"flex", overflow:"hidden" }}>
                {/* Skater roster */}
                <div style={{ flex:1.3, borderRight:`1px solid ${C.border}`, padding:"18px 16px 24px", overflowY:"auto" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                        <div>
                            <div style={{ fontSize:11, color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.1em" }}>Penalty for</div>
                            <div style={{ fontSize:16, fontWeight:900, color, marginTop:2 }}>{team.name}</div>
                            {selectedSkater && <div style={{ fontSize:20, fontWeight:900, color, marginTop:2 }}>#{selectedSkater}</div>}
                        </div>
                        <button onClick={onCancel} style={{ ...btn(), background:C.surfaceHigh, color:C.textSecondary, padding:"6px 14px", fontSize:13 }}>Cancel</button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:6 }}>
                        {team.roster.map(num => {
                            const count = tc[num]||0;
                            const fo = fouledOut[teamKey]?.[num];
                            const selected = selectedSkater===num;
                            const borderCol = penaltyBorderColor(count);
                            const textCol = count>=1 && count<4 ? C.accentDim : borderCol;
                            return (
                                <button key={num}
                                        style={{ ...btn(), background:selected?color:C.surfaceHigh, border:`2px solid ${selected?color:borderCol}`, color:selected?"#fff":C.textPrimary, padding:"10px 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:2, opacity:fo?0.35:1 }}
                                        onClick={()=>!fo&&setSelectedSkater(selected?null:num)}>
                                    <span style={{ fontSize:15, fontWeight:900 }}>{num}</span>
                                    {count>0 && <span style={{ fontSize:9, fontWeight:700, color:selected?"rgba(0,0,0,0.5)":textCol }}>{fo?"FO":`${count}p`}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
                {/* Code selector */}
                <div style={{ flex:1, padding:"18px 16px 24px", overflowY:"auto", background:C.surfaceMid }}>
                    <div style={{ fontSize:13, fontWeight:800, color:selectedSkater?C.textPrimary:C.textSecondary, marginBottom:14 }}>
                        {selectedSkater?"Select Code":"← Pick skater first"}
                    </div>
                    <div style={{ opacity:selectedSkater?1:0.35, pointerEvents:selectedSkater?"auto":"none" }}>
                        <CodeGrid currentCode={null} onSelect={code=>{ if(selectedSkater) onLog(selectedSkater,teamKey,code); }} cols={2} />
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
        const iv = setInterval(()=>setRemaining(r=>{ if(r<=1){clearInterval(iv);onDismiss();return 0;} return r-1; }),1000);
        return ()=>clearInterval(iv);
    }, [onDismiss]);

    const teamColor = k => k==="teamA"?teams.teamA.color:teams.teamB.color;
    const teamName  = k => k==="teamA"?teams.teamA.name:teams.teamB.name;
    const pct = (remaining/20)*100;

    const jamEndLabel = jamData.jamEnd==="lead"?"Called Off":jamData.jamEnd==="2min"?"2 Minutes":jamData.jamEnd==="injury"?"Injury":null;

    return (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:32 }}>
            <div style={{ width:"100%", maxWidth:700, background:C.surface, borderRadius:20, overflow:"hidden", border:`1px solid ${C.border}`, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
                <div style={{ height:4, background:C.surfaceHigh }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:C.accent, transition:"width 1s linear" }} />
                </div>
                <div style={{ padding:"20px 24px 24px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                        <div>
                            <div style={{ fontSize:11, color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.15em" }}>Jam Report</div>
                            <div style={{ fontSize:30, fontWeight:900, color:C.textPrimary, lineHeight:1 }}>P{period} · <span style={{ color:C.accent }}>J{jam}</span></div>
                        </div>
                        <button onClick={onDismiss} style={{ ...btn(), background:C.surfaceHigh, color:C.textSecondary, padding:"8px 16px", fontSize:13 }}>Dismiss · {remaining}s</button>
                    </div>

                    {/* Lead/Lost/SP — 2 columns by team */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                        {["teamA","teamB"].map(tk => {
                            const tc = teamColor(tk);
                            const lc = lostColor(tc);
                            const hasLead = jamData.lead?.[tk];
                            const hasLost = jamData.lost?.[tk];
                            const hasSP   = jamData.starPass?.[tk];
                            const calledOff = hasLead && jamData.jamEnd==="lead";
                            const align = tk==="teamA" ? "left" : "right";
                            return (
                                <div key={tk} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                                    {hasLead && (
                                        <div style={{ background:`${tc}18`, border:`1px solid ${tc}`, borderRadius:8, padding:"6px 12px", textAlign:align }}>
                                            <div style={{ fontSize:10, color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.1em" }}>
                                                {calledOff ? "Lead · Called Off by" : "Lead"}
                                            </div>
                                            <div style={{ fontSize:14, fontWeight:800, color:tc }}>{teamName(tk)}</div>
                                        </div>
                                    )}
                                    {hasLost && !(hasLead && calledOff) && (
                                        <div style={{ background:`${lc}28`, border:`1px solid ${lc}`, borderRadius:8, padding:"6px 12px", textAlign:align }}>
                                            <div style={{ fontSize:10, color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.1em" }}>Lost Lead</div>
                                            <div style={{ fontSize:14, fontWeight:800, color:lc }}>{teamName(tk)}</div>
                                        </div>
                                    )}
                                    {hasSP && (
                                        <div style={{ background:`${tc}18`, border:`1px solid ${tc}`, borderRadius:8, padding:"6px 12px", textAlign:align }}>
                                            <div style={{ fontSize:10, color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.1em" }}>Star Pass</div>
                                            <div style={{ fontSize:14, fontWeight:800, color:tc }}>{teamName(tk)}</div>
                                        </div>
                                    )}
                                    {!hasLead && !hasLost && !hasSP && (
                                        <div style={{ background:C.surfaceHigh, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", textAlign:align }}>
                                            <div style={{ fontSize:10, color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.1em" }}>{teamName(tk)}</div>
                                            <div style={{ fontSize:13, fontWeight:700, color:C.textSecondary }}>—</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* 2 Min / Injury centered */}
                    {jamEndLabel && jamData.jamEnd!=="lead" && (
                        <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
                            <div style={{ background:C.surfaceHigh, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 24px", textAlign:"center" }}>
                                <div style={{ fontSize:10, color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.1em" }}>End</div>
                                <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary }}>{jamEndLabel}</div>
                            </div>
                        </div>
                    )}

                    {/* Penalties split by team */}
                    {jamData.penalties.length>0 && (
                        <div>
                            <div style={{ fontSize:11, color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>
                                {jamData.penalties.length} {jamData.penalties.length===1?"Penalty":"Penalties"}
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                                {["teamA","teamB"].map(tk => {
                                    const tc = teamColor(tk);
                                    const tPens = jamData.penalties.filter(p=>p.team===tk);
                                    return (
                                        <div key={tk}>
                                            <div style={{ fontSize:10, color:tc, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5 }}>
                                                {teamName(tk)} {tPens.length>0?`· ${tPens.length}`:"· clean"}
                                            </div>
                                            {tPens.length===0
                                                ? <div style={{ fontSize:12, color:C.textSecondary, fontStyle:"italic" }}>No penalties</div>
                                                : <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                                                    {tPens.map((p,i)=>(
                                                        <div key={i} style={{ background:C.surfaceHigh, border:`1px solid ${C.border}`, borderLeft:`4px solid ${tc}`, borderRadius:8, padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                                            <span style={{ fontSize:15, fontWeight:900, color:tc }}>#{p.skater}</span>
                                                            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                                                                <span style={{ fontSize:18, fontWeight:900, color:C.accent }}>{p.code}</span>
                                                                <span style={{ fontSize:10, color:C.textSecondary }}>{PENALTY_CODES.find(x=>x.code===p.code)?.label}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            }
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// JAM HISTORY TAB
// ════════════════════════════════════════════════════════════════════════════
function JamHistory({ jams, teams, onEditPenalty, onEditJamMeta }) {
    const [expanded, setExpanded] = useState(null);
    const [editingPenalty, setEditingPenalty] = useState(null);

    const teamColor = k => k==="teamA"?teams.teamA.color:teams.teamB.color;
    const teamName  = k => k==="teamA"?teams.teamA.name:teams.teamB.name;

    const allJams = [];
    Object.entries(jams).forEach(([p,pj]) =>
        Object.entries(pj).sort(([a],[b])=>parseInt(a)-parseInt(b)).forEach(([j,jd]) => {
            const hasData = jd.penalties.length>0||["teamA","teamB"].some(tk=>jd.lead?.[tk]||jd.lost?.[tk])||jd.jamEnd||["teamA","teamB"].some(tk=>jd.starPass?.[tk]);
            if (hasData) allJams.push({ period:parseInt(p), jam:parseInt(j), data:jd });
        })
    );
    allJams.reverse();

    return (
        <div style={{ flex:1, overflowY:"auto", padding:"12px 10px" }}>
            {allJams.length===0 && <div style={{ textAlign:"center", color:C.textSecondary, fontSize:13, paddingTop:32 }}>No jams recorded yet</div>}
            {allJams.map(({ period, jam, data }) => {
                const key = `${period}-${jam}`;
                const isOpen = expanded===key;
                const leadTeam = ["teamA","teamB"].find(tk=>data.lead?.[tk]);
                const lostTeams = ["teamA","teamB"].filter(tk=>data.lost?.[tk]);
                const jamEndLabel = data.jamEnd==="lead"?"Called Off":data.jamEnd==="2min"?"2 Min":data.jamEnd==="injury"?"Injury":null;

                return (
                    <div key={key} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:6, overflow:"hidden" }}>
                        {/* One-liner */}
                        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer" }} onClick={()=>setExpanded(isOpen?null:key)}>
                            <div style={{ minWidth:60 }}>
                                <span style={{ fontSize:12, fontWeight:800, color:C.textSecondary }}>P{period}·</span>
                                <span style={{ fontSize:14, fontWeight:900, color:C.accent }}>J{jam}</span>
                            </div>
                            <div style={{ display:"flex", gap:5, flex:1, flexWrap:"wrap" }}>
                                {leadTeam && (
                                    <span style={{ fontSize:11, fontWeight:700, color:teamColor(leadTeam), background:`${teamColor(leadTeam)}18`, border:`1px solid ${teamColor(leadTeam)}`, borderRadius:4, padding:"2px 7px" }}>
                    {data.jamEnd==="lead"?"✓ Called Off":"Lead"}: {teamName(leadTeam)}
                  </span>
                                )}
                                {lostTeams.map(tk=>(
                                    <span key={tk} style={{ fontSize:11, fontWeight:700, color:lostColor(teamColor(tk)), background:`${lostColor(teamColor(tk))}18`, border:`1px solid ${lostColor(teamColor(tk))}`, borderRadius:4, padding:"2px 7px" }}>
                    Lost: {teamName(tk)}
                  </span>
                                ))}
                                {jamEndLabel && jamEndLabel!=="Called Off" && (
                                    <span style={{ fontSize:11, color:C.textSecondary, border:`1px solid ${C.border}`, borderRadius:4, padding:"2px 7px" }}>{jamEndLabel}</span>
                                )}
                                {data.penalties.length>0 && (
                                    <span style={{ fontSize:11, color:C.textSecondary, border:`1px solid ${C.border}`, borderRadius:4, padding:"2px 7px" }}>{data.penalties.length}p</span>
                                )}
                            </div>
                            <span style={{ color:C.textSecondary, fontSize:14 }}>{isOpen?"▲":"▼"}</span>
                        </div>

                        {/* Expanded */}
                        {isOpen && (
                            <div style={{ borderTop:`1px solid ${C.border}`, padding:"12px 14px", background:C.surfaceMid, display:"flex", flexDirection:"column", gap:10 }}>

                                {/* Meta editor: 3 columns — Team A | Center | Team B */}
                                <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"start" }}>
                                    {/* Team A toggles */}
                                    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                                        <div style={{ fontSize:10, color:teamColor("teamA"), fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2, textAlign:"left" }}>{teamName("teamA")}</div>
                                        {[["lead","Lead"],["lost","Lost"],["starPass","★ SP"]].map(([field,label])=>{
                                            const active = data[field]?.teamA||false;
                                            const tc = teamColor("teamA");
                                            const col = field==="lost"?lostColor(tc):tc;
                                            return (
                                                <button key={field}
                                                        style={{ ...btn(), padding:"6px 10px", fontSize:12, background:active?col:C.surface, color:active?"#fff":C.textSecondary, border:`1px solid ${active?col:C.border}`, textAlign:"left" }}
                                                        onClick={()=>onEditJamMeta(period,jam,field,"teamA",!active)}>
                                                    {active?`✓ ${label}`:label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Center: Called Off / 2 Min / Injury */}
                                    <div style={{ display:"flex", flexDirection:"column", gap:5, minWidth:100 }}>
                                        <div style={{ fontSize:10, color:C.textSecondary, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2, textAlign:"center" }}>End</div>
                                        {[["lead","Called Off"],["2min","2 Min"],["injury","Injury"]].map(([value,label])=>{
                                            const active = data.jamEnd===value;
                                            return (
                                                <button key={value}
                                                        style={{ ...btn(), padding:"6px 10px", fontSize:12, background:active?C.accent:C.surface, color:active?"#fff":C.textSecondary, border:`1px solid ${active?C.accent:C.border}`, textAlign:"center" }}
                                                        onClick={()=>onEditJamMeta(period,jam,"jamEnd",null,active?null:value)}>
                                                    {active?`✓ ${label}`:label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Team B toggles */}
                                    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                                        <div style={{ fontSize:10, color:teamColor("teamB"), fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2, textAlign:"right" }}>{teamName("teamB")}</div>
                                        {[["lead","Lead"],["lost","Lost"],["starPass","★ SP"]].map(([field,label])=>{
                                            const active = data[field]?.teamB||false;
                                            const tc = teamColor("teamB");
                                            const col = field==="lost"?lostColor(tc):tc;
                                            return (
                                                <button key={field}
                                                        style={{ ...btn(), padding:"6px 10px", fontSize:12, background:active?col:C.surface, color:active?"#fff":C.textSecondary, border:`1px solid ${active?col:C.border}`, textAlign:"right" }}
                                                        onClick={()=>onEditJamMeta(period,jam,field,"teamB",!active)}>
                                                    {active?`✓ ${label}`:label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Penalties */}
                                {data.penalties.length===0
                                    ? <div style={{ fontSize:12, color:C.textSecondary, fontStyle:"italic" }}>No penalties this jam</div>
                                    : <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                        {data.penalties.map((p,i) => {
                                            const tc = teamColor(p.team);
                                            const editKey = `${key}-${i}`;
                                            const isEditing = editingPenalty===editKey;
                                            return (
                                                <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderLeft:`4px solid ${tc}`, borderRadius:8, padding:"8px 12px" }}>
                                                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                                                            <span style={{ fontSize:15, fontWeight:900, color:tc }}>#{p.skater}</span>
                                                            <span style={{ fontSize:11, color:C.textSecondary }}>{teamName(p.team)}</span>
                                                        </div>
                                                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                                                            <span style={{ fontSize:18, fontWeight:900, color:C.accent }}>{p.code}</span>
                                                            <span style={{ fontSize:10, color:C.textSecondary }}>{PENALTY_CODES.find(x=>x.code===p.code)?.label}</span>
                                                            <button onClick={()=>setEditingPenalty(isEditing?null:editKey)}
                                                                    style={{ ...btn(), background:isEditing?C.accent:C.surfaceHigh, color:isEditing?"#fff":C.textSecondary, fontSize:11, padding:"4px 10px", border:`1px solid ${C.border}` }}>
                                                                {isEditing?"Cancel":"Edit"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {isEditing && (
                                                        <div style={{ marginTop:10 }}>
                                                            <CodeGrid currentCode={p.code} onSelect={code=>{ onEditPenalty(period,jam,i,code); setEditingPenalty(null); }} cols={5} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                }
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// TEAM PANEL
// ════════════════════════════════════════════════════════════════════════════
function TeamPanel({ teamKey, team, currentJam, penaltyCount, updateJam, onLogPenalty, onColorChange }) {
    const [editingPenalty, setEditingPenalty] = useState(null);
    const color = team.color;
    const lost = lostColor(color);
    const hasLead = currentJam.lead?.[teamKey]||false;
    const hasLost = currentJam.lost?.[teamKey]||false;
    const leadDisabled = isLeadDisabled(teamKey, currentJam.lead||{}, currentJam.lost||{});
    const isStarPass = currentJam.starPass?.[teamKey]||false;
    const teamPenalties = currentJam.penalties.filter(p=>p.team===teamKey);
    const totalCount = Object.values(penaltyCount[teamKey]||{}).reduce((a,b)=>a+b,0);

    const handleEditPenalty = (idx, newCode) => {
        updateJam(j => {
            const penalties = [...j.penalties];
            // find the idx-th penalty for this team
            let count = 0;
            for (let i=0; i<penalties.length; i++) {
                if (penalties[i].team===teamKey) {
                    if (count===idx) { penalties[i]={...penalties[i],code:newCode}; break; }
                    count++;
                }
            }
            return { ...j, penalties };
        });
        setEditingPenalty(null);
    };

    return (
        <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"8px 10px", gap:6 }}>
            {/* Header */}
            <div style={{ borderTop:`3px solid ${color}`, background:C.surface, borderRadius:10, padding:"10px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ fontSize:13, fontWeight:900, color }}>{team.name}</div>
                        <label style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:4, background:C.surfaceHigh, border:`1px solid ${C.border}`, borderRadius:6, padding:"3px 8px" }}>
                            <div style={{ width:12, height:12, borderRadius:3, background:color, border:`1px solid ${C.border}` }} />
                            <span style={{ fontSize:10, color:C.textSecondary }}>color</span>
                            <input type="color" value={color} onChange={e=>onColorChange(teamKey,e.target.value)} style={{ width:0, height:0, opacity:0, position:"absolute" }} />
                        </label>
                    </div>
                    <div style={{ fontSize:11, color:C.textSecondary }}>{totalCount} penalties total</div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                    <button style={{ ...btn(), flex:1, padding:"7px 8px", fontSize:12, background:hasLead?color:C.surfaceHigh, color:hasLead?"#fff":leadDisabled?C.border:C.textSecondary, border:`2px solid ${hasLead?color:C.border}`, opacity:leadDisabled&&!hasLead?0.4:1, cursor:leadDisabled?"not-allowed":"pointer" }} onClick={()=>!leadDisabled&&updateJam(j=>({...j,lead:{...j.lead,[teamKey]:!hasLead}}))}>
                        {hasLead?"✓ Lead":"Lead"}
                    </button>
                    <button style={{ ...btn(), flex:1, padding:"7px 8px", fontSize:12, background:hasLost?lost:C.surfaceHigh, color:hasLost?"#fff":C.textSecondary, border:`2px solid ${hasLost?lost:C.border}` }} onClick={()=>updateJam(j=>({...j,lost:{...j.lost,[teamKey]:!hasLost}}))}>
                        {hasLost?"✓ Lost":"Lost"}
                    </button>
                    <button style={{ ...btn(), flex:1, padding:"7px 8px", fontSize:12, background:isStarPass?color:C.surfaceHigh, color:isStarPass?"#fff":C.textSecondary, border:`2px solid ${isStarPass?color:C.border}` }} onClick={()=>updateJam(j=>({...j,starPass:{...j.starPass,[teamKey]:!isStarPass}}))}>
                        {isStarPass?"★ SP ✓":"★ SP"}
                    </button>
                </div>
            </div>

            <button style={{ ...btn(), padding:"12px 0", fontSize:15, background:color, color:"#fff", letterSpacing:"0.05em", flexShrink:0 }} onClick={onLogPenalty}>
                + LOG PENALTY
            </button>

            <div style={{ flex:1, overflowY:"auto", background:C.surface, borderRadius:10, padding:"10px 12px" }}>
                <div style={{ fontSize:10, color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>
                    This Jam — {teamPenalties.length} {teamPenalties.length===1?"penalty":"penalties"}
                </div>
                {teamPenalties.length===0
                    ? <div style={{ fontSize:12, color:C.textSecondary, fontStyle:"italic", textAlign:"center", paddingTop:12 }}>No penalties this jam</div>
                    : <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        {teamPenalties.map((p,i) => {
                            const isEditing = editingPenalty===i;
                            return (
                                <div key={i} style={{ background:C.surfaceHigh, border:`1px solid ${C.border}`, borderLeft:`3px solid ${color}`, borderRadius:6, padding:"6px 10px" }}>
                                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                        <span style={{ fontSize:16, fontWeight:900, color }}>#{p.skater}</span>
                                        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                                            <span style={{ fontSize:17, fontWeight:900, color:C.accent }}>{p.code}</span>
                                            <span style={{ fontSize:10, color:C.textSecondary }}>{PENALTY_CODES.find(x=>x.code===p.code)?.label}</span>
                                            <button onClick={()=>setEditingPenalty(isEditing?null:i)}
                                                    style={{ ...btn(), background:isEditing?C.accent:C.surfaceHigh, color:isEditing?"#fff":C.textSecondary, fontSize:10, padding:"3px 8px", border:`1px solid ${C.border}` }}>
                                                {isEditing?"✕":"Edit"}
                                            </button>
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <div style={{ marginTop:8 }}>
                                            <CodeGrid currentCode={p.code} onSelect={code=>handleEditPenalty(i,code)} cols={5} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                }
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// GAME SCREEN
// ════════════════════════════════════════════════════════════════════════════
function GameScreen({ teams: initialTeams, onFinish }) {
    const [teams, setTeams] = useState(initialTeams);
    const [period, setPeriod] = useState(1);
    const [jam, setJam] = useState(1);
    const [jams, setJams] = useState({ 1:{ 1:emptyJam() } });
    const [penaltyPanel, setPenaltyPanel] = useState(null);
    const [jamReport, setJamReport] = useState(null);
    const [activeTab, setActiveTab] = useState("wrangling");

    const currentJam = jams[period]?.[jam]||emptyJam();

    const updateJam = updater => setJams(prev => {
        const pd=prev[period]||{}, jd=pd[jam]||emptyJam();
        return { ...prev, [period]:{ ...pd, [jam]:updater(jd) } };
    });

    const handleColorChange = (teamKey, newColor) => setTeams(prev=>({...prev,[teamKey]:{...prev[teamKey],color:newColor}}));

    const penaltyCount = useCallback(()=>{
        const counts={teamA:{},teamB:{}};
        Object.values(jams).forEach(pj=>Object.values(pj).forEach(j=>j.penalties.forEach(({skater,team})=>{counts[team][skater]=(counts[team][skater]||0)+1;})));
        return counts;
    },[jams])();

    const fouledOut = {
        teamA: Object.fromEntries(Object.entries(penaltyCount.teamA).filter(([,v])=>v>=7)),
        teamB: Object.fromEntries(Object.entries(penaltyCount.teamB).filter(([,v])=>v>=7)),
    };

    const handleLog = (skaterNum, teamKey, code) => {
        updateJam(j=>({...j,penalties:[...j.penalties,{skater:skaterNum,team:teamKey,code}]}));
        setPenaltyPanel(null);
    };

    const handleEditPenalty = (p, j, idx, newCode) => {
        setJams(prev=>{
            const pd={...prev[p]}, jd={...pd[j]}, penalties=[...jd.penalties];
            penalties[idx]={...penalties[idx],code:newCode};
            return {...prev,[p]:{...pd,[j]:{...jd,penalties}}};
        });
    };

    const handleEditJamMeta = (p, j, field, teamKey, value) => {
        setJams(prev=>{
            const pd={...prev[p]}, jd={...pd[j]};
            if (field==="jamEnd") return {...prev,[p]:{...pd,[j]:{...jd,jamEnd:value}}};
            const fieldObj={...jd[field]};
            fieldObj[teamKey]=value;
            return {...prev,[p]:{...pd,[j]:{...jd,[field]:fieldObj}}};
        });
    };

    const doNextJam = () => {
        const snapshot = jams[period]?.[jam]||emptyJam();
        const finalJamData = snapshot.jamEnd ? snapshot : { ...snapshot, jamEnd: computeAutoJamEnd(snapshot) };
        const nextJ = jam+1;
        setJams(prev=>{
            const pd=prev[period]||{};
            return {...prev,[period]:{...pd,[jam]:finalJamData,[nextJ]:pd[nextJ]||emptyJam()}};
        });
        setJam(nextJ);
        setJamReport({ period, jam, jamData:finalJamData });
    };

    const nextPeriod = () => {
        if (period===2) { onFinish(jams,teams); return; }
        setPeriod(2); setJam(1);
        setJams(prev=>({...prev,2:{1:emptyJam()}}));
    };

    const undoLastPenalty = () => updateJam(j=>({...j,penalties:j.penalties.slice(0,-1)}));

    return (
        <div style={{ height:"100dvh", background:C.bg, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {/* Top bar */}
            <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"5px 10px", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                <div style={{ display:"flex", gap:6, alignItems:"baseline" }}>
                    <span style={{ fontSize:11, color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.1em" }}>P</span>
                    <span style={{ fontSize:20, fontWeight:900, color:C.textPrimary, lineHeight:1 }}>{period}</span>
                    <span style={{ color:C.border, fontSize:14, margin:"0 2px" }}>·</span>
                    <span style={{ fontSize:11, color:C.textSecondary, textTransform:"uppercase", letterSpacing:"0.1em" }}>J</span>
                    <span style={{ fontSize:20, fontWeight:900, color:C.accent, lineHeight:1 }}>{jam}</span>
                </div>
                <div style={{ display:"flex", gap:4 }}>
                    {[["lead","Called Off"],["2min","2 Min"],["injury","Injury"]].map(([value,label])=>{
                        const active=currentJam.jamEnd===value;
                        return (
                            <button key={value} style={{ ...btn(), padding:"5px 9px", fontSize:11, background:active?C.accent:C.surfaceHigh, color:active?"#fff":C.textSecondary, border:`2px solid ${active?C.accent:C.border}` }}
                                    onClick={()=>updateJam(j=>({...j,jamEnd:active?null:value}))}>
                                {label}
                            </button>
                        );
                    })}
                </div>
                <div style={{ flex:1 }} />
                <div style={{ display:"flex", background:C.surfaceHigh, borderRadius:8, padding:2, gap:2 }}>
                    {[["wrangling","🤼 Wrangle"],["history","📋 Jams"]].map(([id,label])=>(
                        <button key={id} style={{ ...btn(), padding:"4px 10px", fontSize:11, background:activeTab===id?C.surface:"transparent", color:activeTab===id?C.textPrimary:C.textSecondary, boxShadow:activeTab===id?"0 1px 3px rgba(0,0,0,0.1)":undefined }} onClick={()=>setActiveTab(id)}>
                            {label}
                        </button>
                    ))}
                </div>
                <div style={{ display:"flex", gap:6 }}>
                    {currentJam.penalties.length>0 && (
                        <button style={{ ...btn(), background:"none", color:C.danger, fontSize:11, padding:"5px 9px", border:`1px solid ${C.danger}` }} onClick={undoLastPenalty}>↩ Undo</button>
                    )}
                    <button style={{ ...btn(), background:C.surfaceHigh, color:C.textSecondary, border:`1px solid ${C.border}`, padding:"5px 10px", fontSize:11 }} onClick={doNextJam}>Next Jam →</button>
                    <button style={{ ...btn(), background:period===2?C.danger:C.surfaceHigh, color:period===2?"#fff":C.textSecondary, border:`1px solid ${C.border}`, padding:"5px 10px", fontSize:11 }} onClick={nextPeriod}>
                        {period===2?"End Game":"Period 2 →"}
                    </button>
                </div>
            </div>

            {activeTab==="wrangling" && (
                <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", overflow:"hidden" }}>
                    <div style={{ borderRight:`1px solid ${C.border}`, overflow:"hidden" }}>
                        <TeamPanel teamKey="teamA" team={teams.teamA} currentJam={currentJam} penaltyCount={penaltyCount} updateJam={updateJam} onLogPenalty={()=>setPenaltyPanel("teamA")} onColorChange={handleColorChange} />
                    </div>
                    <div style={{ overflow:"hidden" }}>
                        <TeamPanel teamKey="teamB" team={teams.teamB} currentJam={currentJam} penaltyCount={penaltyCount} updateJam={updateJam} onLogPenalty={()=>setPenaltyPanel("teamB")} onColorChange={handleColorChange} />
                    </div>
                </div>
            )}
            {activeTab==="history" && (
                <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                    <JamHistory jams={jams} teams={teams} onEditPenalty={handleEditPenalty} onEditJamMeta={handleEditJamMeta} />
                </div>
            )}

            {penaltyPanel && (
                <PenaltyPanel teamKey={penaltyPanel} team={teams[penaltyPanel]} penaltyCount={penaltyCount} fouledOut={fouledOut} onLog={handleLog} onCancel={()=>setPenaltyPanel(null)} />
            )}
            {jamReport && (
                <JamReport period={jamReport.period} jam={jamReport.jam} jamData={jamReport.jamData} teams={teams} onDismiss={()=>setJamReport(null)} />
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// REVIEW SCREEN
// ════════════════════════════════════════════════════════════════════════════
function ReviewScreen({ jams, teams, onReset }) {
    const [activeTab, setActiveTab] = useState("jams");

    const teamColor = k => k==="teamA"?teams.teamA.color:teams.teamB.color;
    const teamName  = k => k==="teamA"?teams.teamA.name:teams.teamB.name;

    const allPenalties = [];
    Object.entries(jams).forEach(([p,pj])=>Object.entries(pj).forEach(([j,jd])=>jd.penalties.forEach(pen=>allPenalties.push({period:parseInt(p),jam:parseInt(j),...pen}))));

    const skaterSummary = { teamA:{}, teamB:{} };
    allPenalties.forEach(({ skater, team, code, period, jam }) => {
        if (!skaterSummary[team][skater]) skaterSummary[team][skater]={ skater, team, penalties:[] };
        skaterSummary[team][skater].penalties.push({ code, period, jam });
    });

    const jamEndLabel = v => v==="lead"?"Called Off":v==="2min"?"2 Min":v==="injury"?"Injury":"—";

    return (
        <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
            <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"12px 24px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div>
                        <div style={{ fontSize:11, color:C.accent, fontWeight:800, letterSpacing:"0.15em", textTransform:"uppercase" }}>Post-Game</div>
                        <div style={{ fontSize:22, fontWeight:900, color:C.textPrimary }}>Review</div>
                    </div>
                    <button onClick={onReset} style={{ ...btn(), background:C.surfaceHigh, color:C.textSecondary, border:`1px solid ${C.border}`, padding:"8px 16px", fontSize:13 }}>New Game</button>
                </div>
                <div style={{ display:"flex", gap:16 }}>
                    {["teamA","teamB"].map(tk=>(
                        <div key={tk} style={{ background:C.surfaceHigh, border:`1px solid ${C.border}`, borderLeft:`4px solid ${teamColor(tk)}`, borderRadius:8, padding:"8px 16px", display:"flex", gap:16, alignItems:"center" }}>
                            <div style={{ fontSize:13, color:teamColor(tk), fontWeight:700 }}>{teams[tk].name}</div>
                            <div style={{ fontSize:24, fontWeight:900, color:C.textPrimary }}>{allPenalties.filter(p=>p.team===tk).length}</div>
                            <div style={{ fontSize:12, color:C.textSecondary }}>penalties</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display:"flex", borderBottom:`1px solid ${C.border}` }}>
                {["jams","skaters"].map(id=>(
                    <button key={id} style={{ ...btn(), flex:1, padding:"12px 0", background:activeTab===id?C.accent:C.surfaceHigh, color:activeTab===id?"#fff":C.textSecondary, fontSize:14, borderRadius:0 }} onClick={()=>setActiveTab(id)}>
                        {id==="jams"?"By Jam":"By Skater"}
                    </button>
                ))}
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>
                {activeTab==="jams" && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        {Object.entries(jams).flatMap(([p,pj])=>
                            Object.entries(pj).sort(([a],[b])=>parseInt(a)-parseInt(b)).map(([j,jd])=>{
                                const hasData=jd.penalties.length>0||["teamA","teamB"].some(tk=>jd.lead?.[tk]||jd.lost?.[tk])||jd.jamEnd||["teamA","teamB"].some(tk=>jd.starPass?.[tk]);
                                if (!hasData) return null;
                                return (
                                    <div key={`${p}-${j}`} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px" }}>
                                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                                            <span style={{ fontSize:13, fontWeight:800, color:C.textSecondary }}>P{p} · <span style={{ color:C.accent }}>J{j}</span></span>
                                            <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"flex-end" }}>
                                                {["teamA","teamB"].filter(tk=>jd.lead?.[tk]).map(tk=>(
                                                    <span key={tk} style={{ fontSize:10, color:teamColor(tk), border:`1px solid ${teamColor(tk)}`, borderRadius:4, padding:"2px 6px" }}>
                            {jd.jamEnd==="lead"?"✓ Called Off":"Lead"}: {teamName(tk)}
                          </span>
                                                ))}
                                                {["teamA","teamB"].filter(tk=>jd.lost?.[tk]).map(tk=>(
                                                    <span key={`lost-${tk}`} style={{ fontSize:10, color:lostColor(teamColor(tk)), border:`1px solid ${lostColor(teamColor(tk))}`, borderRadius:4, padding:"2px 6px" }}>
                            Lost: {teamName(tk)}
                          </span>
                                                ))}
                                                {jd.jamEnd && <span style={{ fontSize:10, color:C.textSecondary, border:`1px solid ${C.border}`, borderRadius:4, padding:"2px 6px" }}>{jamEndLabel(jd.jamEnd)}</span>}
                                            </div>
                                        </div>
                                        {jd.penalties.length>0 && (
                                            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                                                {jd.penalties.map((pen,i)=>{
                                                    const tc=teamColor(pen.team);
                                                    return (
                                                        <div key={i} style={{ background:C.surfaceHigh, borderLeft:`3px solid ${tc}`, borderRadius:5, padding:"3px 8px", display:"flex", gap:5, alignItems:"center" }}>
                                                            <span style={{ fontSize:12, fontWeight:700, color:tc }}>#{pen.skater}</span>
                                                            <span style={{ fontSize:13, fontWeight:900, color:C.accent }}>{pen.code}</span>
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

                {activeTab==="skaters" && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>
                        {["teamA","teamB"].map(tk=>{
                            const tc = teamColor(tk);
                            const skaters = Object.values(skaterSummary[tk]).sort((a,b)=>alphanumSort(a.skater,b.skater));
                            return (
                                <div key={tk}>
                                    <div style={{ fontSize:12, color:tc, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, paddingBottom:6, borderBottom:`2px solid ${tc}` }}>
                                        {teamName(tk)} · {allPenalties.filter(p=>p.team===tk).length}p
                                    </div>
                                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                        {skaters.length===0 && <div style={{ fontSize:12, color:C.textSecondary, fontStyle:"italic" }}>No penalties</div>}
                                        {skaters.map(({ skater, penalties }) => {
                                            const count = penalties.length;
                                            const isFO = count>=7;
                                            const borderCol = penaltyBorderColor(count);
                                            return (
                                                <div key={skater} style={{ background:C.surface, border:`1px solid ${borderCol}`, borderLeft:`4px solid ${borderCol}`, borderRadius:10, padding:"10px 14px" }}>
                                                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                                                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                                                            <span style={{ fontSize:20, fontWeight:900, color:tc }}>#{skater}</span>
                                                            {isFO && <span style={{ fontSize:10, fontWeight:800, color:C.foulout, background:`${C.foulout}18`, borderRadius:4, padding:"2px 6px" }}>FOUL OUT</span>}
                                                        </div>
                                                        <span style={{ fontSize:26, fontWeight:900, color:count>=4?borderCol:C.textPrimary }}>{count}</span>
                                                    </div>
                                                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                                                        {penalties.map((p,i)=>(
                                                            <span key={i} style={{ fontSize:11, background:C.surfaceHigh, border:`1px solid ${C.border}`, borderRadius:4, padding:"2px 8px", color:C.textSecondary }}>
                                <span style={{ color:C.accent, fontWeight:700 }}>{p.code}</span> P{p.period}J{p.jam}
                              </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
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
    const [screen, setScreen] = useState(SCREEN.SETUP);
    const [gameData, setGameData] = useState(null);
    const [finalJams, setFinalJams] = useState(null);
    const [finalTeams, setFinalTeams] = useState(null);

    return (
        <div style={{ fontFamily:"'SF Pro Display','Helvetica Neue',system-ui,sans-serif", background:C.bg, minHeight:"100vh" }}>
            {screen===SCREEN.SETUP && <SetupScreen onStart={data=>{ setGameData(data); setScreen(SCREEN.GAME); }} />}
            {screen===SCREEN.GAME && gameData && (
                <GameScreen teams={gameData} onFinish={(jams,teams)=>{ setFinalJams(jams); setFinalTeams(teams); setScreen(SCREEN.REVIEW); }} />
            )}
            {screen===SCREEN.REVIEW && finalJams && (
                <ReviewScreen jams={finalJams} teams={finalTeams||gameData} onReset={()=>{ setGameData(null); setFinalJams(null); setFinalTeams(null); setScreen(SCREEN.SETUP); }} />
            )}
        </div>
    );
}