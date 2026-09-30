(() => {
  const client=window.haptosClient,$=s=>document.querySelector(s),status=$('#admin-status');
  let projects=[],editing=null,previewUrl=null,recovery=false;
  const message=text=>{status.textContent=text};
  const failure=error=>error?.status===401||error?.code==='PGRST301'?'Sua sessão expirou. Entre novamente.':'Não foi possível concluir. Verifique sua conexão e tente novamente.';
  function resetEditor(){editing=null;$('#project-form').reset();$('#project-id').value='';$('#editor-title').textContent='Novo projeto';$('#save-project').textContent='Publicar projeto';$('#cancel-edit').hidden=true;$('#photo-preview').hidden=true;if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}}
  async function loadProjects(){
    const {data,error}=await client.from('haptos_portfolio_projects').select('*').order('created_at',{ascending:false});
    if(error)throw error;projects=data;$('#admin-projects').replaceChildren();$('#admin-empty').hidden=data.length>0;$('#admin-empty').textContent='Seu primeiro projeto começa aqui. Preencha os campos ao lado e envie uma foto.';
    for(const item of data){
      const card=document.createElement('article');card.className='admin-card';
      const img=document.createElement('img');img.alt=item.title;img.loading='lazy';img.src=client.storage.from('haptos-portfolio').getPublicUrl(item.image_path).data.publicUrl;
      const body=document.createElement('div'),title=document.createElement('h3'),state=document.createElement('p'),actions=document.createElement('div');title.textContent=item.title;state.textContent=item.published?'Publicado no site':'Oculto do site';actions.className='admin-card-actions';
      const edit=document.createElement('button');edit.type='button';edit.className='outline-button';edit.textContent='Editar';edit.addEventListener('click',()=>{
        resetEditor();editing=item;$('#project-id').value=item.id;$('#project-title').value=item.title;$('#project-description').value=item.description;$('#project-published').checked=item.published;$('#photo-preview').src=img.src;$('#photo-preview').hidden=false;$('#editor-title').textContent='Editar projeto';$('#save-project').textContent='Salvar alterações';$('#cancel-edit').hidden=false;$('#project-title').focus();
      });
      const visibility=document.createElement('button');visibility.type='button';visibility.className='outline-button';visibility.textContent=item.published?'Ocultar':'Publicar';visibility.addEventListener('click',async()=>{visibility.disabled=true;try{const {data,error}=await client.from('haptos_portfolio_projects').update({published:!item.published}).eq('id',item.id).select('id').single();if(error||!data)throw error||new Error();await loadProjects();message(item.published?'Projeto ocultado. Você pode publicá-lo novamente quando quiser.':'Projeto publicado.');}catch(error){message(failure(error));}finally{visibility.disabled=false;}});
      actions.append(edit,visibility);body.append(title,state,actions);card.append(img,body);$('#admin-projects').append(card);
    }
  }
  async function applySession(session){
    $('#dashboard').hidden=true;$('#login-panel').hidden=!!session;$('#password-panel').hidden=true;
    if(!session)return;
    const {data,error}=await client.from('haptos_portfolio_admins').select('user_id').eq('user_id',session.user.id).maybeSingle();
    if(error||!data){await client.auth.signOut();message('Esta conta não tem acesso ao portfólio.');return;}
    if(recovery){$('#password-panel').hidden=false;return;}
    $('#dashboard').hidden=false;
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
  $('#project-photo').addEventListener('change',()=>{const file=$('#project-photo').files[0];if(previewUrl)URL.revokeObjectURL(previewUrl);if(!file){$('#photo-preview').hidden=true;return;}if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){message('Escolha uma foto JPG, PNG ou WebP de até 10 MB.');$('#project-photo').value='';$('#photo-preview').hidden=true;return;}previewUrl=URL.createObjectURL(file);$('#photo-preview').src=previewUrl;$('#photo-preview').hidden=false;message('');});
  async function optimize(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('photo');
    const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>40000000){bitmap.close();throw new Error('photo');}
    const ratio=Math.min(1,1920/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.86));if(!blob||blob.size>5*1024*1024)throw new Error('photo');return blob;
  }
  $('#project-form').addEventListener('submit',async e=>{
    e.preventDefault();const button=$('#save-project'),file=$('#project-photo').files[0],title=$('#project-title').value.trim(),description=$('#project-description').value.trim();
    if(!title||!description){message('Preencha o título e a descrição.');return;}if(!editing&&!file){message('Selecione uma foto para o projeto.');return;}
    button.disabled=true;message('Salvando projeto…');let uploaded=null,committed=false;
    try{
      let imagePath=editing?.image_path;
      if(file){const blob=await optimize(file);imagePath=crypto.randomUUID()+'.webp';const {error}=await client.storage.from('haptos-portfolio').upload(imagePath,blob,{contentType:blob.type,cacheControl:'31536000',upsert:false});if(error)throw error;uploaded=imagePath;}
      const value={title,description,image_path:imagePath,published:$('#project-published').checked};
      const query=editing?client.from('haptos_portfolio_projects').update(value).eq('id',editing.id):client.from('haptos_portfolio_projects').insert(value);
      const {data,error}=await query.select('id').single();if(error||!data)throw error||new Error();committed=true;resetEditor();await loadProjects();message(value.published?'Projeto salvo e publicado no site.':'Projeto salvo e oculto do site.');
    }catch(error){if(uploaded&&!committed)await client.storage.from('haptos-portfolio').remove([uploaded]);message(committed?'Projeto salvo. Atualize a página para recarregar a lista.':error?.message==='photo'?'Não foi possível processar esta foto. Use JPG, PNG ou WebP de até 10 MB e no máximo 40 megapixels.':failure(error));}
    finally{button.disabled=false;}
  });
})();
