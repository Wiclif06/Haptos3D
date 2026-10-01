(() => {
  const client=window.haptosClient,$=s=>document.querySelector(s),status=$('#admin-status');
  let projects=[],editing=null,photos=[],saving=false,recovery=false;
  let sessionRevision=0;
  function showPanel(id){
    for(const panelId of ['login-panel','password-panel','dashboard']){
      const panel=$('#'+panelId),visible=panelId===id;
      panel.hidden=!visible;
      panel.style.display=visible?'':'none';
    }
  }
  const message=text=>{status.textContent=text};
  const failure=error=>error?.status===401||error?.code==='PGRST301'?'Sua sessão expirou. Entre novamente.':'Não foi possível concluir. Verifique sua conexão e tente novamente.';
  function photoUrl(path){return client.storage.from('haptos-portfolio').getPublicUrl(path).data.publicUrl;}
  function renderPhotos(){
    const grid=$('#photo-previews');grid.replaceChildren();
    $('#photo-count').textContent=photos.length+' de 8 fotos';
    photos.forEach((photo,index)=>{
      const card=document.createElement('div');card.className='photo-selection';
      const img=document.createElement('img');img.src=photo.url||photoUrl(photo.path);img.alt='Foto '+(index+1);img.width=160;img.height=120;
      const label=document.createElement('span');label.textContent=index===0?'Capa':'Foto '+(index+1);
      const remove=document.createElement('button');remove.type='button';remove.className='outline-button';remove.textContent='Remover';remove.setAttribute('aria-label','Remover foto '+(index+1));remove.addEventListener('click',()=>{if(saving)return;if(photo.url)URL.revokeObjectURL(photo.url);photos.splice(index,1);renderPhotos();});
      card.append(img,label,remove);grid.append(card);
    });
  }
  function resetEditor(){editing=null;$('#project-form').reset();$('#project-id').value='';$('#editor-title').textContent='Novo projeto';$('#save-project').textContent='Publicar projeto';$('#cancel-edit').hidden=true;photos.forEach(p=>{if(p.url)URL.revokeObjectURL(p.url)});photos=[];renderPhotos();}
  async function loadProjects(){
    const {data,error}=await client.from('haptos_portfolio_projects').select('*').order('created_at',{ascending:false});
    if(error)throw error;projects=data;$('#admin-projects').replaceChildren();$('#admin-empty').hidden=data.length>0;$('#admin-empty').textContent='Seu primeiro projeto começa aqui. Preencha os campos ao lado e envie uma foto.';
    for(const item of data){
      const card=document.createElement('article');card.className='admin-card';
      const img=document.createElement('img');img.alt=item.title;img.loading='lazy';img.src=client.storage.from('haptos-portfolio').getPublicUrl(item.image_path).data.publicUrl;
      const body=document.createElement('div'),title=document.createElement('h3'),state=document.createElement('p'),actions=document.createElement('div');title.textContent=item.title;state.textContent=(item.category||'Outros')+' · '+(item.published?'Publicado no site':'Oculto do site');actions.className='admin-card-actions';
      const edit=document.createElement('button');edit.type='button';edit.className='outline-button';edit.textContent='Editar';edit.addEventListener('click',()=>{
        if(saving)return;resetEditor();editing=item;$('#project-id').value=item.id;$('#project-title').value=item.title;$('#project-description').value=item.description;$('#project-category').value=item.category||'Outros';$('#project-published').checked=item.published;photos=(item.image_paths?.length?item.image_paths:[item.image_path]).map(path=>({path}));renderPhotos();$('#editor-title').textContent='Editar projeto';$('#save-project').textContent='Salvar alterações';$('#cancel-edit').hidden=false;$('#project-title').focus();
      });
      const visibility=document.createElement('button');visibility.type='button';visibility.className='outline-button';visibility.textContent=item.published?'Ocultar':'Publicar';visibility.addEventListener('click',async()=>{if(saving)return;visibility.disabled=true;try{const {data,error}=await client.from('haptos_portfolio_projects').update({published:!item.published}).eq('id',item.id).select('id').single();if(error||!data)throw error||new Error();await loadProjects();message(item.published?'Projeto ocultado. Você pode publicá-lo novamente quando quiser.':'Projeto publicado.');}catch(error){message(failure(error));}finally{visibility.disabled=false;}});
      const remove=document.createElement('button');remove.type='button';remove.className='outline-button';remove.textContent='Excluir';remove.style.color='#ff9275';remove.setAttribute('aria-label','Excluir projeto '+item.title);
      remove.addEventListener('click',async()=>{
        if(saving||!window.confirm('Excluir “'+item.title+'” e suas fotos definitivamente? Esta ação não pode ser desfeita.'))return;
        saving=true;$('#project-fields').disabled=true;remove.disabled=true;remove.textContent='Excluindo…';let deleted=false;
        try{
          const {data,error}=await client.from('haptos_portfolio_projects').delete().eq('id',item.id).select('id,image_path,image_paths').single();
          if(error||!data)throw error||new Error();deleted=true;
          if(editing?.id===item.id)resetEditor();card.remove();
          const paths=[...new Set([data.image_path,...(data.image_paths||[])].filter(Boolean))];
          const cleanup=paths.length?await client.storage.from('haptos-portfolio').remove(paths):{};
          await loadProjects();
          message(cleanup.error?'Projeto excluído. Não foi possível remover as fotos do armazenamento.':'Projeto e fotos excluídos.');
        }catch(error){message(deleted?'Projeto excluído. Não foi possível concluir a limpeza ou atualizar a lista. Atualize a página.':failure(error));}
        finally{saving=false;$('#project-fields').disabled=false;remove.disabled=false;remove.textContent='Excluir';}
      });
      actions.append(edit,visibility,remove);body.append(title,state,actions);card.append(img,body);$('#admin-projects').append(card);
    }
  }
  async function applySession(session){
    const revision=++sessionRevision;
    showPanel(session?null:'login-panel');
    if(!session){recovery=false;return;}
    const {data,error}=await client.from('haptos_portfolio_admins').select('user_id').eq('user_id',session.user.id).maybeSingle();
    if(revision!==sessionRevision)return;
    if(error||!data){await client.auth.signOut();message('Esta conta não tem acesso ao portfólio.');return;}
    if(recovery){showPanel('password-panel');return;}
    showPanel('dashboard');
    try{await loadProjects();}catch(error){message(failure(error));}
  }
  if(!client){message('O painel está sendo configurado. O acesso será liberado assim que a configuração for concluída.');$('#login-form button').disabled=true;return;}
  client.auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY')recovery=true;
    if(['INITIAL_SESSION','SIGNED_IN','SIGNED_OUT','PASSWORD_RECOVERY'].includes(event))setTimeout(()=>applySession(session).catch(()=>message('Não foi possível verificar seu acesso. Atualize a página.')),0);
  });
  $('#login-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;message('Entrando…');try{if($('#username').value.trim().toLowerCase()!=='haptos3d'){message('Usuário ou senha inválidos.');return;}if(!window.HAPTOS_CONFIG.loginEmail){message('O acesso administrativo ainda está sendo configurado.');return;}const {error}=await client.auth.signInWithPassword({email:window.HAPTOS_CONFIG.loginEmail,password:$('#password').value});if(error){message('Usuário ou senha inválidos, ou acesso temporariamente indisponível.');return;}$('#password').value='';message('');}catch{message('Não foi possível conectar. Tente novamente.');}finally{button.disabled=false;}});
  $('#logout').addEventListener('click',async()=>{const {error}=await client.auth.signOut();if(error){message('Não foi possível sair. Tente novamente.');return;}resetEditor();$('#admin-projects').replaceChildren();message('Você saiu da área administrativa.');});
  $('#password-form').addEventListener('submit',async e=>{e.preventDefault();const password=$('#new-password').value;if(password!==$('#confirm-password').value){message('As senhas precisam ser iguais.');return;}e.submitter.disabled=true;try{const {error}=await client.auth.updateUser({password});if(error)throw error;recovery=false;$('#password-form').reset();message('Senha salva.');const {data}=await client.auth.getSession();await applySession(data.session);}catch{message('Não foi possível definir a senha. Verifique a validade do link e tente novamente.');}finally{e.submitter.disabled=false;}});
  $('#cancel-edit').addEventListener('click',resetEditor);
  $('#project-photo').addEventListener('change',()=>{
    const files=Array.from($('#project-photo').files);$('#project-photo').value='';
    if(photos.length+files.length>8){message('Cada projeto pode ter até 8 fotos. Remova uma foto antes de adicionar outra.');return;}
    if(files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>10*1024*1024)){message('Escolha fotos JPG, PNG ou WebP de até 10 MB cada.');return;}
    photos.push(...files.map(file=>({file,url:URL.createObjectURL(file)})));renderPhotos();message('');
  });
  async function optimize(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('photo');
    const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>40000000){bitmap.close();throw new Error('photo');}
    const ratio=Math.min(1,1920/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.86));if(!blob||blob.size>5*1024*1024)throw new Error('photo');return blob;
  }
  $('#project-form').addEventListener('submit',async e=>{
    e.preventDefault();if(saving)return;
    const title=$('#project-title').value.trim(),description=$('#project-description').value.trim();
    if(!title||!description){message('Preencha o título e a descrição.');return;}
    if(!photos.length){message('Adicione pelo menos uma foto ao projeto.');return;}
    saving=true;$('#project-fields').disabled=true;message('Preparando fotos…');let uploaded=[],committed=false;
    const previousPaths=editing?(editing.image_paths?.length?editing.image_paths:[editing.image_path]):[];
    try{
      const paths=[];
      for(const [index,photo] of photos.entries()){
        if(photo.path){paths.push(photo.path);continue;}
        message('Enviando foto '+(index+1)+' de '+photos.length+'…');
        const blob=await optimize(photo.file),path=crypto.randomUUID()+'.webp';
        const {error}=await client.storage.from('haptos-portfolio').upload(path,blob,{contentType:blob.type,cacheControl:'31536000',upsert:false});
        if(error)throw error;uploaded.push(path);paths.push(path);
      }
      const value={title,description,category:$('#project-category').value,image_path:paths[0],image_paths:paths,published:$('#project-published').checked};
      const query=editing?client.from('haptos_portfolio_projects').update(value).eq('id',editing.id):client.from('haptos_portfolio_projects').insert(value);
      const {data,error}=await query.select('id').single();if(error||!data)throw error||new Error();committed=true;
      const removed=previousPaths.filter(path=>!paths.includes(path));
      if(removed.length)await client.storage.from('haptos-portfolio').remove(removed);
      resetEditor();await loadProjects();message(value.published?'Projeto salvo e publicado no site.':'Projeto salvo e oculto do site.');
    }catch(error){
      if(uploaded.length&&!committed)await client.storage.from('haptos-portfolio').remove(uploaded);
      message(committed?'Projeto salvo. Atualize a página para recarregar a lista.':error?.message==='photo'?'Não foi possível processar uma das fotos. Use JPG, PNG ou WebP de até 10 MB e no máximo 40 megapixels.':failure(error));
    }finally{saving=false;$('#project-fields').disabled=false;}
  });
})();
