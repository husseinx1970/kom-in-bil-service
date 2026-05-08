import { useState, useEffect, useCallback, useRef } from “react”;

/* ─────────────────────────────────────────────────────────
DESIGN TOKENS
───────────────────────────────────────────────────────── */
const C = {
bg: “#0A0A0B”,
surface: “#0F1115”,
card: “#15171C”,
cardHover: “#191C22”,
border: “rgba(255,255,255,0.07)”,
borderSubtle: “rgba(255,255,255,0.04)”,
borderActive: “rgba(214,178,94,0.4)”,
accent: “#D6B25E”,
accentDim: “rgba(214,178,94,0.08)”,
accentGlow: “rgba(214,178,94,0.15)”,
primary: “#FFFFFF”,
secondary: “#A0A8B5”,
tertiary: “#5A6270”,
muted: “#3A3F4A”,
error: “#C0453A”,
errorDim: “rgba(192,69,58,0.1)”,
success: “#3E8B5F”,
};

/* ─────────────────────────────────────────────────────────
CONFIG
───────────────────────────────────────────────────────── */
const WS = {
name: “Hussein’s Bilservice”,
tagline: “Auktoriserad verkstad — Stockholm”,
phone: “0790-574 975”,
phonePlain: “0790574975”,
email: “husseinmormor@gmail.com”,
address: “Stockholm”,
hours: “Måndag – Fredag · 08:00 – 17:00”,
};

const SLOTS = [“08:00”,“09:30”,“11:00”,“12:30”,“14:00”,“15:30”];
const MAX = 5;
const ADMIN_PW = “admin2024”;
const TAGS = [“Konstigt ljud”,“Motorproblem”,“Vibration”,“Startar ej”,“Motorlampa”,“Oljebyte”,“Bromsservice”,“Däckbyte”];
const MOTOR_KW = [“motor”,“motorfel”,“motorljud”,“växellåda”,“turbo”,“bränsle”,“transmission”,“läcker”];

const STEPS = [
{ n:1, key:“contact”, label:“Kontakt” },
{ n:2, key:“service”, label:“Tjänst” },
{ n:3, key:“describe”, label:“Ärende” },
{ n:4, key:“image”, label:“Bild” },
{ n:5, key:“confirm”, label:“Bekräfta” },
];

/* ─────────────────────────────────────────────────────────
STORAGE
───────────────────────────────────────────────────────── */
function getAll() { try { return JSON.parse(localStorage.getItem(“hb3”)||”[]”); } catch { return []; } }
function saveAll(a) { localStorage.setItem(“hb3”, JSON.stringify(a)); }
function storaOnDate(d){ return getAll().filter(b=>b.date===d&&b.jobType===“stora”).length; }
function slotsOnDate(d){ return getAll().filter(b=>b.date===d).map(b=>b.time); }

/* ─────────────────────────────────────────────────────────
HELPERS
───────────────────────────────────────────────────────── */
function isWeekend(d) { if(!d) return false; const w=new Date(d+“T12:00:00”).getDay(); return w===0||w===6; }
function isPast(d) { if(!d) return false; const t=new Date(); t.setHours(0,0,0,0); return new Date(d+“T00:00:00”)<t; }
function todayStr() { return new Date().toISOString().split(“T”)[0]; }
function fmtLong(d) { if(!d) return “–”; return new Date(d+“T12:00:00”).toLocaleDateString(“sv-SE”,{weekday:“long”,year:“numeric”,month:“long”,day:“numeric”}); }
function fmtShort(d) { if(!d) return “–”; return new Date(d+“T12:00:00”).toLocaleDateString(“sv-SE”,{day:“numeric”,month:“short”,year:“numeric”}); }
function cap(s) { return s ? s.charAt(0).toUpperCase()+s.slice(1) : “”; }

function notifyWorkshop(b) {
const sub = encodeURIComponent(`Ny bokning — ${b.name} — ${fmtShort(b.date)}`);
const body = encodeURIComponent(
`NY BOKNING VIA HEMSIDAN
━━━━━━━━━━━━━━━━━━━━━━━

Kund: ${b.name}
Telefon: ${b.phone}
E-post: ${b.email}

Tjänst: ${b.jobType===“enkla”?“Snabbservice (drop-in)”:“Större jobb — tidsbokning”}
Datum: ${b.jobType===“enkla”?“Drop-in”:fmtLong(b.date)}
Tid: ${b.time}

Beskrivning:
${b.description||”(ingen beskrivning angiven)”}

Bokning-ID: ${b.id}
`); window.open(`mailto:${WS.email}?subject=${sub}&body=${body}`,”_blank”);
}

