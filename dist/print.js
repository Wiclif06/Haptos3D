(() => {
  const scene=document.querySelector('.print-scene'); if(!scene)return;
  const clip=document.querySelector('#printed-height'),row=document.querySelector('#printing-row');
  const gantry=document.querySelector('#print-gantry'),cable=document.querySelector('#print-cable'),tube=document.querySelector('#print-tube');
  const head=document.querySelector('#print-head'),bar=document.querySelector('#print-progress-bar');
  const percent=document.querySelector('#print-percent'),status=document.querySelector('#print-status');
  const toggle=document.querySelector('#print-toggle'),replay=document.querySelector('#print-replay');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const scale=280/85,top=150,bottom=top+72*scale,duration=60000;
  let elapsed=0,last=null,frame=null,paused=false,inView=true,rows=null;
  // Trace the pixels of the supplied Haptos artwork, not an invented shape.
  const artwork=new Image();
  artwork.onload=()=>{
    const canvas=document.createElement('canvas');canvas.width=85;canvas.height=72;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(artwork,0,0);
    const pixels=ctx.getImageData(0,0,85,72).data;
    rows=Array.from({length:72},(_,y)=>{
      const spans=[];let start=null;
      for(let x=0;x<=85;x++){
        const i=(y*85+x)*4;
        const ink=x<85&&pixels[i]>65&&pixels[i]>pixels[i+1]*1.25;
        if(ink&&start===null)start=x;
        if(!ink&&start!==null){spans.push([140+start*scale,140+x*scale]);start=null;}
      }return spans;
    });resetPreference();
  };
  artwork.onerror=()=>{elapsed=duration;render();replay.hidden=true;};
  function render(){
    const p=Math.min(elapsed/duration,1),completed=Math.min(Math.floor(p*72),72),layer=Math.min(completed,71);
    const y=bottom-(layer+1)*scale,sweep=p===1?1:(p*72)%1;
    const spans=rows?rows[71-layer]:[];
    // A full horizontal pass includes travel across empty spaces, without teleporting.
    const left=spans.length?spans[0][0]:270,right=spans.length?spans[spans.length-1][1]:290;
    const phase=Math.min(sweep/.85,1),eased=(1-Math.cos(phase*Math.PI))/2;
    const x=p===1?445:left+(right-left)*(layer%2?1-eased:eased);
    const lift=Math.max(0,(sweep-.85)/.15)*scale;
    const headY=p===1?130:y+scale/2-lift;
    // Completed rows accumulate permanently. The final frame uses the same mask.
    clip.setAttribute('y',bottom-completed*scale);clip.setAttribute('height',completed*scale);
    row.setAttribute('y',y);row.setAttribute('height',scale+.05);row.setAttribute('x',layer%2?x:140);row.setAttribute('width',p===1?0:layer%2?420-x:x-140);
    head.setAttribute('transform',`translate(${x} ${headY})`);head.setAttribute('opacity','1');
    gantry.setAttribute('transform',`translate(0 ${headY-68})`);
    const cablePath=`M445 75 Q${x+45} ${Math.max(80,headY-135)} ${x} ${headY-94}`;
    cable.setAttribute('d',cablePath);tube.setAttribute('d',cablePath);
    bar.style.width=`${p*100}%`;percent.textContent=`${Math.floor(p*100)}%`;
    status.textContent=p===1?'Logo Haptos concluída.':paused?'Impressão pausada.':'Imprimindo a logo Haptos…';
    toggle.hidden=p===1;toggle.textContent=paused?'Continuar':'Pausar';replay.hidden=p<1;
  }
  function tick(now){frame=null;if(last!==null)elapsed=Math.min(duration,elapsed+now-last);last=now;render();schedule();}
  function schedule(){if(frame!==null)return;if(paused||!inView||document.hidden||elapsed>=duration){last=null;return;}frame=requestAnimationFrame(tick);}
  function stop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;}
  function resetPreference(){stop();elapsed=reduced.matches?duration:0;paused=false;render();schedule();}
  toggle.addEventListener('click',()=>{paused=!paused;stop();render();schedule();});
  replay.addEventListener('click',()=>{if(!rows)return;elapsed=0;paused=false;render();toggle.focus();schedule();});
  document.addEventListener('visibilitychange',()=>{stop();schedule();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;stop();schedule();},{threshold:.1}).observe(scene);
  reduced.addEventListener('change',resetPreference);
  // Do not flash a finished logo before loading and restarting the print.
  clip.setAttribute('height','0');row.setAttribute('width','0');head.setAttribute('opacity','0');
  bar.style.width='0%';percent.textContent='0%';toggle.hidden=true;replay.hidden=true;
  artwork.src='assets/logo.png';
})();
