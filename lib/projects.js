const BASE='https://haptos3d.com.br';
const API='https://cfrlrqjgjkewruzyxuns.supabase.co';
const KEY='sb_publishable_sSbOW5StpVy45nKy9XEZnA_jh1nPSfu';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const projectPath=p=>'/projetos/'+p.id;
const photo=p=>API+'/storage/v1/object/public/haptos-portfolio/'+String(p).split('/').map(encodeURIComponent).join('/');
async function query(extra){const u=new URL(API+'/rest/v1/haptos_portfolio_projects');u.search=new URLSearchParams({select:'id,title,description,image_path,image_paths,created_at',published:'eq.true',...extra});const r=await fetch(u,{headers:{apikey:KEY},signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Portfolio unavailable');return r.json();}
async function all(){let rows=[];for(let offset=0;;offset+=500){const page=await query({order:'id.asc',limit:'500',offset:String(offset)});rows.push(...page);if(page.length<500)return rows;}}
const shell=(title,head,body)=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/style.css?v=gallery-quote-13"><link rel="stylesheet" href="/seo.css?v=1"><link rel="stylesheet" href="/project.css?v=1">${head}</head><body><header><a class="brand" href="/"><img src="/assets/logo.png" width="195" height="36" alt="Haptos 3D"></a><nav aria-label="Navegação principal"><a href="/#solucoes">Soluções</a><a href="/sobre.html">A Haptos</a><a href="/portfolio.html">Portfólio</a></nav></header><main>${body}</main><footer><a href="/portfolio.html">← Voltar ao portfólio</a><a href="/#orcamento">Solicitar orçamento ↗</a></footer></body></html>`;
module.exports={BASE,escape,projectPath,photo,query,all,shell};