/* ═════════════════════════════════════════════════════════
ADMIN PANEL
═════════════════════════════════════════════════════════ */
function AdminPanel({ onBack }) {
const [auth,setAuth] = useState(false);
const [pw,setPw] = useState(””);
const [pwErr,setPwErr] = useState(false);
const [data,setData] = useState([]);
const [filter,setFilter] = useState(“all”);
const [search,setSearch] = useState(””);

useEffect(() => { if(auth) setData(getAll()); }, [auth]);

function upd(id,status) {
const u = getAll().map(b => b.id===id ? {…b,status} : b);
saveAll(u); setData(u);
}
function del(id) {
if(!confirm(“Ta bort denna bokning?”)) return;
const u = getAll().filter(b=>b.id!==id);
saveAll(u); setData(u);
}

const sc = { Ny:C.accent, Pågående:”#5B9CF6”, Klar:C.success };

const filtered = data
.filter(b => filter===“all” || b.status===filter)
.filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.phone.includes(search))
.sort((a,b) => a.date>b.date ? 1 : -1);

const counts = {
all: data.length,
Ny: data.filter(b=>b.status===“Ny”).length,
Pågående: data.filter(b=>b.status===“Pågående”).length,
Klar: data.filter(b=>b.status===“Klar”).length,
};

if(!auth) return (
<div style={{ minHeight:“100vh”, background:C.bg, display:“flex”, alignItems:“center”,
justifyContent:“center”, fontFamily:”‘Syne’,‘DM Sans’,sans-serif”, padding:20 }}>
<Fonts/>
<div style={{ width:“100%”, maxWidth:360 }}>
<button onClick={onBack} style={Btn.ghost}>← Tillbaka</button>
<div style={{ height:40 }}/>
<p style={Tx.label}>Adminpanel</p>
<h2 style={{ …Tx.h1, fontSize:32, marginBottom:32, marginTop:8 }}>{WS.name}</h2>
<div>
<label style={{ …Tx.label, display:“block”, marginBottom:8 }}>Lösenord</label>
<input type=“password” value={pw} autoFocus
placeholder=”••••••••”
onChange={e=>{setPw(e.target.value);setPwErr(false);}}
onKeyDown={e=>{ if(e.key===“Enter”){if(pw===ADMIN_PW)setAuth(true);else setPwErr(true); }}}
style={{ …Inp.base, …(pwErr?{borderColor:C.error}:{}) }}
/>
{pwErr && <p style={{ color:C.error, fontSize:12, marginTop:8, fontWeight:500 }}>Fel lösenord. Försök igen.</p>}
<button style={{ …Btn.gold, width:“100%”, marginTop:14 }}
onClick={()=>{if(pw===ADMIN_PW)setAuth(true);else setPwErr(true);}}>
Logga in
</button>
</div>
</div>
</div>
);

return (
<div style={{ minHeight:“100vh”, background:C.bg, fontFamily:”‘Syne’,‘DM Sans’,sans-serif”, color:C.primary }}>
<Fonts/>

```
{/* Header */}
<div style={{ borderBottom:`1px solid ${C.border}`, height:58, display:"flex", alignItems:"center",
padding:"0 32px", gap:20, position:"sticky", top:0, background:C.bg, zIndex:40 }}>
<button onClick={onBack} style={{ ...Btn.ghost, fontSize:12, padding:"6px 12px" }}>← Bokning</button>
<div style={{ width:1, height:16, background:C.border }}/>
<span style={{ ...Tx.label, color:C.secondary, fontSize:11 }}>ADMINPANEL</span>
<div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
<input placeholder="Sök namn, telefon…" value={search} onChange={e=>setSearch(e.target.value)}
style={{ ...Inp.base, width:200, height:34, padding:"0 12px", fontSize:12 }}/>
</div>
</div>

{/* Stat bar */}
<div style={{ borderBottom:`1px solid ${C.border}`, display:"flex" }}>
{[["ALLA BOKNINGAR",counts.all,C.secondary],["NYA",counts.Ny,C.accent],
["PÅGÅENDE",counts.Pågående,"#5B9CF6"],["KLARA",counts.Klar,C.success]].map(([l,n,col],i)=>(
<div key={l} style={{ flex:1, padding:"18px 28px", borderRight:i<3?`1px solid ${C.border}`:"none",
background: filter===l.split(" ")[0]||filter===(i===0?"all":l)?C.surface:C.bg,
cursor:"pointer", transition:"background 0.15s" }}
onClick={()=>setFilter(i===0?"all":l)}>
<p style={{ ...Tx.label, margin:"0 0 8px", fontSize:10, color:C.tertiary }}>{l}</p>
<p style={{ margin:0, fontSize:28, fontWeight:700, color:col, lineHeight:1, letterSpacing:"-1px" }}>{n}</p>
</div>
))}
</div>

{/* Filter pills */}
<div style={{ padding:"16px 28px", display:"flex", gap:6, borderBottom:`1px solid ${C.border}` }}>
{["all","Ny","Pågående","Klar"].map(f=>(
<button key={f} onClick={()=>setFilter(f)} style={{
...Btn.ghost, fontSize:12, padding:"5px 14px",
...(filter===f?{ borderColor:C.borderActive, color:C.accent, background:C.accentDim }:{})
}}>
{f==="all"?"Alla":f}
</button>
))}
</div>

{/* Table */}
<div style={{ padding:"0 28px 48px", overflowX:"auto" }}>
{filtered.length===0 ? (
<div style={{ textAlign:"center", padding:"80px 20px" }}>
<p style={{ ...Tx.muted, fontSize:15 }}>Inga bokningar hittades</p>
</div>
) : (
<table style={{ width:"100%", borderCollapse:"collapse", minWidth:760, marginTop:16 }}>
<thead>
<tr style={{ borderBottom:`1px solid ${C.border}` }}>
{["Kund","Kontakt","Datum","Tid","Tjänst","Status",""].map(h=>(
<th key={h} style={{ ...Tx.label, fontSize:10, padding:"10px 16px",
textAlign:"left", color:C.tertiary, fontWeight:600 }}>{h}</th>
))}
</tr>
</thead>
<tbody>
{filtered.map((b,i)=>(
<tr key={b.id} style={{ borderBottom:`1px solid ${C.borderSubtle}`,
background: i%2===0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
<td style={{ padding:"15px 16px" }}>
<p style={{ ...Tx.body, fontWeight:600, margin:0 }}>{b.name}</p>
</td>
<td style={{ padding:"15px 16px" }}>
<p style={{ ...Tx.sm, margin:"0 0 2px" }}>{b.phone}</p>
<p style={{ ...Tx.muted, fontSize:11, margin:0 }}>{b.email}</p>
</td>
<td style={{ padding:"15px 16px" }}>
<p style={{ ...Tx.sm, margin:0 }}>{b.date||"Drop-in"}</p>
</td>
<td style={{ padding:"15px 16px" }}>
<p style={{ ...Tx.sm, margin:0, fontVariantNumeric:"tabular-nums" }}>{b.time}</p>
</td>
<td style={{ padding:"15px 16px" }}>
<span style={{
fontSize:11, fontWeight:600, letterSpacing:"0.3px",
color: b.jobType==="enkla"?C.accent:"#5B9CF6",
background: b.jobType==="enkla"?C.accentDim:"rgba(91,156,246,0.1)",
padding:"4px 10px", borderRadius:4,
}}>
{b.jobType==="enkla"?"Snabbservice":"Större jobb"}
</span>
</td>
<td style={{ padding:"15px 16px" }}>
<div style={{ display:"flex", gap:4 }}>
{["Ny","Pågående","Klar"].map(s=>(
<button key={s} onClick={()=>upd(b.id,s)} style={{
padding:"4px 10px", borderRadius:4, border:"none", cursor:"pointer",
fontSize:11, fontWeight:600, letterSpacing:"0.3px", transition:"all 0.15s",
background: b.status===s ? sc[s]+"22" : "transparent",
color: b.status===s ? sc[s] : C.muted,
outline: b.status===s ? `1px solid ${sc[s]}44` : "none",
}}>
{s}
</button>
))}
</div>
</td>
<td style={{ padding:"15px 16px" }}>
<button onClick={()=>del(b.id)} style={{ ...Btn.ghost, fontSize:11, padding:"4px 10px", color:C.muted }}>
Ta bort
</button>
</td>
</tr>
))}
</tbody>
</table>
)}
</div>
</div>
```

);
}

