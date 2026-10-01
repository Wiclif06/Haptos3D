(() => {
  const config=window.HAPTOS_CONFIG;
  window.haptosClient=config?.url&&config?.key?supabase.createClient(config.url,config.key,{auth:{storageKey:'haptos-admin',storage:sessionStorage,persistSession:true,detectSessionInUrl:true}}):null;
  const grid=document.querySelector('#portfolio-grid');if(!grid)return;
  const message=document.querySelector('#portfolio-message'),more=document.querySelector('#portfolio-more');
  let offset=0;
  const photoUrl=path=>haptosClient.storage.from('haptos-portfolio').getPublicUrl(path).data.publicUrl;
  const projectUrl=project=>"https://haptos3d.com.br/projetos/"+project.id;
  const quoteUrl=project=>'https://wa.me/5511932845696?text='+encodeURIComponent('Olá, Haptos 3D! Vi o projeto “'+project.title+'” no portfólio e quero algo parecido. Podemos conversar sobre um orçamento?\n\nReferência: '+projectUrl(project));
  async function load(){
    more.disabled=true;
    if(!window.haptosClient){message.textContent='Estamos preparando nossa seleção de trabalhos. Converse com a gente para conhecer as possibilidades.';return;}
    try{
      const {data,error}=await haptosClient.from('haptos_portfolio_projects').select('id,title,description,image_path,image_paths,created_at').eq('published',true).order('created_at',{ascending:false}).order('id').range(offset,offset+8);
      if(error)throw error;
      const items=data.slice(0,8);more.hidden=data.length<=8;
      for(const project of items){
        const article=document.createElement('article');article.className='portfolio-card';
        const button=document.createElement('a');button.href=projectUrl(project);button.className='portfolio-photo';button.setAttribute('aria-label',`Ver projeto: ${project.title}`);
        const img=document.createElement('img');img.src=haptosClient.storage.from('haptos-portfolio').getPublicUrl(project.image_path).data.publicUrl;img.alt=project.title;img.loading='lazy';img.decoding='async';img.width=800;img.height=600;
        const hint=document.createElement('span');const count=project.image_paths?.length||1;hint.textContent=count>1?count+' fotos · Ver projeto ↗':'Ver projeto ↗';button.append(img,hint);
        const title=document.createElement('h3');const titleLink=document.createElement('a');titleLink.href=projectUrl(project);titleLink.textContent=project.title;title.append(titleLink);
        const desc=document.createElement('p');desc.textContent=project.description;
        const quote=document.createElement('a');quote.className='project-quote-link';quote.textContent='Quero algo parecido ↗';quote.href=quoteUrl(project);quote.target='_blank';quote.rel='noopener';
        article.append(button,title,desc,quote);grid.append(article);
      }
      offset+=items.length;message.hidden=offset>0;
      message.textContent='Novos projetos serão apresentados aqui em breve. Tem uma ideia? Vamos conversar.';
    }catch{message.hidden=false;message.textContent='Não foi possível carregar os projetos agora. Tente novamente em instantes.';more.hidden=false;more.textContent='Tentar novamente';}
    finally{more.disabled=false;}
  }
  more.addEventListener('click',load);load();
})();
