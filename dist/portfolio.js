(() => {
  const config=window.HAPTOS_CONFIG;
  window.haptosClient=config?.url&&config?.key?supabase.createClient(config.url,config.key,{auth:{storageKey:'haptos-admin',storage:sessionStorage,persistSession:true,detectSessionInUrl:true}}):null;
  const grid=document.querySelector('#portfolio-grid');if(!grid)return;
  const message=document.querySelector('#portfolio-message'),more=document.querySelector('#portfolio-more');
  const dialog=document.querySelector('#project-dialog');let offset=0,trigger=null;
  function showProject(project,button){
    trigger=button;
    dialog.querySelector('img').src=haptosClient.storage.from('haptos-portfolio').getPublicUrl(project.image_path).data.publicUrl;
    dialog.querySelector('img').alt=project.title;
    dialog.querySelector('h2').textContent=project.title;
    dialog.querySelector('p').textContent=project.description;
    dialog.showModal();
  }
  dialog.querySelector('button').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  dialog.addEventListener('close',()=>trigger?.focus());
  async function load(){
    more.disabled=true;
    if(!window.haptosClient){message.textContent='Estamos preparando nossa seleção de trabalhos. Converse com a gente para conhecer as possibilidades.';return;}
    try{
      const {data,error}=await haptosClient.from('haptos_portfolio_projects').select('id,title,description,image_path,created_at').eq('published',true).order('created_at',{ascending:false}).order('id').range(offset,offset+8);
      if(error)throw error;
      const items=data.slice(0,8);more.hidden=data.length<=8;
      for(const project of items){
        const article=document.createElement('article');article.className='portfolio-card';
        const button=document.createElement('button');button.type='button';button.className='portfolio-photo';button.setAttribute('aria-label',`Ver projeto: ${project.title}`);
        const img=document.createElement('img');img.src=haptosClient.storage.from('haptos-portfolio').getPublicUrl(project.image_path).data.publicUrl;img.alt=project.title;img.loading='lazy';img.decoding='async';img.width=800;img.height=600;
        const hint=document.createElement('span');hint.textContent='Ver projeto ↗';button.append(img,hint);button.addEventListener('click',()=>showProject(project,button));
        const title=document.createElement('h3');title.textContent=project.title;
        const desc=document.createElement('p');desc.textContent=project.description;
        article.append(button,title,desc);grid.append(article);
      }
      offset+=items.length;message.hidden=offset>0;
      message.textContent='Novos projetos serão apresentados aqui em breve. Tem uma ideia? Vamos conversar.';
    }catch{message.hidden=false;message.textContent='Não foi possível carregar os projetos agora. Tente novamente em instantes.';more.hidden=false;more.textContent='Tentar novamente';}
    finally{more.disabled=false;}
  }
  more.addEventListener('click',load);load();
})();
