
import { useState, useEffect, useCallback, useRef } from "react";
/* ================= DESIGN TOKENS ================= */
const C = {
  bg: "#0A0A0B",
  surface: "#0F1115",
  card: "#15171C",
  border: "rgba(255,255,255,0.07)",
  accent: "#D6B25E",
  accentDim: "rgba(214,178,94,0.08)",
  primary: "#FFFFFF",
  secondary: "#A0A8B5",
  muted: "#3A3F4A",
  error: "#C0453A",
  success: "#3E8B5F",
};

/* ================= CONFIG ================= */
const WS = {
  name: "Hussein's Bilservice",
  tagline: "Auktoriserad verkstad — Stockholm",
  phone: "0790-574 975",
  phonePlain: "0790574975",
  email: "husseinmormor@gmail.com",
};

const SLOTS = ["08:00","09:30","11:00","12:30","14:00","15:30"];
const MAX = 5;


/* ================= STORAGE ================= */
function getAll() {
  try { return JSON.parse(localStorage.getItem("hb3") || "[]"); }
  catch { return []; }
}


function saveAll(a) {
  localStorage.setItem("hb3", JSON.stringify(a));
}


function slotsOnDate(d){
  return getAll().filter(b => b.date === d).map(b => b.time);
}


function storaOnDate(d){
  return getAll().filter(b => b.date === d).length;
}


/* ================= MAIN APP ================= */
export default function App() {
  const [step,setStep] = useState(1);
  const [form,setForm] = useState({
    name:"", phone:"", email:"",
    jobType:"", date:"", time:""
  });


  const [booked,setBooked] = useState([]);
  const [confirmed,setConfirmed] = useState(false);


  const refresh = useCallback((d)=>{
    if(!d) return;
    setBooked(slotsOnDate(d));
  },[]);


  useEffect(()=>{ refresh(form.date); },[form.date]);

  function setField(f,v){
    setForm(p => ({ ...p, [f]: v }));
  }
  function next(){
    if(step === 1 && (!form.name || !form.phone || !form.email)) return alert("Fyll i alla fält");
    if(step === 2 && form.jobType === "stora" && (!form.date || !form.time)) return alert("Välj datum & tid");
    setStep(s => s+1);
  }


  function submit(){
    const booking = {
      id: Date.now().toString(),
      ...form,
    };


    saveAll([...getAll(), booking]);
    setConfirmed(true);
  }

  if(confirmed) return (
    <div style={{padding:40, color:C.primary, background:C.bg, minHeight:"100vh"}}>
      <h1>Bokning klar ✅</h1>
      <button onClick={()=>window.location.reload()}>Ny bokning</button>
    </div>
  );


  return (
    <div style={{background:C.bg, color:C.primary, minHeight:"100vh", padding:30}}>
      <h1>{WS.name}</h1>

      {/* STEP 1 */}
      {step===1 && (
        <div>
          <input placeholder="Namn" value={form.name} onChange={e=>setField("name",e.target.value)} />
          <input placeholder="Telefon" value={form.phone} onChange={e=>setField("phone",e.target.value)} />
          <input placeholder="Email" value={form.email} onChange={e=>setField("email",e.target.value)} />
        </div>
      )}


      {/* STEP 2 */}
      {step===2 && (
        <div>
          <button onClick={()=>setField("jobType","enkla")}>Snabbservice</button>
          <button onClick={()=>setField("jobType","stora")}>Större jobb</button>


          {form.jobType === "stora" && (
            <>
              <input type="date" value={form.date} onChange={e=>setField("date",e.target.value)} />
              <div>
                {SLOTS.map(s => (
                  <button
                    key={s}
                    disabled={booked.includes(s)}
                    onClick={()=>setField("time",s)}
                  >
                    {s} {booked.includes(s) ? "(bokad)" : ""}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 3 */}
      {step===3 && (
        <div>
          <h3>Bekräfta:</h3>
          <p>{form.name}</p>
          <p>{form.date} {form.time}</p>
        </div>
      )}


      {/* NAV */}
      <div style={{marginTop:20}}>
        {step>1 && <button onClick={()=>setStep(step-1)}>Tillbaka</button>}
        {step<3 && <button onClick={next}>Nästa</button>}
        {step===3 && <button onClick={submit}>Boka</button>}
      </div>
    </div>
  );
}
