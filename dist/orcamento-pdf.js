window.generateHaptosPDF=async function(q){
  const {PDFDocument,StandardFonts,rgb}=PDFLib,{currency,totals}=HaptosQuote;
  const pdf=await PDFDocument.create(),regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),orange=rgb(1,.396,.039),ink=rgb(.08,.08,.08),muted=rgb(.38,.38,.38),light=rgb(.95,.95,.94);
  const sum=totals(q),W=595.28,H=841.89,margin=42,content=W-2*margin;let page,y;
  const safe=s=>String(s??'').normalize('NFC').replace(/[\u2010-\u2015]/g,'-').replace(/[^\u0020-\u007e\u00a0-\u00ff\n]/g,'');
  const text=(s,x,yy,size=10,font=regular,color=ink)=>page.drawText(safe(s),{x,y:yy,size,font,color});
  function wrap(value,width,size=10,font=regular){const lines=[];for(const paragraph of safe(value).split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(!word)continue;let pieces=[word];if(font.widthOfTextAtSize(word,size)>width){pieces=[];let part='';for(const char of word){if(font.widthOfTextAtSize(part+char,size)>width){pieces.push(part);part='';}part+=char;}if(part)pieces.push(part);}for(const piece of pieces){const next=line?line+' '+piece:piece;if(font.widthOfTextAtSize(next,size)>width){lines.push(line);line=piece;}else line=next;}}lines.push(line);}return lines;}
  let logo;try{const r=await fetch('/assets/logo.png');if(!r.ok)throw Error();logo=await pdf.embedPng(await r.arrayBuffer());}catch{}
  function newPage(){page=pdf.addPage([W,H]);page.drawRectangle({x:0,y:H-103,width:W,height:103,color:ink});if(logo){const dimensions=logo.scaleToFit(175,43);page.drawImage(logo,{x:margin,y:H-67,width:dimensions.width,height:dimensions.height});}else text('HAPTOS 3D',margin,H-53,24,bold,orange);text('ORÇAMENTO',W-margin-111,H-45,15,bold,rgb(1,1,1));text(q.number,W-margin-111,H-66,10,regular,rgb(.8,.8,.8));page.drawRectangle({x:0,y:H-106,width:W,height:3,color:orange});y=H-132;}
  function ensure(height){if(y-height<60)newPage();}
  function section(label){ensure(30);text(label,margin,y,11,bold,orange);y-=20;}
  function paragraph(s,width=content,x=margin,size=10,color=ink){for(const line of wrap(s,width,size)){ensure(size+6);text(line,x,y,size,regular,color);y-=size+5;}}
  const date=v=>v?new Date(v+'T12:00:00').toLocaleDateString('pt-BR'):'';
  newPage();text('Emissão: '+date(q.date),margin,y,9,regular,muted);text('Válido até: '+date(q.validity),margin+280,y,9,regular,muted);y-=30;section('CLIENTE');paragraph(q.customer,content,margin,13);paragraph([q.document&&'CPF/CNPJ: '+q.document,q.contact&&'Responsável: '+q.contact].filter(Boolean).join('  |  '));paragraph([q.phone,q.email].filter(Boolean).join('  |  '));y-=15;section('PRODUTOS E PERSONALIZAÇÃO');
  for(const [index,item] of q.items.entries()){
    const lines=wrap(item.description||'',content-116,9),nameLines=wrap((index+1)+'. '+item.name,content-124,11,bold);const height=Math.max(108,20+nameLines.length*14+lines.length*13+46);
    if(height>H-215)throw Error('A descrição de um produto ficou muito longa para o PDF. Reduza o texto.');
    ensure(height+14);const top=y;page.drawRectangle({x:margin,y:top-height,width:content,height,color:light});
    if(item.photo){const image=await pdf.embedJpg(item.photo),dimensions=image.scaleToFit(87,87);page.drawImage(image,{x:margin+10+(87-dimensions.width)/2,y:top-100+(87-dimensions.height)/2,width:dimensions.width,height:dimensions.height});}
    else text('SEM PRÉVIA',margin+13,top-52,8,regular,muted);
    const x=margin+112;let yy=top-20;for(const line of wrap((index+1)+'. '+item.name,content-124,11,bold)){text(line,x,yy,11,bold);yy-=14;}
    for(const line of lines){text(line,x,yy,9,regular,muted);yy-=13;}
    yy-=10;text(item.quantity+' un. x '+currency(item.price),x,yy,9);text(currency(sum.lines[index]),x,yy-18,12,bold);y=top-height-16;
  }
  ensure(190);section('VALORES');
  function amount(label,value,highlight=false){text(label,margin,y,highlight?13:10,highlight?bold:regular);const v=currency(value);text(v,W-margin-(highlight?bold:regular).widthOfTextAtSize(safe(v),highlight?16:10),y,highlight?16:10,highlight?bold:regular,highlight?orange:ink);y-=highlight?31:20;}
  amount('Subtotal dos produtos',sum.subtotal);amount('Desconto ('+q.discount+'%)',-sum.discount);amount('Frete',Number(q.freight));amount('Modelagem / setup',Number(q.setup));y-=6;amount('TOTAL DO ORÇAMENTO',sum.total,true);amount('Entrada ('+q.deposit+'%)',sum.deposit);amount('Saldo restante',sum.balance);y-=15;
  section('CONDIÇÕES COMERCIAIS');for(const [label,value]of[['Prazo de produção',q.deadline],['Pagamento',q.payment],['Entrega / retirada',q.delivery]])if(value)paragraph(label+': '+value);
  if(q.notes){y-=15;section('OBSERVAÇÕES');paragraph(q.notes);}
  const pages=pdf.getPages();pages.forEach((p,i)=>{p.drawLine({start:{x:margin,y:43},end:{x:W-margin,y:43},thickness:.5,color:rgb(.8,.8,.8)});p.drawText('Haptos 3D | haptos3d.com.br | (11) 93284-5696',{x:margin,y:27,size:8,font:regular,color:muted});p.drawText((i+1)+' / '+pages.length,{x:W-margin-25,y:27,size:8,font:regular,color:muted});});
  pdf.setTitle('Orçamento '+q.number+' - Haptos 3D');pdf.setAuthor('Haptos 3D');return pdf.save();
};
