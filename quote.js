const ENDPOINT   = "https://script.google.com/macros/s/AKfycbx24spWcNWtU1S7L9gKUogVw-0bRZclxMgohOy1euznLanIMAdXc3654YqVaz4TLzgXoQ/exec";
const INGEST_KEY = "strauch-quote-2026";
const FALLBACK_EMAIL = "gregtstrauch@gmail.com";

/* ── engine ───────────────────────────────────────── */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const has=(v,k,val)=>(v[k]||"").split("|").includes(val);
const form=document.getElementById("form");
let step=-1, visible=[], repCount={};

function ctl(f,pfx){
  const nm=(pfx||"")+f.n, id="i_"+nm.replace(/[^\w]/g,"_"), r=f.req?"required":"";
  if(f.t==="consent")
    return `<label class="consent" data-wrap="${nm}"><input type="checkbox" name="${nm}" value="Yes" ${r}><span>${f.txt}</span></label>`;
  const lbl=`<label class="l" for="${id}">${f.l}${f.req?'<span class="rq">*</span>':""}</label>`;
  const hint=f.h?`<div class="hint">${f.h}</div>`:"";
  let inner="";
  if(f.t==="select"){
    inner=`<select id="${id}" name="${nm}" ${r}><option value="">Select&hellip;</option>`+
      f.o.map(o=>`<option${f.def===o?" selected":""}>${esc(o)}</option>`).join("")+`</select>`;
  }else if(f.t==="textarea"){
    inner=`<textarea id="${id}" name="${nm}" ${r}></textarea>`;
  }else if(f.t==="check"||f.t==="radio"){
    const ty=f.t==="check"?"checkbox":"radio";
    inner=`<div class="opts${f.stack?" stack":""}" data-group="${nm}">`+
      f.o.map((o,i)=>`<label class="opt"><input type="${ty}" name="${nm}" value="${esc(o)}"${f.req&&ty==="radio"?" required":""}><span>${esc(o)}</span></label>`).join("")+`</div>`;
  }else{
    inner=`<input type="${f.t}" id="${id}" name="${nm}" ${r}${f.t==="number"?' inputmode="numeric"':""}>`;
  }
  return `<div class="f w${f.w||12}">${lbl}${inner}${hint}</div>`;
}

function repBlock(sec,i){
  const pfx=sec.id+"_"+i+"_";
  return `<div class="rep" data-rep="${sec.id}" data-idx="${i}">
    <div class="reph"><span class="repn">${sec.repeat.label} ${i}</span>
    ${i>sec.repeat.min?`<button type="button" class="rmv" data-rm="${sec.id}">Remove</button>`:""}</div>
    <div class="grid">${sec.fields.map(f=>ctl(f,pfx)).join("")}</div></div>`;
}

function render(){
  form.innerHTML=SCHEMA.map(sec=>{
    let body;
    if(sec.repeat){
      repCount[sec.id]=repCount[sec.id]||sec.repeat.min;
      body=`<div data-reps="${sec.id}">`+Array.from({length:repCount[sec.id]},(_,k)=>repBlock(sec,k+1)).join("")+`</div>
        <button type="button" class="addbtn" data-add="${sec.id}">${sec.repeat.add}</button>`;
    }else{
      body=`<div class="grid">${sec.fields.map(f=>ctl(f)).join("")}</div>`;
    }
    return `<section class="sec" data-sec="${sec.id}">
      <div class="sk">${sec.kicker}</div><div class="st">${sec.title}</div><div class="sd">${sec.desc}</div>
      ${sec.note?`<div class="note">${sec.note}</div>`:""}${body}</section>`;
  }).join("");
}

function values(){
  const v={};
  form.querySelectorAll("input,select,textarea").forEach(el=>{
    if(el.closest("section").dataset.skip==="1")return;
    if(el.type==="checkbox"){ if(el.checked) v[el.name]=v[el.name]?v[el.name]+"|"+el.value:el.value; }
    else if(el.type==="radio"){ if(el.checked) v[el.name]=el.value; }
    else if(el.value.trim()) v[el.name]=el.value.trim();
  });
  return v;
}

function computeVisible(){
  const v=values();
  visible=[];
  SCHEMA.forEach((sec,i)=>{
    const show=!sec.when||sec.when(v);
    form.querySelector(`[data-sec="${sec.id}"]`).dataset.skip=show?"0":"1";
    if(show)visible.push(i);
  });
}

function show(){
  computeVisible();
  if(step>=visible.length)step=visible.length-1;
  form.querySelectorAll(".sec").forEach(s=>s.classList.remove("on"));
  document.getElementById("intro").style.display=step<0?"block":"none";
  if(step>=0){
    const sec=SCHEMA[visible[step]];
    form.querySelector(`[data-sec="${sec.id}"]`).classList.add("on");
    document.getElementById("stepName").textContent=sec.title;
    document.getElementById("stepNum").textContent=`${step+1} of ${visible.length}`;
  }else{
    document.getElementById("stepName").textContent="Getting started";
    document.getElementById("stepNum").textContent="";
  }
  document.getElementById("bari").style.width=(step<0?2:((step+1)/visible.length)*100)+"%";
  document.getElementById("back").style.visibility=step<=-1?"hidden":"visible";
  const last=step===visible.length-1;
  document.getElementById("next").textContent=step<0?"Get started":(last?"Submit application":"Continue");
  window.scrollTo({top:0,behavior:"smooth"});
}

