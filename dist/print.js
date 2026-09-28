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
  artwork.src="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2085%2072%22%20width%3D%22340%22%20height%3D%22288%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22orange%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%23ff962e%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23f2530a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Cg%20fill%3D%22url(%23orange)%22%3E%3Cpath%20d%3D%22M47%201L52%201L52%202L54%202L54%204L56%203L56%204L59%205L58%208L60%207L60%208L63%208L63%209L68%209L68%2011L70%2010L70%2011L74%2012L75%2015L78%2014L79%2017L81%2017L81%2031L78%2031L78%2030L76%2030L76%2029L74%2029L74%2028L72%2028L72%2027L70%2027L70%2026L68%2026L68%2025L66%2025L66%2024L64%2024L62%2022L59%2021L59%209L58%209L58%2036L56%2037L53%2034L47%2032L46%2030L44%2030L42%2028L42%204L44%202L47%202Z%22%2F%3E%3Cpath%20d%3D%22M21%2011L23%2012L23%2028L28%2030L29%2032L35%2034L36%2036L44%2039L45%2041L49%2042L49%2044L50%2044L49%2045L50%2046L50%2048L49%2048L49%2060L50%2060L50%2070L49%2070L49%2072L45%2072L42%2069L34%2066L34%2057L34%2051L32%2049L29%2049L27%2046L24%2046L24%2045L23%2045L23%2060L22%2061L18%2060L18%2059L10%2056L9%2054L5%2053L5%2020L8%2019L9%2017L13%2016L13%2015L15%2016L15%2014L17%2014L17%2013L19%2013Z%22%2F%3E%3Cpath%20d%3D%22M62%2028L65%2028L65%2029L69%2030L70%2032L72%2032L72%2033L74%2033L74%2034L76%2034L76%2035L81%2037L81%2050L80%2050L72%2047L71%2045L69%2045L67%2043L64%2043L63%2041L61%2041L61%2029Z%22%2F%3E%3Cpath%20d%3D%22M61%2046L63%2046L64%2048L67%2048L70%2051L73%2051L74%2053L76%2053L78%2055L81%2055L81%2058L76%2060L76%2061L74%2061L74%2062L72%2062L72%2063L70%2063L68%2065L65%2065L63%2067L60%2066L61%2065L61%2055L60%2055L60%2053L61%2053Z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";
})();