/* ═════════════════════════════════════════════════════════
SUCCESS MODAL
═════════════════════════════════════════════════════════ */
function SuccessModal({ booking, onClose }) {
return (
<div style={{ position:“fixed”, inset:0, background:“rgba(0,0,0,0.88)”,
backdropFilter:“blur(16px)”, display:“flex”, alignItems:“center”,
justifyContent:“center”, zIndex:100, padding:20,
fontFamily:”‘Syne’,‘DM Sans’,sans-serif” }}
onClick={onClose}>
<div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20,
padding:“48px 44px”, maxWidth:460, width:“100%”,
boxShadow:“0 50px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)” }}
onClick={e=>e.stopPropagation()}>

```
{/* Gold accent line */}
<div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:36 }}>
<div style={{ width:32, height:2, background:C.accent }}/>
<span style={{ ...Tx.label, color:C.accent, fontSize:10 }}>BOKNING BEKRÄFTAD</span>
</div>

<h2 style={{ ...Tx.h1, fontSize:34, marginBottom:12, letterSpacing:"-1px" }}>
Bokning mottagen
</h2>
<p style={{ ...Tx.secondary, lineHeight:1.7, marginBottom:36, maxWidth:320 }}>
Vi återkommer inom kort via telefon eller e-post för att bekräfta din tid.
</p>

{/* Summary */}
<div style={{ borderTop:`1px solid ${C.border}`, marginBottom:32 }}>
{[
["Namn", booking.name],
["Datum", booking.jobType==="enkla"?"Drop-in":fmtLong(booking.date)],
["Tid", booking.time],
["Tjänst", booking.jobType==="enkla"?"Snabbservice":"Större jobb"],
].map(([l,v])=>(
<div key={l} style={{ display:"flex", justifyContent:"space-between",
alignItems:"center", padding:"13px 0", borderBottom:`1px solid ${C.borderSubtle}` }}>
<span style={{ ...Tx.label, fontSize:10, color:C.tertiary }}>{l}</span>
<span style={{ ...Tx.body, fontSize:14, fontWeight:500, color:C.secondary,
maxWidth:"60%", textAlign:"right" }}>{cap(v)}</span>
</div>
))}
</div>

<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
<a href={`tel:${WS.phonePlain}`} style={{ ...Btn.ghost, textDecoration:"none",
textAlign:"center", display:"block", padding:"13px", fontSize:13 }}>
Ring oss
</a>
<button style={{ ...Btn.gold, fontSize:14 }} onClick={onClose}>Stäng</button>
</div>
</div>
</div>
```

);
}