function validStep(){
  if(step<0)return true;
  const sec=form.querySelector(".sec.on");
  const groups=new Set();
  for(const el of sec.querySelectorAll("[required]")){
    if(el.type==="checkbox"||el.type==="radio"){
      if(groups.has(el.name))continue; groups.add(el.name);
      if(!sec.querySelector(`[name="${el.name}"]:checked`)){
        (el.closest(".f")||el.closest(".consent")).scrollIntoView({block:"center",behavior:"smooth"});
        el.focus(); flash(el); return false;
      }
    }else if(!el.value.trim()||!el.checkValidity()){
      el.classList.add("touched"); el.scrollIntoView({block:"center",behavior:"smooth"});
      el.reportValidity(); return false;
    }
  }
  return true;
}
function flash(el){
  const w=el.closest(".opts")||el.closest(".consent");
  if(!w)return; w.style.transition="box-shadow .2s";
  w.style.boxShadow="0 0 0 3px rgba(224,25,51,.25)";
  setTimeout(()=>w.style.boxShadow="",1400);
}

/* draft autosave */
const KEY="strauch_quote_"+FORM_TYPE.toLowerCase();
function save(){
  try{ localStorage.setItem(KEY,JSON.stringify({v:values(),r:repCount,s:step}));
    const el=document.getElementById("saved"); el.textContent="Saved";
    clearTimeout(save.t); save.t=setTimeout(()=>el.textContent="",1800);
  }catch(e){}
}
function restore(){
  let d; try{ d=JSON.parse(localStorage.getItem(KEY)||"null"); }catch(e){}
  if(!d)return;
  repCount=d.r||repCount; render();
  Object.entries(d.v||{}).forEach(([n,val])=>{
    const els=form.querySelectorAll(`[name="${CSS.escape(n)}"]`);
    if(!els.length)return;
    if(els[0].type==="checkbox"||els[0].type==="radio"){
      const set=String(val).split("|");
      els.forEach(e=>{e.checked=set.includes(e.value);syncOpt(e);});
    }else els[0].value=val;
  });
  step=typeof d.s==="number"?d.s:-1;
}
function syncOpt(el){
  const w=el.closest(".opt")||el.closest(".consent");
  if(w)w.classList.toggle("sel",el.checked);
}

/* events */
form.addEventListener("input",e=>{save();});
form.addEventListener("change",e=>{
  if(e.target.type==="radio"){
    form.querySelectorAll(`[name="${CSS.escape(e.target.name)}"]`).forEach(syncOpt);
  }else syncOpt(e.target);
  save();
});
form.addEventListener("click",e=>{
  const add=e.target.dataset.add, rm=e.target.dataset.rm;
  if(add){
    const sec=SCHEMA.find(s=>s.id===add);
    if(repCount[add]>=sec.repeat.max){e.target.textContent="That's the maximum — tell us about the rest in the notes.";return;}
    repCount[add]++;
    const wrap=form.querySelector(`[data-reps="${add}"]`);
    wrap.insertAdjacentHTML("beforeend",repBlock(sec,repCount[add]));
    wrap.lastElementChild.scrollIntoView({block:"center",behavior:"smooth"});
    save();
  }
  if(rm){
    const blocks=[...form.querySelectorAll(`[data-rep="${rm}"]`)];
    const v=values(); e.target.closest(".rep").remove();
    repCount[rm]=blocks.length-1;
    // renumber so field names stay sequential
    const sec=SCHEMA.find(s=>s.id===rm), keep=[...form.querySelectorAll(`[data-rep="${rm}"]`)];
    keep.forEach((b,k)=>{ b.dataset.idx=k+1; b.querySelector(".repn").textContent=sec.repeat.label+" "+(k+1); });
    save();
  }
});
document.getElementById("back").onclick=()=>{step--;show();save();};
document.getElementById("next").onclick=()=>{
  if(!validStep())return;
  if(step<0){step=0;show();save();return;}
  computeVisible();
  if(step<visible.length-1){step++;show();save();}
  else submit();
};

async function submit(){
  const btn=document.getElementById("next"), err=document.getElementById("err");
  btn.disabled=true; btn.textContent="Sending…"; err.classList.remove("on");
  const payload={key:INGEST_KEY,type:FORM_TYPE,submittedAt:new Date().toString(),data:values()};
  try{
    if(!ENDPOINT||ENDPOINT.indexOf("PASTE_")===0)throw new Error("no endpoint configured");
    const res=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});
    const out=await res.json();
    if(!out.ok)throw new Error(out.error||"server refused");
    localStorage.removeItem(KEY);
    // real page view on /thanks/ = the quote conversion count
    location.replace("thanks/");
  }catch(e){
    btn.disabled=false; btn.textContent="Try submitting again";
    const body=encodeURIComponent(Object.entries(values()).map(([k,v])=>k+": "+v).join("\n"));
    err.innerHTML=`We couldn't submit that automatically. Nothing you typed is lost — it's still saved on this device.<br><br>
      Please try once more, or <a href="mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(FORM_TYPE+" quote application")}&body=${body}">send it to us by email instead</a>.`;
    err.classList.add("on"); err.scrollIntoView({block:"center",behavior:"smooth"});
  }
}

render(); restore();
form.querySelectorAll("input:checked").forEach(syncOpt);
const sd=form.querySelector('[name="signatureDate"]');
if(sd&&!sd.value)sd.value=new Date().toISOString().slice(0,10);
show();
