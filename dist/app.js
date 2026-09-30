const menu=document.querySelector('.menu');const nav=document.querySelector('nav');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');nav.classList.toggle('open',open)});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menu')}));document.querySelectorAll('[data-service]').forEach(a=>a.addEventListener('click',()=>{document.querySelector('#service').value=a.dataset.service}));document.querySelector('#quote-form').addEventListener('submit',e=>{e.preventDefault();const name=document.querySelector('#name').value.trim();const project=document.querySelector('#project').value.trim();if(!name||!project){return}const service=document.querySelector('#service').value;const dimensions=document.querySelector("#dimensions").value.trim();const quantity=document.querySelector("#quantity").value;const deadline=document.querySelector("#deadline").value;const formattedDate=deadline?deadline.split("-").reverse().join("/"):"A combinar";const message=`Olá, Haptos 3D! Meu nome é ${name}.\n\nTenho interesse em: ${service}.\nMedidas aproximadas: ${dimensions||"A definir"}\nQuantidade: ${quantity||"A definir"}\nPrazo desejado: ${formattedDate}\n\nMeu projeto: ${project}`;window.open('https://wa.me/5511932845696?text='+encodeURIComponent(message),'_blank','noopener')});document.querySelector('#year').textContent=new Date().getFullYear();

// Reveal each block once; content remains visible if observers are unavailable.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let revealObserver;
function configureMotion() {
  if (revealObserver) revealObserver.disconnect();
  const blocks = document.querySelectorAll('.section-heading, .services article, .about-copy, .project-notes, .steps article, .quote > div, .quote form, .faq > div');
  blocks.forEach(block => block.classList.remove('reveal-ready', 'is-visible'));
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  blocks.forEach(block => {
    block.classList.add('reveal-ready');
    revealObserver.observe(block);
  });
}
configureMotion();
motionPreference.addEventListener('change', configureMotion);
// Keyboard navigation must never land on an invisible control.
document.addEventListener('focusin', event => {
  const block = event.target.closest('.reveal-ready');
  if (block) block.classList.add('is-visible');
});
