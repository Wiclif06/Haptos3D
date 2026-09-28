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
  // Use the displayed vector to calculate the print head path.
  const artwork=new Image();
  artwork.onload=()=>{
    const canvas=document.createElement('canvas');canvas.width=85;canvas.height=72;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(artwork,0,0,85,72);
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
  artwork.src="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2085%2072%22%20width%3D%22340%22%20height%3D%22288%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22orange%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%23ff962e%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23f2530a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Cg%20fill%3D%22url(%23orange)%22%3E%3Cpath%20d%3D%22M42%204%20L49%200%20L81%2017%20L81%2031%20L59%2020%20L59%208%20L58%208%20L58%2037%20L42%2028%20Z%22%2F%3E%3Cpath%20d%3D%22M23%2011%20L23%2028%20L50%2043%20L50%2072%20L34%2064%20L34%2051%20L23%2045%20L23%2061%20L5%2052%20L5%2020%20Z%22%2F%3E%3Cpath%20d%3D%22M61%2027%20L81%2037%20L81%2050%20L61%2040%20Z%22%2F%3E%3Cpath%20d%3D%22M61%2046%20L81%2057%20L61%2067%20Z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";
})();