/* ═════════════════════════════════════════════════════════
MAIN APP
═════════════════════════════════════════════════════════ */
export default function App() {
const [view,setView] = useState(“booking”);
const [step,setStep] = useState(1);
const [visible,setVisible] = useState(true);
const [confirmed,setConfirmed] = useState(null);
const [errors,setErrors] = useState({});
const [bookedSlots,setBooked] = useState([]);
const [storaCount,setCount] = useState(0);
const [imgPreview,setPreview] = useState(null);
const [hoverSvc,setHoverSvc] = useState(null);
const [hoverSlot,setHoverSlot] = useState(null);
const [btnActive,setBtnActive] = useState(false);

const [form,setForm] = useState({
name:””, phone:””, email:””,
jobType:””, date:””, time:””,
tags:[], description:””, image:null,
});

const refresh = useCallback((date)=>{
if(!date||isWeekend(date)||isPast(date)){ setBooked([]); setCount(0); return; }
setBooked(slotsOnDate(date));
setCount(storaOnDate(date));
},[]);

useEffect(()=>{ refresh(form.date); },[form.date,refresh]);

function set(f,v){ setForm(p=>({…p,[f]:v})); if(errors[f]) setErrors(e=>({…e,[f]:undefined})); }
function toggleTag(t){ setForm(p=>({…p,tags:p.tags.includes(t)?p.tags.filter(x=>x!==t):[…p.tags,t]})); }

function go(target){
setVisible(false);
setTimeout(()=>{ setStep(target); setErrors({}); setVisible(true); }, 200);
}

function validate(){
const e={};
if(step===1){
if(!form.name.trim()) e.name = “Namn krävs”;
if(!form.phone.trim()) e.phone = “Telefon krävs”;
if(!form.email.trim()) e.email = “E-post krävs”;
}
if(step===2){
if(!form.jobType) e.jobType = “Välj en tjänst”;
if(form.jobType===“stora”){
if(!form.date) e.date = “Välj ett datum”;
else if(isWeekend(form.date)) e.date = “Välj en vardag (mån–fre)”;
else if(storaCount>=MAX) e.date = “Fullbokat — välj ett annat datum”;
if(!form.time) e.time = “Välj en tid”;
}
}
return e;
}

function next(){
const e = validate();
if(Object.keys(e).length){ setErrors(e); return; }
go(step+1);
}

function handleImage(e){
const file = e.target.files[0]; if(!file) return;
const r = new FileReader();
r.onload = ev=>{ setPreview(ev.target.result); set(“image”,ev.target.result); };
r.readAsDataURL(file);
}

function submit(){
const desc = [
form.tags.length>0 ? form.tags.join(”, “) : null,
form.description || null,
].filter(Boolean).join(”\n\n”);

```
const booking = {
id: Date.now().toString(),
...form,
description: desc,
date: form.jobType==="enkla" ? todayStr() : form.date,
time: form.jobType==="enkla" ? "Drop-in" : form.time,
status: "Ny",
createdAt: new Date().toISOString(),
};
saveAll([...getAll(), booking]);
notifyWorkshop(booking);
setConfirmed(booking);
```

}

function reset(){
setConfirmed(null); go(1);
setForm({ name:””,phone:””,email:””,jobType:””,date:””,time:””,tags:[],description:””,image:null });
setPreview(null);
}

if(view===“admin”) return <AdminPanel onBack={()=>setView(“booking”)}/>;

const avail = SLOTS.filter(s=>!bookedSlots.includes(s));
const isFull = form.jobType===“stora” && form.date && storaCount>=MAX;

/* Summary rows for step 5 */
const summaryRows = [
[“Namn”, form.name],
[“Telefon”, form.phone],
[“E-post”, form.email],
[“Tjänst”, form.jobType===“enkla” ? “Snabbservice” : form.jobType===“stora” ? “Större jobb” : “–”],
…(form.jobType===“stora” ? [[“Datum”,fmtLong(form.date)],[“Tid”,form.time]] : []),
…(form.tags.length>0 ? [[“Kategorier”,form.tags.join(”, “)]] : []),
…(form.description ? [[“Beskrivning”,form.description]] : []),
].filter(([,v])=>v&&v!==”–”);

return (
<div style={{ minHeight:“100vh”, background:C.bg, fontFamily:”‘Syne’,‘DM Sans’,sans-serif”,
color:C.primary, WebkitFontSmoothing:“antialiased” }}>
<Fonts/>

```
{/* ── HEADER ── */}
<header style={{ borderBottom:`1px solid ${C.border}`, height:58,
display:"flex", alignItems:"center", justifyContent:"space-between",
padding:"0 32px", maxWidth:1240, margin:"0 auto" }}>
<div style={{ display:"flex", alignItems:"center", gap:16 }}>
<span style={{ fontSize:15, fontWeight:700, letterSpacing:"-0.3px", color:C.primary }}>
{WS.name}
</span>
<span style={{ width:1, height:14, background:C.border, display:"inline-block" }}/>
<span style={{ ...Tx.label, fontSize:10, color:C.tertiary }}>
{WS.tagline.toUpperCase()}
</span>
</div>
<div style={{ display:"flex", alignItems:"center", gap:16 }}>
<a href={`tel:${WS.phonePlain}`} style={{ ...Tx.sm, color:C.tertiary,
textDecoration:"none", transition:"color 0.15s", fontSize:13 }}>
{WS.phone}
</a>
<button style={{ ...Btn.ghost, fontSize:12, padding:"5px 12px", color:C.tertiary }}
onClick={()=>setView("admin")}>Admin</button>
</div>
</header>

{/* ── MAIN ── */}
<main style={{ maxWidth:580, margin:"0 auto", padding:"56px 20px 96px" }}>

{/* Page headline */}
<div style={{ marginBottom:52 }}>
<div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
<div style={{ width:20, height:1.5, background:C.accent }}/>
<p style={{ ...Tx.label, margin:0, color:C.accent, fontSize:10 }}>ONLINEBOKNING</p>
</div>
<h1 style={{ ...Tx.h1, fontSize:"clamp(34px,6vw,52px)", marginBottom:14, lineHeight:1.05,
letterSpacing:"-1.5px" }}>
Boka din<br/>
<span style={{ color:C.accent }}>bilservice</span>
</h1>
<p style={{ ...Tx.secondary, maxWidth:340, lineHeight:1.75, fontSize:14 }}>
Fyll i formuläret nedan. Vi bekräftar din tid via telefon inom kort.
</p>
</div>

{/* ── PROGRESS INDICATOR ── */}
<div style={{ marginBottom:44 }}>
<div style={{ display:"flex", alignItems:"center" }}>
{STEPS.map((s,i)=>(
<div key={s.n} style={{ display:"flex", alignItems:"center",
flex: i<STEPS.length-1 ? 1 : "none" }}>
<div style={{
width:30, height:30, borderRadius:"50%", flexShrink:0,
display:"flex", alignItems:"center", justifyContent:"center",
fontSize:11, fontWeight:700, letterSpacing:"0.3px",
transition:"all 0.28s ease",
border:`1.5px solid ${ step>s.n?C.accent : step===s.n?C.accent : C.muted+"50" }`,
background: step>s.n ? C.accent : step===s.n ? C.accentDim : "transparent",
color: step>s.n ? C.bg : step===s.n ? C.accent : C.muted,
boxShadow: step===s.n ? `0 0 18px ${C.accentGlow}` : "none",
}}>
{step>s.n ? "✓" : s.n}
</div>
{i<STEPS.length-1 && (
<div style={{ flex:1, height:1, margin:"0 8px",
background: step>s.n ? `linear-gradient(90deg,${C.accent},${C.accent}88)` : C.border,
transition:"background 0.4s ease" }}/>
)}
</div>
))}
</div>
<div style={{ display:"flex", marginTop:10 }}>
{STEPS.map((s,i)=>(
<div key={s.n} style={{ flex: i<STEPS.length-1 ? 1 : "none" }}>
<span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.8px",
textTransform:"uppercase", transition:"color 0.28s",
color: step>=s.n ? C.accent : C.muted }}>
{s.label}
</span>
</div>
))}
</div>
</div>

{/* ── STEP WRAPPER (animated) ── */}
<div style={{
opacity: visible ? 1 : 0,
transform: visible ? "translateY(0)" : "translateY(10px)",
transition: "opacity 0.22s ease, transform 0.22s ease",
}}>

{/* ══════════════════════
STEP 1 — CONTACT
══════════════════════ */}
{step===1 && (
<Card>
<CardHeader num="01" title="Kontaktuppgifter"
sub="Vi kontaktar dig på dessa uppgifter när din bokning är bekräftad."/>
<div style={{ display:"flex", flexDirection:"column", gap:22 }}>
{[
{f:"name", l:"Fullständigt namn", ph:"Förnamn Efternamn", t:"text"},
{f:"phone", l:"Telefonnummer", ph:"070 – XXX XX XX", t:"tel"},
{f:"email", l:"E-postadress", ph:"din@email.se", t:"email"},
].map(({f,l,ph,t})=>(
<div key={f}>
<label style={{ ...Tx.label, display:"block", marginBottom:8, fontSize:10 }}>{l}</label>
<input type={t} placeholder={ph} value={form[f]}
onChange={e=>set(f,e.target.value)}
style={{ ...Inp.base, ...(errors[f]?{borderColor:C.error}:{}) }}/>
{errors[f] && <p style={{ color:C.error, fontSize:12, marginTop:7, fontWeight:500 }}>{errors[f]}</p>}
</div>
))}
</div>
<CardFooter onNext={next}/>
</Card>
)}

{/* ══════════════════════
STEP 2 — SERVICE
══════════════════════ */}
{step===2 && (
<Card>
<CardHeader num="02" title="Välj tjänst"
sub="Välj det alternativ som bäst beskriver ditt ärende."/>

{errors.jobType && <ErrMsg msg={errors.jobType}/>}

{/* Service cards */}
<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
{[
{ v:"enkla", title:"Snabbservice", sub:"Enkla åtgärder utan tidsbokning" },
{ v:"stora", title:"Större jobb", sub:"Kräver tidsbokning" },
].map(svc=>{
const active = form.jobType===svc.v;
const hover = hoverSvc===svc.v && !active;
return (
<button key={svc.v}
onClick={()=>set("jobType",svc.v)}
onMouseEnter={()=>setHoverSvc(svc.v)}
onMouseLeave={()=>setHoverSvc(null)}
style={{
background: active ? C.accentDim : hover ? "rgba(255,255,255,0.025)" : "transparent",
border: `1.5px solid ${ active ? C.borderActive : hover ? "rgba(255,255,255,0.12)" : C.border }`,
borderRadius:12, padding:"24px 20px", cursor:"pointer", textAlign:"left",
transition:"all 0.18s ease",
transform: hover ? "scale(1.015)" : "scale(1)",
boxShadow: active ? `0 0 28px ${C.accentGlow}, inset 0 0 0 1px ${C.borderActive}` : "none",
position:"relative",
}}>
{/* Selection indicator */}
<div style={{
width:16, height:16, borderRadius:"50%", marginBottom:16,
border:`1.5px solid ${ active ? C.accent : C.muted+"60" }`,
background: active ? C.accent : "transparent",
display:"flex", alignItems:"center", justifyContent:"center",
transition:"all 0.18s ease",
boxShadow: active ? `0 0 10px ${C.accentGlow}` : "none",
}}>
{active && <span style={{ width:6, height:6, borderRadius:"50%", background:C.bg }}/>}
</div>
<p style={{ ...Tx.body, fontWeight:700, margin:"0 0 7px", fontSize:15,
color: active ? C.primary : C.secondary, letterSpacing:"-0.2px" }}>
{svc.title}
</p>
<p style={{ ...Tx.muted, margin:0, fontSize:12, lineHeight:1.55 }}>
{svc.sub}
</p>
</button>
);
})}
</div>

{/* Info panel — Snabbservice */}
{form.jobType==="enkla" && (
<div style={{ background:C.accentDim, border:`1px solid ${C.borderActive}`,
borderRadius:10, padding:"16px 18px", marginBottom:8 }}>
<p style={{ ...Tx.sm, margin:0, lineHeight:1.65, color:C.secondary }}>
<span style={{ color:C.accent, fontWeight:600 }}>Drop-in tillgängligt.</span>
{" "}Ingen tidsbokning krävs. Du kan besöka oss direkt under öppettider.
</p>
</div>
)}

{/* Date + Time — Större jobb */}
{form.jobType==="stora" && (
<div style={{ borderTop:`1px solid ${C.border}`, paddingTop:24, marginTop:8 }}>
<p style={{ ...Tx.sm, marginBottom:20, lineHeight:1.7, color:C.tertiary }}>
Tillgängliga tider visas nedan. Välj ett datum för att se lediga platser.
</p>

{/* Date input */}
<div style={{ marginBottom:22 }}>
<label style={{ ...Tx.label, display:"block", marginBottom:8, fontSize:10 }}>
Datum — måndag till fredag
</label>
<input type="date" min={todayStr()} value={form.date}
onChange={e=>{
const v=e.target.value; set("date",v); set("time","");
if(isWeekend(v)) setErrors(er=>({...er,date:"Välj en vardag (mån–fre)"}));
else setErrors(er=>({...er,date:undefined}));
}}
style={{ ...Inp.base, ...(errors.date?{borderColor:C.error}:{}) }}/>
{errors.date && <ErrMsg msg={errors.date}/>}
{form.date && !isWeekend(form.date) && !errors.date && (
<p style={{ color:C.accent, fontSize:12, marginTop:9, fontWeight:500, letterSpacing:"0.2px" }}>
{avail.length>0 ? `${avail.length} av ${SLOTS.length} tider tillgängliga` : "Inga lediga tider detta datum"}
</p>
)}
</div>

{/* Time slots */}
{form.date && !isWeekend(form.date) && !isFull && (
<div>
<label style={{ ...Tx.label, display:"block", marginBottom:12, fontSize:10 }}>
Välj tid
</label>
{errors.time && <ErrMsg msg={errors.time}/>}
<div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
{SLOTS.map(sl=>{
const taken = bookedSlots.includes(sl);
const active = form.time===sl;
const hover = hoverSlot===sl && !taken;
return (
<button key={sl} disabled={taken}
onClick={()=>!taken&&set("time",sl)}
onMouseEnter={()=>!taken&&setHoverSlot(sl)}
onMouseLeave={()=>setHoverSlot(null)}
style={{
padding:"14px 10px", borderRadius:8,
border:`1.5px solid ${ active?C.borderActive : hover?"rgba(255,255,255,0.14)":C.border }`,
background: active?C.accentDim : hover?"rgba(255,255,255,0.025)":"transparent",
color: taken?C.muted : active?C.accent : hover?C.primary:C.secondary,
fontSize:15, fontWeight:600, cursor:taken?"not-allowed":"pointer",
opacity:taken?0.4:1,
transition:"all 0.15s ease", letterSpacing:"0.5px",
boxShadow: active?`0 0 18px ${C.accentGlow}`:"none",
}}>
{sl}
<span style={{ display:"block", fontSize:9, marginTop:4, fontWeight:600,
letterSpacing:"0.8px", textTransform:"uppercase",
color: taken?C.muted : active?C.accent:C.muted }}>
{taken?"Bokad":"Ledig"}
</span>
</button>
);
})}
</div>
</div>
)}

{isFull && (
<div style={{ background:C.errorDim, border:`1px solid ${C.error}44`,
borderRadius:10, padding:"14px 18px" }}>
<p style={{ color:C.error, fontSize:13, margin:0, fontWeight:500, lineHeight:1.6 }}>
Fullbokat detta datum. Välj ett annat datum för att se lediga tider.
</p>
</div>
)}
</div>
)}

<CardFooter onNext={next} onBack={()=>go(1)}/>
</Card>
)}

{/* ══════════════════════
STEP 3 — DESCRIBE
══════════════════════ */}
{step===3 && (
<Card>
<CardHeader num="03" title="Beskriv ärendet"
sub="Välj relevanta kategorier och beskriv felet i fritext."/>

{/* Tags */}
<div style={{ marginBottom:22 }}>
<label style={{ ...Tx.label, display:"block", marginBottom:10, fontSize:10 }}>
Kategori
</label>
<div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
{TAGS.map(t=>{
const sel = form.tags.includes(t);
return (
<button key={t} onClick={()=>toggleTag(t)} style={{
padding:"8px 15px", borderRadius:6, cursor:"pointer", fontSize:13,
fontWeight: sel?600:400, letterSpacing:"0.2px",
border:`1px solid ${ sel?C.borderActive:C.border }`,
background: sel ? C.accentDim : "transparent",
color: sel ? C.accent : C.secondary,
transition:"all 0.15s ease",
boxShadow: sel ? `0 0 12px ${C.accentDim}` : "none",
}}>
{t}
</button>
);
})}
</div>
</div>

{/* Textarea */}
<div>
<label style={{ ...Tx.label, display:"block", marginBottom:8, fontSize:10 }}>
Beskrivning{" "}
<span style={{ ...Tx.muted, textTransform:"none", letterSpacing:0, fontWeight:400, fontSize:11 }}>
— valfritt
</span>
</label>
<textarea value={form.description} rows={5}
onChange={e=>set("description",e.target.value)}
placeholder="Beskriv felet i detalj. Inkludera gärna när problemet uppstår och hur länge det har pågått."
style={{ ...Inp.base, resize:"vertical", lineHeight:1.75, height:"auto",
padding:"14px 16px", fontFamily:"'Syne','DM Sans',sans-serif", fontSize:13 }}/>
</div>

<CardFooter onNext={next} onBack={()=>go(2)}/>
</Card>
)}

{/* ══════════════════════
STEP 4 — IMAGE
══════════════════════ */}
{step===4 && (
<Card>
<CardHeader num="04" title="Bifoga bild"
sub="Ladda upp ett foto av felet för snabbare diagnos. Valfritt."/>

<label style={{ cursor:"pointer", display:"block" }}>
<input type="file" accept="image/*" style={{ display:"none" }} onChange={handleImage}/>
{imgPreview ? (
<div style={{ position:"relative", borderRadius:10, overflow:"hidden",
border:`1px solid ${C.border}` }}>
<img src={imgPreview} alt=""
style={{ width:"100%", maxHeight:280, objectFit:"cover", display:"block" }}/>
<div style={{ position:"absolute", bottom:0, left:0, right:0,
background:"linear-gradient(transparent,rgba(0,0,0,0.6))", padding:"24px 16px 14px" }}>
<span style={{ ...Tx.sm, fontSize:12 }}>Klicka för att byta bild</span>
</div>
</div>
) : (
<div style={{ border:`1px dashed ${C.border}`, borderRadius:10,
padding:"52px 20px", textAlign:"center",
background:"rgba(255,255,255,0.01)",
transition:"border-color 0.2s, background 0.2s" }}>
<div style={{ width:44, height:44, border:`1px solid ${C.border}`,
borderRadius:10, display:"flex", alignItems:"center",
justifyContent:"center", margin:"0 auto 16px" }}>
<span style={{ fontSize:20, color:C.muted, fontWeight:300 }}>+</span>
</div>
<p style={{ ...Tx.secondary, margin:"0 0 6px", fontSize:14, fontWeight:600 }}>
Klicka för att ladda upp
</p>
<p style={{ ...Tx.muted, margin:0, fontSize:12 }}>
JPG, PNG, HEIC — max 10 MB
</p>
</div>
)}
</label>

<CardFooter onNext={next} onBack={()=>go(3)} nextLabel="Fortsätt"/>
</Card>
)}

{/* ══════════════════════
STEP 5 — CONFIRM
══════════════════════ */}
{step===5 && (
<Card>
<CardHeader num="05" title="Bekräfta bokning"
sub="Granska dina uppgifter innan du skickar."/>

{/* Summary table */}
<div style={{ border:`1px solid ${C.border}`, borderRadius:10,
overflow:"hidden", marginBottom:24 }}>
{summaryRows.map(([l,v],i)=>(
<div key={l} style={{ display:"flex", gap:20, padding:"13px 18px",
borderBottom: i<summaryRows.length-1?`1px solid ${C.borderSubtle}`:"none",
alignItems:"flex-start",
background: i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
<span style={{ ...Tx.label, fontSize:9, minWidth:76, paddingTop:2, flexShrink:0 }}>
{l.toUpperCase()}
</span>
<span style={{ ...Tx.secondary, fontSize:13, flex:1, lineHeight:1.6,
fontWeight:500, wordBreak:"break-word" }}>
{cap(v)}
</span>
</div>
))}
</div>

<p style={{ ...Tx.muted, fontSize:12, lineHeight:1.7, marginBottom:24 }}>
Genom att bekräfta godkänner du att vi kontaktar dig på{" "}
<span style={{ color:C.secondary }}>{form.phone}</span>{" "}
för att bekräfta din bokning.
</p>

<button
onMouseDown={()=>setBtnActive(true)}
onMouseUp={()=>setBtnActive(false)}
onMouseLeave={()=>setBtnActive(false)}
onClick={submit}
style={{
...Btn.gold, width:"100%", fontSize:15, padding:"17px",
letterSpacing:"-0.2px", fontWeight:700,
transform: btnActive ? "scale(0.985)" : "scale(1)",
transition:"transform 0.1s ease, box-shadow 0.2s ease",
boxShadow: btnActive ? "none" : `0 8px 40px rgba(214,178,94,0.2)`,
}}>
Bekräfta bokning
</button>

<button onClick={()=>go(4)} style={{ ...Btn.ghost, width:"100%",
marginTop:10, padding:"13px", fontSize:13 }}>
Gå tillbaka
</button>
</Card>
)}
</div>

{/* Contact line */}
<div style={{ marginTop:40, display:"flex", justifyContent:"center", gap:24,
flexWrap:"wrap", borderTop:`1px solid ${C.border}`, paddingTop:28 }}>
{[
[`${WS.phone}`,`tel:${WS.phonePlain}`],
[WS.email, `mailto:${WS.email}`],
].map(([t,h])=>(
<a key={t} href={h} style={{ ...Tx.muted, fontSize:12, textDecoration:"none",
transition:"color 0.15s" }}>
{t}
</a>
))}
<span style={{ ...Tx.muted, fontSize:12 }}>{WS.hours}</span>
</div>
</main>

{confirmed && <SuccessModal booking={confirmed} onClose={reset}/>}
</div>
```

);
}

