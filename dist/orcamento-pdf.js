// Embedded fonts keep the proposal identical on every device.
window.generateHaptosPDF=async function(q){
  const {PDFDocument,rgb}=PDFLib,{currency,totals}=HaptosQuote;
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
  async function asset(path){const r=await fetch(path);if(!r.ok)throw Error('Não foi possível carregar o visual do PDF. Confira sua conexão.');return r.arrayBuffer();}
  const [fontBytes,boldBytes,logoBytes]=await Promise.all([asset('/assets/fonts/DejaVuSans.ttf'),asset('/assets/fonts/DejaVuSans-Bold.ttf'),asset('/assets/logo.png')]);
  const regular=await pdf.embedFont(fontBytes,{subset:true}),bold=await pdf.embedFont(boldBytes,{subset:true}),logo=await pdf.embedPng(logoBytes);
  const editorial=await pdf.embedFont(await asset('/assets/fonts/DejaVuSerif.ttf'),{subset:true}),italic=editorial;
  const orange=rgb(1,.396,.039),ink=rgb(.09,.09,.09),muted=rgb(.42,.43,.44),line=rgb(.85,.86,.86),pale=rgb(.975,.966,.944),warm=rgb(1,.946,.904),white=rgb(1,1,1);
  const sum=totals(q),W=595.28,H=841.89,M=38,C=W-M*2,BOTTOM=58;let page,y;
  const clean=s=>String(s??'').normalize('NFC').replace(/[\u2010-\u2015]/g,'-').replace(/[^\u0020-\u007e\u00a0-\u024f\n]/g,'');
  const text=(s,x,yy,size=9,font=regular,color=ink)=>page.drawText(clean(s),{x,y:yy,size,font,color});
  const right=(s,x,yy,size=9,font=regular,color=ink)=>text(s,x-font.widthOfTextAtSize(clean(s),size),yy,size,font,color);
  function wrap(value,width,size=9,font=regular){const lines=[];for(const para of clean(value).split('\n')){let row='';for(const word of para.split(/\s+/).filter(Boolean)){let fragments=[word];if(font.widthOfTextAtSize(word,size)>width){fragments=[];let part='';for(const char of word){if(font.widthOfTextAtSize(part+char,size)>width){fragments.push(part);part='';}part+=char;}if(part)fragments.push(part);}for(const part of fragments){const next=row?row+' '+part:part;if(font.widthOfTextAtSize(next,size)>width){if(row)lines.push(row);row=part;}else row=next;}}if(row)lines.push(row);}return lines;}
  function drawLines(lines,x,top,size=9,font=regular,color=ink,leading=13){lines.forEach((s,i)=>text(s,x,top-i*leading,size,font,color));return lines.length*leading;}
  function rule(yy){page.drawLine({start:{x:M,y:yy},end:{x:W-M,y:yy},thickness:.65,color:line});}
  function newPage(){page=pdf.addPage([W,H]);page.drawRectangle({x:0,y:0,width:W,height:H,color:pale});page.drawRectangle({x:0,y:H-78,width:W,height:78,color:ink});const d=logo.scaleToFit(148,30);page.drawImage(logo,{x:M,y:H-51,width:d.width,height:d.height});right('PROPOSTA COMERCIAL',W-M,H-32,7,bold,white);const n=wrap(q.number,240,7);n.forEach((line,i)=>right(line,W-M,H-47-i*10,7,regular,rgb(.7,.7,.7)));y=H-108;}
  function ensure(height){if(y-height<BOTTOM)newPage();}
  function tableHeader(){ensure(32);page.drawLine({start:{x:M,y},end:{x:W-M,y},thickness:1.4,color:ink});text('ESPECIFICAÇÃO',M+12,y-19,6.5,bold,muted);right('QTD.',381,y-19,6.5,bold,muted);right('UNITÁRIO',459,y-19,6.5,bold,muted);right('VALOR',W-M-10,y-19,6.5,bold,muted);y-=30;rule(y);}
  // A three-part proposal: brand, project study and commercial terms.
  const companyDefault='A Haptos 3D transforma ideias em peças por meio da impressão 3D sob medida. Desenvolvemos peças funcionais, protótipos e objetos personalizados, partindo do uso e dos detalhes de cada projeto. Material, medidas, acabamento e prazo são alinhados com você antes da produção.';
  function fitted(value,x,top,width,height,size,font=regular,color=ink){let lines=wrap(value,width,size,font);while(lines.length*size*1.4>height&&size>6.5){size-=.5;lines=wrap(value,width,size,font);}drawLines(lines,x,top,size,font,color,size*1.4);}
  function label(value,x,yy,color=muted){text(value,x,yy,7,bold,color);}
  // Opening page uses a restrained editorial hierarchy and a warm paper tone.
  newPage();
  label('01 / APRESENTAÇÃO',M,724,orange);
  text('Proposta',M,653,60,editorial);
  text('sob medida.',M,588,56,italic,orange);
  fitted(q.projectTitle||q.items[0].name,M,549,C,48,13,bold,muted);
  page.drawRectangle({x:M,y:373,width:C,height:120,color:ink});
  page.drawRectangle({x:M,y:373,width:3,height:120,color:orange});
  label('PREPARADA EXCLUSIVAMENTE PARA',M+23,471,rgb(.72,.72,.72));
  fitted(q.customer,M+23,445,C-46,64,20,bold,white);
  label('A HAPTOS 3D',M,334,orange);
  text('Ideias que',M,306,24,editorial);text('ganham forma.',M,278,21,italic);
  fitted(q.companyAbout||companyDefault,M+185,334,C-185,185,10,regular,muted);
  rule(130);
  const steps=[['01','Entender','O uso e os detalhes.'],['02','Personalizar','Material, forma e acabamento.'],['03','Produzir','Seu projeto ganha forma.']];
  steps.forEach(([n,title,sub],i)=>{const x=M+i*177;text(n,x,110,8,bold,orange);text(title,x+21,110,9,bold);drawLines(wrap(sub,155,7.5),x,91,7.5,regular,muted,11);});
  // Preserve the complete uploaded image in a large presentation area.
  newPage();label('02 / ESTUDO DO PROJETO',M,724,orange);
  text('Uma ideia, em forma.',M,681,35,editorial);
  fitted(q.projectTitle||q.items[0].name,M,651,C,45,12,bold,muted);
  page.drawRectangle({x:M,y:270,width:C,height:330,color:white});
  const heroItem=q.items.find(item=>item.photo);
  if(heroItem){const img=await pdf.embedJpg(heroItem.photo),d=img.scaleToFit(C-20,310);page.drawImage(img,{x:M+(C-d.width)/2,y:270+(330-d.height)/2,width:d.width,height:d.height});}
  else {text('O início de uma nova criação.',M+25,439,25,editorial,muted);text('Adicione a imagem de referência ao projeto.',M+25,414,9,regular,muted);}
  label('PRÉVIA DO PROJETO',M,253);right(heroItem?'Referência visual para aprovação':'Imagem a definir',W-M,253,7,regular,muted);
  const specs=[['MATERIAL',q.material],['CORES',q.colors],['ACABAMENTO',q.finish],['MEDIDAS',q.dimensions]];
  specs.forEach(([name,value],i)=>{const x=M+(i%2)*270,top=224-Math.floor(i/2)*74;page.drawLine({start:{x,y:top+9},end:{x:x+249,y:top+9},thickness:.6,color:line});label(name,x,top-5,orange);fitted(value||'A definir com o cliente',x,top-22,249,46,9);});
  text('Imagem e especificações sujeitas à aprovação antes da produção.',M,64,7,regular,muted);
  const date=v=>v?new Date(v+'T12:00:00').toLocaleDateString('pt-BR'):'';
  newPage();label('03 / PROPOSTA COMERCIAL',M,y,orange);y-=43;text('Investimento.',M,y,35,editorial);y-=31;text('EMISSÃO  '+date(q.date),M,y,7.5,regular,muted);right('VÁLIDO ATÉ  '+date(q.validity),W-M,y,7.5,bold,muted);y-=22;
  const clientLines=wrap(q.customer,C-24,13,bold),contactLines=wrap([q.document&&'CPF/CNPJ: '+q.document,q.contact&&'Contato: '+q.contact,q.phone,q.email].filter(Boolean).join(' / '),C-24,8);
  const clientHeight=34+clientLines.length*17+contactLines.length*12;page.drawRectangle({x:M,y:y-clientHeight,width:C,height:clientHeight,color:white});text('PREPARADO PARA',M+12,y-16,6.5,bold,muted);let cy=y-34;cy-=drawLines(clientLines,M+12,cy,13,bold,ink,17);drawLines(contactLines,M+12,cy-2,8,regular,muted,12);y-=clientHeight+22;
  tableHeader();
  for(const [index,item]of q.items.entries()){
    const hasPhoto=q.items.length>1&&!!item.photo,tx=M+(hasPhoto?87:12),width=345-tx-12,nameLines=wrap(item.name,width,9.5,bold),descLines=wrap(item.description,width,8),rowHeight=Math.max(hasPhoto?92:56,24+nameLines.length*14+descLines.length*11);
    if(y-rowHeight<BOTTOM){newPage();tableHeader();}
    const top=y;if(index%2===0)page.drawRectangle({x:M,y:top-rowHeight,width:C,height:rowHeight,color:rgb(.99,.985,.972)});
    if(hasPhoto){const image=await pdf.embedJpg(item.photo),d=image.scaleToFit(64,64);page.drawRectangle({x:M+10,y:top-76,width:68,height:68,color:white});page.drawImage(image,{x:M+12+(64-d.width)/2,y:top-74+(64-d.height)/2,width:d.width,height:d.height});}
    let iy=top-20;iy-=drawLines(nameLines,tx,iy,9.5,bold,ink,14);drawLines(descLines,tx,iy-3,8,regular,muted,11);
    right(String(item.quantity),381,top-22,9);right(currency(item.price),459,top-22,8);right(currency(sum.lines[index]),W-M-10,top-22,9,bold);y-=rowHeight;rule(y);
  }
  y-=22;
  const leftWidth=270,boxX=337,boxW=W-M-boxX;
  const terms=[['PRAZO DE PRODUÇÃO',q.deadline],['PAGAMENTO',q.payment],['ENTREGA / RETIRADA',q.delivery]].filter(([,value])=>value);
  const termBlocks=terms.map(([label,value])=>({label,lines:wrap(value,leftWidth,8.5)}));
  const detail=[['Subtotal',sum.subtotal]];if(sum.discount)detail.push(['Desconto ('+q.discount+'%)',-sum.discount]);if(Number(q.freight))detail.push(['Frete',Number(q.freight)]);if(Number(q.setup))detail.push(['Modelagem',Number(q.setup)]);
  const boxHeight=detail.length*18+82+(sum.deposit>0?42:0),termsHeight=termBlocks.reduce((h,t)=>h+22+t.lines.length*12,0),recapHeight=Math.max(boxHeight,termsHeight);
  ensure(recapHeight);const top=y;let ty=top-10;for(const t of termBlocks){text(t.label,M,ty,6.5,bold,muted);ty-=15;ty-=drawLines(t.lines,M,ty,8.5,regular,ink,12);ty-=10;}
  page.drawRectangle({x:boxX,y:top-boxHeight,width:boxW,height:boxHeight,color:ink});page.drawRectangle({x:boxX,y:top-3,width:boxW,height:3,color:orange});let ry=top-20;
  for(const [label,value]of detail){text(label,boxX+14,ry,7.5,regular,rgb(.75,.75,.75));right(currency(value),W-M-14,ry,8,regular,white);ry-=18;}
  page.drawLine({start:{x:boxX+14,y:ry+3},end:{x:W-M-14,y:ry+3},thickness:.6,color:rgb(.33,.33,.33)});ry-=14;text('TOTAL DO ORÇAMENTO',boxX+14,ry,7,bold,rgb(.75,.75,.75));ry-=27;
  const totalText=currency(sum.total),totalSize=Math.min(22,(boxW-28)/bold.widthOfTextAtSize(totalText,1));text(totalText,boxX+14,ry,totalSize,bold,white);ry-=22;
  if(sum.deposit>0){text('Entrada ('+q.deposit+'%)',boxX+14,ry,7.5,regular,rgb(.75,.75,.75));right(currency(sum.deposit),W-M-14,ry,8,bold,white);ry-=17;text('Saldo restante',boxX+14,ry,7.5,regular,rgb(.75,.75,.75));right(currency(sum.balance),W-M-14,ry,8,regular,white);}
  y=top-recapHeight-24;
  if(q.notes){const noteLines=wrap(q.notes,C,8.5);ensure(38);text('OBSERVAÇÕES',M,y,7,bold,muted);y-=17;for(const l of noteLines){ensure(13);text(l,M,y,8.5,regular,muted);y-=13;}}
  const pages=pdf.getPages();pages.forEach((p,i)=>{p.drawLine({start:{x:M,y:43},end:{x:W-M,y:43},thickness:.6,color:line});p.drawText('HAPTOS 3D',{x:M,y:28,size:7,font:bold,color:ink});p.drawText('haptos3d.com.br  |  (11) 93284-5696',{x:M+70,y:28,size:7,font:regular,color:muted});p.drawText((i+1)+' / '+pages.length,{x:W-M-22,y:28,size:7,font:regular,color:muted});});
  pdf.setTitle('Proposta comercial '+q.number+' - Haptos 3D');pdf.setAuthor('Haptos 3D');return pdf.save();
};
