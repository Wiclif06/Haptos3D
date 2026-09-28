(() => {
  const scene = document.querySelector('.print-scene');
  if (!scene) return;
  const clip = document.querySelector('#printed-height');
  const head = document.querySelector('#print-head');
  const bar = document.querySelector('#print-progress-bar');
  const percent = document.querySelector('#print-percent');
  const status = document.querySelector('#print-status');
  const toggle = document.querySelector('#print-toggle');
  const replay = document.querySelector('#print-replay');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 14000;
  let elapsed = 0, last = null, frame = null, paused = false, inView = true;
  // Horizontal sections of the emblem, matching the SVG polygons.
  function spansAt(y) {
    const polygons = [
      [[150,208],[188,187],[188,267],[239,296],[239,253],[276,274],[276,398],[239,377],[239,337],[188,308],[188,353],[150,331]],
      [[239,145],[275,124],[306,142],[306,268],[276,285],[239,263]],
      [[306,142],[328,129],[390,165],[390,216],[368,229],[306,193]],
      [[306,211],[328,198],[390,234],[390,285],[368,298],[306,262]],
      [[306,280],[328,267],[390,303],[390,354],[368,367],[306,403]]
    ];
    const spans=[];
    polygons.forEach(poly=>{
      const xs=[];
      poly.forEach(([x1,y1],i)=>{
        const [x2,y2]=poly[(i+1)%poly.length];
        if((y1<=y&&y2>y)||(y2<=y&&y1>y)) xs.push(x1+(y-y1)*(x2-x1)/(y2-y1));
      });
      xs.sort((a,b)=>a-b);
      for(let i=0;i+1<xs.length;i+=2)spans.push([xs[i],xs[i+1]]);
    });
    return spans.sort((a,b)=>a[0]-b[0]);
  }
  function render() {
    const progress=Math.min(elapsed/duration,1);
    const layer=Math.min(Math.floor(progress*94),93);
    const y=402-layer*3;
    const spans=spansAt(y);
    const lengths=spans.map(s=>s[1]-s[0]);
    const total=lengths.reduce((a,b)=>a+b,0);
    const sweep=(progress*94)%1;
    let distance=(layer%2?sweep:1-sweep)*total,x=280;
    for(let i=0;i<spans.length;i++){
      if(distance<=lengths[i]){x=spans[i][0]+distance;break;}
      distance-=lengths[i];
    }
    clip.setAttribute('y',progress===1?'120':String(y));
    clip.setAttribute('height',String(420-(progress===1?120:y)));
    head.setAttribute('transform',`translate(${x} ${y})`);
    head.setAttribute('opacity',progress===1||!spans.length?'0':'1');
    bar.style.width=`${progress*100}%`;
    percent.textContent=`${Math.floor(progress*100)}%`;
    status.textContent=progress===1?'Impressão concluída.':paused?'Impressão pausada.':'Imprimindo a marca Haptos…';
    toggle.hidden=progress===1;
    toggle.textContent=paused?'Continuar':'Pausar';
    replay.hidden=progress<1;
  }
  function tick(now){
    frame=null;
    if(last!==null)elapsed=Math.min(duration,elapsed+Math.min(now-last,80));
    last=now;render();schedule();
  }
  function schedule(){
    if(frame!==null)return;
    if(paused||!inView||document.hidden||elapsed>=duration){last=null;return;}
    frame=requestAnimationFrame(tick);
  }
  function stop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;}
  toggle.addEventListener('click',()=>{paused=!paused;stop();render();schedule();});
  replay.addEventListener('click',()=>{elapsed=0;paused=false;render();toggle.focus();schedule();});
  document.addEventListener('visibilitychange',()=>{stop();schedule();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{
    inView=entries[0].isIntersecting;stop();schedule();
  },{threshold:.1}).observe(scene);
  function setPreference(){stop();elapsed=reduced.matches?duration:0;paused=false;render();schedule();}
  reduced.addEventListener('change',setPreference);
  setPreference();
})();