/* ─────────────────────────────────────────────────────────
SHARED COMPONENTS
───────────────────────────────────────────────────────── */
function Fonts() {
return <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>;
}

function Card({ children }) {
return (
<div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18,
padding:“36px 32px”, boxShadow:“0 24px 64px rgba(0,0,0,0.4)” }}>
{children}
</div>
);
}

function CardHeader({ num, title, sub }) {
return (
<div style={{ marginBottom:30 }}>
<p style={{ …Tx.label, color:C.accent, marginBottom:10, fontSize:10 }}>{num}</p>
<h2 style={{ …Tx.h1, fontSize:22, marginBottom:8, letterSpacing:”-0.5px” }}>{title}</h2>
<p style={{ …Tx.muted, fontSize:13, margin:0, lineHeight:1.6 }}>{sub}</p>
</div>
);
}

function CardFooter({ onNext, onBack, nextLabel=“Nästa” }) {
return (
<div style={{ display:“flex”, gap:10, marginTop:32, paddingTop:24,
borderTop:`1px solid ${C.border}` }}>
{onBack && (
<button onClick={onBack} style={{ …Btn.ghost, padding:“13px 20px”, fontSize:13 }}>
Tillbaka
</button>
)}
<button onClick={onNext} style={{ …Btn.gold, flex:1, padding:“13px”, fontSize:14, fontWeight:700 }}>
{nextLabel}
</button>
</div>
);
}

