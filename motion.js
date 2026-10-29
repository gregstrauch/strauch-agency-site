/* site motion: headline words rise in, then cards and sections stagger in as
   they scroll into view. Loaded in <head> so hidden-until-revealed styles apply
   from the first paint. Skipped for prefers-reduced-motion; without JS (or if
   setup fails) everything is simply visible. */
(function(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const root=document.documentElement;
  root.classList.add("mo");

  // keep in sync with the .mo :is(...) list in site.css
  const TARGETS=[
    ".hero .eyebrow",".hero h1",".hero .lede",".hero .btns",".trust>div",".card-quote",".card-quote li",
    ".phero .wrap>*",
    "section:not(.hero):not(.phero) .eyebrow","section:not(.hero):not(.phero) h2","section:not(.hero):not(.phero) .lede",
    ".card",".member",".step",".cov a",".stakes>div",".stakes li",".faq details",".checks li",
    ".contact>div",".cform",".cdone",".other a"
  ].join(",");

  // wrap each word of a headline in a span so it can rise in word by word
  function splitWords(h){
    const walk=n=>{
      [...n.childNodes].forEach(c=>{
        if(c.nodeType===3){
          const parts=c.textContent.split(/(\s+)/), frag=document.createDocumentFragment();
          parts.forEach(p=>{
            if(!p)return;
            if(/^\s+$/.test(p)){frag.appendChild(document.createTextNode(p));return;}
            const s=document.createElement("span");s.className="w";s.textContent=p;frag.appendChild(s);
          });
          c.replaceWith(frag);
        }else if(c.nodeType===1&&c.tagName!=="BR")walk(c);
      });
    };
    walk(h);
    h.querySelectorAll(".w").forEach((w,i)=>w.style.setProperty("--d",(i*0.045).toFixed(3)+"s"));
    h.classList.add("split");
  }

  function setup(){
    document.querySelectorAll(".hero h1,.phero h1").forEach(splitWords);
    const els=[...document.querySelectorAll(TARGETS)];
    // the opening hero plays on load even if part of it sits below the fold
    const hero=els.filter(el=>el.closest(".hero,.phero"));
    hero.forEach((el,i)=>el.style.setProperty(el.classList.contains("split")?"--hd":"--d",Math.min(i*0.09,1.2).toFixed(2)+"s"));
    let pending=els.filter(el=>!hero.includes(el));
    // everything else comes in once its top reaches the lower part of the screen
    // (or it's already above, after an anchor jump); things that arrive together
    // come in one after another, in page order
    function check(){
      const line=innerHeight*0.9, now=pending.filter(el=>el.getBoundingClientRect().top<line);
      if(!now.length)return;
      pending=pending.filter(el=>!now.includes(el));
      now.forEach((el,i)=>{el.style.setProperty("--d",Math.min(i*0.09,0.9).toFixed(2)+"s");el.classList.add("in");});
    }
    let ticking=false;
    const onScroll=()=>{if(!ticking){ticking=true;requestAnimationFrame(()=>{ticking=false;check();});}};
    // wait for a painted frame so the hidden start state exists and transitions run
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      hero.forEach(el=>el.classList.add("in"));check();
      addEventListener("scroll",onScroll,{passive:true});addEventListener("resize",onScroll);
    }));

    const header=document.querySelector("header");
    if(header){
      const onScroll=()=>header.classList.toggle("scrolled",scrollY>8);
      addEventListener("scroll",onScroll,{passive:true});onScroll();
    }
  }

  const start=()=>{try{setup();}catch(e){root.classList.remove("mo");}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
