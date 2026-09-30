(() => {
  const menu=document.querySelector('.menu'),nav=document.querySelector('nav');
  function close(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menu');nav.classList.remove('open');}
  menu.addEventListener('click',()=>{if(menu.getAttribute('aria-expanded')==='true'){close();return;}menu.setAttribute('aria-expanded','true');menu.setAttribute('aria-label','Fechar menu');nav.classList.add('open');});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){close();menu.focus();}});
})();