function ErrMsg({ msg }) {
return <p style={{ color:C.error, fontSize:12, marginTop:7, fontWeight:500 }}>{msg}</p>;
}

/* ─────────────────────────────────────────────────────────
DESIGN TOKEN OBJECTS
───────────────────────────────────────────────────────── */
const Tx = {
h1: { margin:0, color:C.primary, fontWeight:700, lineHeight:1.15 },
body: { color:C.primary, margin:0, fontSize:14 },
secondary: { color:C.secondary, margin:0, fontSize:14 },
sm: { color:C.secondary, margin:0, fontSize:13 },
muted: { color:C.tertiary, margin:0, fontSize:13 },
label: { margin:0, fontSize:10, fontWeight:700, letterSpacing:“1px”,
textTransform:“uppercase”, color:C.muted },
};

const Inp = {
base: {
width:“100%”, boxSizing:“border-box”,
background:C.surface, border:`1px solid ${C.border}`,
borderRadius:8, padding:“13px 16px”,
color:C.primary, fontSize:14, outline:“none”,
fontFamily:”‘Syne’,‘DM Sans’,sans-serif”,
transition:“border-color 0.18s, box-shadow 0.18s”,
letterSpacing:“0.1px”,
},
};

const Btn = {
gold: {
background:`linear-gradient(135deg, ${C.accent}, #B8953A)`,
border:“none”, borderRadius:8, padding:“12px 24px”,
color:”#0A0A0B”, fontSize:14, fontWeight:700,
cursor:“pointer”, fontFamily:”‘Syne’,‘DM Sans’,sans-serif”,
letterSpacing:”-0.2px”,
},
ghost: {
background:“transparent”, border:`1px solid ${C.border}`,
borderRadius:8, padding:“9px 16px”,
color:C.secondary, fontSize:13, fontWeight:500,
cursor:“pointer”, fontFamily:”‘Syne’,‘DM Sans’,sans-serif”,
transition:“border-color 0.18s, color 0.18s”,
},
};
