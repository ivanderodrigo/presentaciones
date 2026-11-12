(function(){
'use strict';

var K=window.WESTCON_KNOWLEDGE||{vendors:[]};
var VI=window.WESTCON_VENDOR_INTELLIGENCE||{vendors:{}};
var INDEX=window.WESTCON_SLIDE_INDEX||{slides:[]};
var VERTICAL=window.WESTCON_VERTICAL_CONTENT||{verticals:{}};

var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var esc=function(s){return String(s==null?'':s).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})};
var norm=function(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')};
var slug=function(s){return norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'westcon-presentacion'};
var STORAGE='westcon.presentationBuilder.v5';

var C={
  navy:'082C3A', navy2:'17324A', navy3:'123F50', white:'FFFFFF', text:'F2F5F7',
  magenta:'EC008C', cyan:'00A6B2', orange:'F5A800', purple:'7357A6', green:'48A57D',
  muted:'C7D6DB', line:'6B7992'
};

var CURATED={
  'Cloudflare':{
    accent:'#F48120',pptAccent:'F48120',brand:'#F48120',
    partner:[
      'Consolidar seguridad de aplicaciones, Zero Trust/SASE y servicios de red.',
      'Abrir proyectos de WAAP, API Security, DDoS y acceso privado.',
      'Reducir complejidad operativa al sustituir múltiples point products.',
      'Acompañar migración, assessment, diseño y servicios gestionados.'
    ],
    sources:[
      'https://developers.cloudflare.com/reference-architecture/design-guides/secure-application-delivery/',
      'https://www.cloudflare.com/products/',
      'https://developers.cloudflare.com/reference-architecture/architectures/security/'
    ]
  },
  'Sonar (SonarQube)':{
    accent:'#55A8C6',pptAccent:'55A8C6',brand:'#102B3A',
    partner:[
      'Introducir quality gates como estándar de desarrollo y DevSecOps.',
      'Detectar vulnerabilidades y deuda técnica antes de que el código llegue a producción.',
      'Gobernar código humano y generado por IA con el mismo criterio.',
      'Construir una PoV sobre repositorios y pipelines reales.'
    ],
    sources:[
      'https://www.sonarsource.com/products/sonarqube/',
      'https://www.sonarsource.com/resources/library/how-to-check-code-quality-using-sonarqube/'
    ]
  }
};

var state={deck:[],filter:'all',query:'',drag:null,preview:null};

function uid(){return (crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+Math.random()}
function key(item){return [item.kind,item.sourceId||'',item.vendor||'',item.vertical||'',item.area||'',item.title||''].join('|')}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify({deck:state.deck}))}catch(e){}}
function load(){try{return JSON.parse(localStorage.getItem(STORAGE)||'null')}catch(e){return null}}
function inDeck(item){var k=key(item);return state.deck.some(function(x){return key(x)===k})}
function areaKey(area){
  var a=norm(area);
  if(a.indexOf('ciber')>=0)return'cyber';
  if(a.indexOf('network')>=0)return'network';
  if(a.indexOf('cloud')>=0||a.indexOf('automat')>=0||a.indexOf('uc')>=0)return'cloud';
  if(a.indexOf('servicio')>=0)return'service';
  return'corporate';
}
function areaAccent(area){
  var k=areaKey(area);
  return k==='cyber'?'#EC008C':k==='network'?'#00A6B2':k==='cloud'?'#F5A800':'#7357A6';
}
function pptAccent(area){
  var k=areaKey(area);
  return k==='cyber'?C.magenta:k==='network'?C.cyan:k==='cloud'?C.orange:C.purple;
}
function internalSlide(s){
  return s.type==='sector'||s.type==='vertical-datasheet'||/playbook|mensajes clave|abre con|preguntas que abren|uso del slide/i.test((s.title||'')+' '+(s.subtitle||''));
}
function sourceItem(s){
  if(s.source==='curated'){
    return curatedItem((s.vendors||[])[0]);
  }
  return {kind:'source',sourceId:s.id,page:s.page,title:s.title,subtitle:s.subtitle||s.area,asset:s.asset,type:s.type,area:s.area,vendors:s.vendors||[],tags:s.tags||[],source:s.source};
}
function sourceSlides(){
  return (INDEX.slides||[]).filter(function(s){return !internalSlide(s)&&s.source!=='curated'}).map(sourceItem);
}
function sourceByPage(p){
  var s=(INDEX.slides||[]).find(function(x){return x.source==='corporate'&&Number(x.page)===Number(p)});
  return s?sourceItem(s):null;
}
function curatedItem(name){
  var p=VI.vendors&&VI.vendors[name]||{},meta=CURATED[name]||{};
  return {kind:'curated-vendor',vendor:name,title:p.headline||name,subtitle:p.tagline||p.category||'',area:p.category||'',type:'vendor',tags:[name].concat(p.buyingTriggers||[]),accent:meta.accent||'#7357A6'};
}
function verticalItem(vertical,area){
  var v=VERTICAL.verticals&&VERTICAL.verticals[vertical]&&VERTICAL.verticals[vertical][area];
  if(!v)return null;
  return {kind:'vertical',vertical:vertical,area:area,title:vertical+' · '+v.areaLabel,subtitle:v.title,type:'vertical',accent:area==='cyber'?'#EC008C':area==='network'?'#00A6B2':'#F5A800'};
}
function allVerticalItems(){
  var out=[];
  Object.keys(VERTICAL.verticals||{}).forEach(function(v){
    ['cyber','network','cloud'].forEach(function(a){var x=verticalItem(v,a);if(x)out.push(x)});
  });
  return out;
}
function allItems(){
  return sourceSlides()
    .concat(Object.keys(CURATED).map(curatedItem))
    .concat(allVerticalItems());
}
function itemText(x){
  var extra='';
  if(x.kind==='vertical'){
    var v=VERTICAL.verticals[x.vertical][x.area];
    extra=JSON.stringify(v);
  }else if(x.kind==='curated-vendor'){
    var p=VI.vendors[x.vendor]||{};
    extra=JSON.stringify(p);
  }
  return norm([x.title,x.subtitle,x.area,x.vendor,x.vertical].concat(x.vendors||[],x.tags||[]).join(' ')+' '+extra);
}
function matchesFilter(x){
  if(state.filter==='all')return true;
  if(state.filter==='corporate')return x.kind==='source'&&['corporate','section','taxonomy'].indexOf(x.type)>=0;
  if(state.filter==='service')return x.kind==='source'&&x.type==='service';
  if(state.filter==='vendor')return x.type==='vendor';
  if(state.filter==='vertical')return x.kind==='vertical';
  if(state.filter==='cyber')return (x.kind==='vertical'&&x.area==='cyber')||norm(x.area).indexOf('ciber')>=0;
  if(state.filter==='network')return (x.kind==='vertical'&&x.area==='network')||norm(x.area).indexOf('network')>=0;
  if(state.filter==='cloud')return (x.kind==='vertical'&&x.area==='cloud')||norm(x.area).indexOf('cloud')>=0||norm(x.area).indexOf('automat')>=0||norm(x.area).indexOf('uc')>=0;
  return true;
}
function filteredItems(){
  var q=norm(state.query);
  return allItems().filter(matchesFilter).filter(function(x){return !q||itemText(x).indexOf(q)>=0}).sort(function(a,b){
    if(a.kind==='source'&&b.kind==='source')return (a.page||999)-(b.page||999);
    if(a.kind==='source')return-1;
    if(b.kind==='source')return 1;
    return String(a.title).localeCompare(String(b.title),'es');
  });
}

function vendorItems(name){
  var out=(INDEX.slides||[]).filter(function(s){return !internalSlide(s)&&(s.vendors||[]).includes(name)}).map(sourceItem);
  if(CURATED[name]&&!out.some(function(x){return x.kind==='curated-vendor'}))out.push(curatedItem(name));
  return out;
}
function verticalItems(name){
  return ['cyber','network','cloud'].map(function(a){return verticalItem(name,a)}).filter(Boolean);
}
function overviewItems(area){
  return (INDEX.slides||[]).filter(function(s){return s.source==='corporate'&&(s.type==='section'||s.type==='taxonomy')&&areaKey(s.area)===area}).map(sourceItem);
}
function serviceBlock(){
  return [73,74,78,80,81,84].map(sourceByPage).filter(Boolean);
}
function baseBlock(){
  return [1,2,3,5].map(sourceByPage).filter(Boolean);
}
function addUnique(items){
  var keys={};state.deck.forEach(function(x){keys[key(x)]=1});
  items.forEach(function(x){if(x&&!keys[key(x)]){state.deck.push(Object.assign({},x,{uid:uid()}));keys[key(x)]=1}});
  renderDeck();renderLibrary();save();
}
function addItem(item){
  if(inDeck(item))return;
  state.deck.push(Object.assign({},item,{uid:uid()}));renderDeck();renderLibrary();save();
}

function block(cls,title,desc,items){
  return {cls:cls,title:title,desc:desc,items:items.filter(Boolean)};
}
function matchingVendors(q){
  q=norm(q);if(!q)return[];
  return (K.vendors||[]).filter(function(v){
    var p=VI.vendors&&VI.vendors[v.name]||{};
    return norm(v.name+' '+(v.tags||[]).join(' ')+' '+(p.category||'')+' '+(p.tagline||'')+' '+(p.buyingTriggers||[]).join(' ')).indexOf(q)>=0;
  });
}
function matchingVerticals(q){
  q=norm(q);if(!q)return[];
  return Object.keys(VERTICAL.verticals||{}).filter(function(v){
    return norm(v+' '+JSON.stringify(VERTICAL.verticals[v])).indexOf(q)>=0;
  });
}
function themeBlocks(){
  var q=state.query.trim(),out=[];
  if(q){
    matchingVendors(q).slice(0,8).forEach(function(v){out.push(block(areaKey(v.area),v.name,'Slides de fabricante relacionadas con "'+q+'".',vendorItems(v.name)))});
    matchingVerticals(q).slice(0,6).forEach(function(v){out.push(block('vertical',v,'Tres enfoques: Ciberseguridad, Networking y Cloud/Automatización.',verticalItems(v)))});
    if(out.length)return out;
  }
  if(state.filter==='vertical'){
    Object.keys(VERTICAL.verticals||{}).forEach(function(v){out.push(block('vertical',v,'Ciberseguridad · Networking · Cloud/Automatización',verticalItems(v)))});
    return out;
  }
  if(state.filter==='vendor'){
    (K.vendors||[]).slice(0,14).forEach(function(v){out.push(block(areaKey(v.area),v.name,(VI.vendors[v.name]||{}).tagline||v.area,vendorItems(v.name)))});
    return out;
  }
  if(state.filter==='cyber')return[block('cyber','Ciberseguridad · visión general','Sección y taxonomía del portfolio.',overviewItems('cyber'))];
  if(state.filter==='network')return[block('network','Networking · visión general','Sección y taxonomía del portfolio.',overviewItems('network'))];
  if(state.filter==='cloud')return[block('cloud','Cloud / UC / Automatización · visión general','Sección y taxonomía del portfolio.',overviewItems('cloud'))];
  if(state.filter==='service')return[block('service','Servicios Westcon','Preventa, Labs, portfolio, financiación, demanda y cierre.',serviceBlock())];
  if(state.filter==='corporate')return[block('','Base Westcon','Portada, quiénes somos, propuesta de valor y portfolio.',baseBlock())];
  return[
    block('','Base Westcon','Portada, quiénes somos, propuesta de valor y portfolio.',baseBlock()),
    block('cyber','Ciberseguridad','Sección + taxonomía para abrir el bloque.',overviewItems('cyber')),
    block('network','Networking','Sección + taxonomía para abrir el bloque.',overviewItems('network')),
    block('cloud','Cloud / UC / Automatización','Sección + taxonomía para abrir el bloque.',overviewItems('cloud')),
    block('service','Servicios Westcon','Preventa, 3D Labs, portfolio, financiación, demanda y cierre.',serviceBlock())
  ];
}

function curatedThumb(item,full){
  var p=VI.vendors[item.vendor]||{},m=CURATED[item.vendor]||{},accent=m.accent||'#7357A6';
  return '<div class="'+(full?'preview-generated ':'')+'curated-thumb" style="--accent:'+accent+';--brand:'+(m.brand||accent)+'">'+
    '<div class="left"><div class="mini-head">'+esc(p.headline||item.title)+'</div><div class="logo-box">'+esc(item.vendor==='Sonar (SonarQube)'?'SONAR / SONARQUBE':'CLOUDFLARE')+'</div><div class="tagline">'+esc(p.tagline||'')+'</div></div>'+
    '<div class="right"><h4>¿Qué aporta '+esc(item.vendor.replace(' (SonarQube)',''))+'?</h4><div class="line"></div><div class="line"></div><div class="line short"></div><h4 style="margin-top:14px">VENTAJAS CLAVE PARA TU CLIENTE</h4><div class="line"></div><div class="line"></div><div class="line"></div><div class="line short"></div></div><div class="accent-bottom"></div></div>';
}
function verticalThumb(item,full){
  var v=VERTICAL.verticals[item.vertical][item.area],accent=item.accent||'#EC008C';
  var cases=(v.cases||[]).slice(0,4).map(function(c){return '<div class="case"><b>'+esc(c[0])+'</b><span>'+esc(c[1])+'</span></div>'}).join('');
  var sig=(v.why||[]).slice(0,3).map(function(w){return '<div class="signal">'+esc(w[0])+'</div>'}).join('');
  return '<div class="'+(full?'preview-generated ':'')+'vertical-thumb" style="--accent:'+accent+'"><div class="v-kicker">'+esc(v.areaLabel)+'</div><h4>'+esc(item.vertical)+'</h4><div class="signal-row">'+sig+'</div><div class="case-grid">'+cases+'</div><div class="next"></div></div>';
}
function generatedMini(item){
  var accent=item.kind==='vertical'?item.accent:(CURATED[item.vendor]||{}).accent||'#EC008C';
  return '<div class="deck-mini-generated" style="--accent:'+accent+'">'+esc(item.kind==='vertical'?item.vertical:item.vendor||'PERSONALIZADA')+'</div>';
}
function thumbnail(item){
  if(item.asset)return '<div class="thumb"><img src="'+esc(item.asset)+'" alt=""><span class="thumb-tag">P. '+item.page+'</span></div>';
  if(item.kind==='curated-vendor')return '<div class="thumb">'+curatedThumb(item,false)+'</div>';
  if(item.kind==='vertical')return '<div class="thumb">'+verticalThumb(item,false)+'</div>';
  return '<div class="thumb">'+generatedMini(item)+'</div>';
}

function renderBlocks(){
  var host=$('#themeBlocks');host.innerHTML='';
  themeBlocks().forEach(function(b){
    var el=document.createElement('article');el.className='theme-block '+b.cls;
    el.innerHTML='<strong>'+esc(b.title)+'</strong><small>'+esc(b.desc)+'</small><footer><span>'+b.items.length+' slide'+(b.items.length===1?'':'s')+'</span><button type="button">Añadir bloque</button></footer>';
    $('button',el).addEventListener('click',function(){addUnique(b.items)});
    host.appendChild(el);
  });
}
function renderLibrary(){
  var items=filteredItems(),host=$('#libraryGrid');host.innerHTML='';$('#libraryCount').textContent=items.length;
  items.forEach(function(item){
    var added=inDeck(item),card=document.createElement('article');card.className='slide-card';
    var label=item.kind==='vertical'?'Vertical':item.kind==='curated-vendor'?'Nuevo portfolio':item.type==='service'?'Servicio':item.type==='vendor'?'Fabricante':'FY27';
    card.innerHTML=thumbnail(item)+'<div class="slide-meta"><strong>'+esc(item.title)+'</strong><small>'+esc(item.subtitle||'')+'</small><footer><span>'+label+'</span><button type="button" '+(added?'disabled':'')+'>'+(added?'Añadida':'＋ Añadir')+'</button></footer></div>';
    $('.thumb',card).addEventListener('click',function(){openPreview(item)});
    var btn=$('footer button',card);btn.addEventListener('click',function(){addItem(item)});if(added){btn.style.opacity='.45';btn.style.cursor='default'}
    host.appendChild(card);
  });
}
function renderDeck(){
  var host=$('#deckList');host.innerHTML='';$('#emptyDeck').classList.toggle('hidden',state.deck.length>0);$('#deckCount').textContent=state.deck.length;
  state.deck.forEach(function(item,i){
    var row=document.createElement('div');row.className='deck-item';row.draggable=true;
    var mini=item.asset?'<div class="deck-thumb"><img src="'+esc(item.asset)+'" alt=""></div>':'<div class="deck-thumb">'+generatedMini(item)+'</div>';
    row.innerHTML='<div class="deck-num">'+(i+1)+'</div>'+mini+'<div class="deck-copy"><strong>'+esc(item.title)+'</strong><small>'+esc(item.subtitle||'')+'</small></div><div class="deck-actions"><button title="Subir">↑</button><button title="Bajar">↓</button><button title="Duplicar">⧉</button><button title="Quitar">×</button></div>';
    $('.deck-thumb',row).addEventListener('click',function(){openPreview(item)});
    var bs=$$('button',row);bs[0].onclick=function(){move(i,-1)};bs[1].onclick=function(){move(i,1)};bs[2].onclick=function(){duplicate(i)};bs[3].onclick=function(){state.deck.splice(i,1);renderDeck();renderLibrary();save()};
    row.addEventListener('dragstart',function(){state.drag=i;row.classList.add('dragging')});row.addEventListener('dragend',function(){row.classList.remove('dragging')});row.addEventListener('dragover',function(e){e.preventDefault()});row.addEventListener('drop',function(e){e.preventDefault();if(state.drag==null||state.drag===i)return;var x=state.deck.splice(state.drag,1)[0];state.deck.splice(i,0,x);state.drag=null;renderDeck();save()});
    host.appendChild(row);
  });
}
function move(i,d){var j=i+d;if(j<0||j>=state.deck.length)return;var x=state.deck[i];state.deck[i]=state.deck[j];state.deck[j]=x;renderDeck();save()}
function duplicate(i){state.deck.splice(i+1,0,Object.assign({},state.deck[i],{uid:uid()}));renderDeck();save()}

function openPreview(item){
  state.preview=item;$('#previewTitle').textContent=item.title;$('#previewKicker').textContent=item.kind==='vertical'?'VERTICAL':item.kind==='curated-vendor'?'NUEVO PORTFOLIO':'SLIDE FY27';
  var stage=$('#previewStage');stage.innerHTML='';
  if(item.asset){var img=document.createElement('img');img.src=item.asset;img.alt=item.title;stage.appendChild(img)}
  else if(item.kind==='curated-vendor')stage.innerHTML=curatedThumb(item,true);
  else if(item.kind==='vertical')stage.innerHTML=verticalThumb(item,true);
  else stage.innerHTML='<div class="preview-generated">'+generatedMini(item)+'</div>';
  $('#previewAddBtn').style.display=inDeck(item)?'none':'inline-flex';$('#previewDialog').showModal();
}

function bind(){
  $('#searchSlides').addEventListener('input',function(){state.query=this.value;renderBlocks();renderLibrary()});
  $('#clearSearchBtn').addEventListener('click',function(){state.query='';$('#searchSlides').value='';renderBlocks();renderLibrary()});
  $$('#filters button').forEach(function(b){b.addEventListener('click',function(){state.filter=b.dataset.filter;$$('#filters button').forEach(function(x){x.classList.toggle('active',x===b)});renderBlocks();renderLibrary()})});
  $('#clearDeckBtn').addEventListener('click',function(){state.deck=[];renderDeck();renderLibrary();save()});
  $('#newDeckBtn').addEventListener('click',function(){if(!state.deck.length||confirm('¿Empezar una presentación nueva?')){state.deck=[];state.query='';state.filter='all';$('#searchSlides').value='';$$('#filters button').forEach(function(x){x.classList.toggle('active',x.dataset.filter==='all')});renderAll();save()}});
  $('#previewAddBtn').addEventListener('click',function(){if(state.preview){addItem(state.preview);$('#previewDialog').close()}});
  $('#closePreviewBtn').addEventListener('click',function(){$('#previewDialog').close()});
  $('#personalizeBtn').addEventListener('click',function(){$('#personalizeDialog').showModal()});
  $('#addCoverBtn').addEventListener('click',function(){var t=$('#coverTitle').value.trim()||'Presentación Westcon Comstor';var s=$('#coverSubtitle').value.trim();addItem({kind:'cover',title:t,subtitle:s,type:'custom'});$('#personalizeDialog').close()});
  $('#customSlideBtn').addEventListener('click',function(){$('#customDialog').showModal()});
  $('#addCustomBtn').addEventListener('click',function(){var t=$('#customTitle').value.trim();if(!t)return;addItem({kind:'custom',title:t,subtitle:'Contenido propio',body:$('#customBody').value.trim(),type:'custom'});$('#customDialog').close();$('#customTitle').value='';$('#customBody').value=''});
  $('#generateBtn').addEventListener('click',generatePptx);
}

var assetCache={};
async function assetData(url){
  if(assetCache[url])return assetCache[url];
  var r=await fetch(url);if(!r.ok)throw new Error('No se pudo cargar '+url);var b=await r.blob();
  var d=await new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){res(fr.result)};fr.onerror=rej;fr.readAsDataURL(b)});
  assetCache[url]=d;return d;
}
function sourceAsset(page){return 'assets/source-slides/corporate/slide-'+String(page).padStart(2,'0')+'.png'}

async function generatePptx(){
  if(!state.deck.length){alert('Añade al menos una slide.');return}
  if(typeof PptxGenJS==='undefined'){alert('No se ha cargado PptxGenJS.');return}
  var pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Westcon Comstor España';pptx.company='Westcon Comstor';pptx.subject='Presentación ad-hoc FY2027';pptx.title='Westcon Presentation Builder';pptx.lang='es-ES';
  pptx.theme={headFontFace:'Arial',bodyFontFace:'Arial',lang:'es-ES'};
  var logo=null,hero=null;try{logo=await assetData('assets/westcon-comstor.png')}catch(e){}try{hero=await assetData('assets/hero.jpeg')}catch(e){}

  async function addOriginal(page){var s=pptx.addSlide();s.background={color:C.white};var d=await assetData(sourceAsset(page));s.addImage({data:d,x:0,y:0,w:13.333,h:7.5});return s}
  function addNotes(s,lines){try{s.addNotes(lines.join('\n'))}catch(e){}}
  function addVendorSlide(item){
    var name=item.vendor,p=VI.vendors[name]||{},m=CURATED[name]||{},accent=m.pptAccent||C.purple;
    var s=pptx.addSlide();s.background={color:C.navy2};
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:5.30,h:7.20,fill:{color:'253650'},line:{color:'253650'}});
    s.addShape(pptx.ShapeType.rect,{x:0,y:7.20,w:13.333,h:.30,fill:{color:accent},line:{color:accent}});
    s.addShape(pptx.ShapeType.line,{x:5.30,y:0,w:0,h:7.20,line:{color:accent,pt:1.2}});
    s.addShape(pptx.ShapeType.rect,{x:.40,y:.24,w:4.48,h:.45,fill:{color:'31415C'},line:{color:accent,pt:1}});
    s.addText(p.headline||item.title,{x:.50,y:.39,w:4.25,h:.13,fontFace:'Arial',fontSize:10,bold:true,color:C.white,charSpacing:2,margin:0,fit:'shrink'});
    s.addShape(pptx.ShapeType.rect,{x:.34,y:.83,w:4.62,h:1.94,fill:{color:C.white},line:{color:accent,pt:.8}});
    s.addText(name==='Sonar (SonarQube)'?'SONAR / SONARQUBE':'CLOUDFLARE',{x:.55,y:1.50,w:4.18,h:.42,fontFace:'Arial',fontSize:name==='Cloudflare'?23:21,bold:true,color:m.brand?m.brand.replace('#',''):accent,align:'center',valign:'mid',margin:0,fit:'shrink'});
    s.addText(p.tagline||'',{x:.38,y:3.12,w:4.56,h:.54,fontFace:'Arial',fontSize:14,italic:true,color:C.white,margin:0,fit:'shrink'});
    s.addShape(pptx.ShapeType.rect,{x:.28,y:4.04,w:4.78,h:.51,fill:{color:'665331'},line:{color:C.orange,pt:1}});
    s.addText('OPORTUNIDAD PARA EL SOCIO',{x:.48,y:4.21,w:4.2,h:.14,fontFace:'Arial',fontSize:9.5,bold:true,color:C.white,margin:0});
    s.addShape(pptx.ShapeType.rect,{x:.28,y:4.55,w:4.78,h:2.48,fill:{color:'1C304A'},line:{color:accent,pt:.9}});
    var partner=(m.partner||[]).map(function(x){return '✓ '+x}).join('\n');
    s.addText(partner,{x:.45,y:4.72,w:4.42,h:2.13,fontFace:'Arial',fontSize:8.6,color:C.white,margin:0,fit:'shrink',breakLine:false});
    s.addShape(pptx.ShapeType.rect,{x:5.45,y:.20,w:7.90,h:3.17,fill:{color:'243650'},line:{color:accent,pt:1}});
    s.addText('¿Qué aporta '+name.replace(' (SonarQube)','')+'?',{x:5.67,y:.47,w:6.9,h:.25,fontFace:'Arial',fontSize:14,bold:true,color:accent,margin:0});
    s.addText(p.valueProposition||'',{x:5.68,y:1.70,w:7.0,h:.92,fontFace:'Arial',fontSize:12.5,color:'E6E9EC',margin:0,fit:'shrink'});
    s.addText('VENTAJAS CLAVE PARA TU CLIENTE',{x:5.48,y:3.70,w:6.9,h:.20,fontFace:'Arial',fontSize:10.5,bold:true,color:C.orange,charSpacing:3,margin:0});
    var adv=(p.approvedAdvantages||[]).slice(0,4).map(function(x){return '•  '+x}).join('\n');
    s.addText(adv,{x:5.48,y:5.00,w:7.35,h:1.15,fontFace:'Arial',fontSize:11.7,color:'E3E6E9',margin:0,fit:'shrink'});
    addNotes(s,(m.sources||[]).map(function(x){return 'Fuente oficial: '+x}));
    return s;
  }
  function verticalColor(area){return area==='cyber'?C.magenta:area==='network'?C.cyan:C.orange}
  function addVerticalSlide(item){
    var v=VERTICAL.verticals[item.vertical][item.area],accent=verticalColor(item.area),s=pptx.addSlide();
    s.background={color:C.navy};
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:3.42,h:7.50,fill:{color:'062833'},line:{color:'062833'}});
    s.addShape(pptx.ShapeType.rect,{x:3.38,y:0,w:.04,h:7.50,fill:{color:accent},line:{color:accent}});
    s.addText('VERTICAL',{x:.30,y:.39,w:1.5,h:.12,fontFace:'Arial',fontSize:8.5,bold:true,color:accent,charSpacing:1.6,margin:0});
    s.addText(item.vertical.toUpperCase(),{x:.30,y:.79,w:2.72,h:.82,fontFace:'Arial',fontSize:23,bold:true,color:C.white,fit:'shrink',margin:0});
    s.addText(v.areaLabel,{x:.30,y:1.84,w:2.55,h:.20,fontFace:'Arial',fontSize:11,bold:true,color:C.white,margin:0,fit:'shrink'});
    s.addShape(pptx.ShapeType.roundRect,{x:.24,y:3.92,w:2.90,h:1.58,rectRadius:.05,fill:{color:'0E3B49'},line:{color:accent,pt:1}});
    s.addText('EL RETO',{x:.45,y:4.18,w:.85,h:.13,fontFace:'Arial',fontSize:8,bold:true,color:accent,margin:0});
    s.addText(v.challenge,{x:.45,y:4.53,w:2.45,h:.65,fontFace:'Arial',fontSize:10.4,bold:true,color:C.white,fit:'shrink',margin:0});
    if(logo){s.addShape(pptx.ShapeType.roundRect,{x:.30,y:6.42,w:2.55,h:.48,fill:{color:C.white},line:{color:accent,pt:.6}});s.addImage({data:logo,x:.73,y:6.52,w:1.68,h:.28})}
    s.addText(v.areaLabel,{x:3.82,y:.34,w:3.2,h:.15,fontFace:'Arial',fontSize:10,bold:true,color:accent,margin:0});
    s.addText(item.vertical.toUpperCase(),{x:3.82,y:.68,w:6.65,h:.42,fontFace:'Arial',fontSize:24,bold:true,color:C.white,margin:0,fit:'shrink'});
    s.addText('SEÑALES DE OPORTUNIDAD',{x:3.82,y:1.17,w:2.3,h:.13,fontFace:'Arial',fontSize:8,bold:true,color:accent,margin:0});
    (v.why||[]).slice(0,3).forEach(function(w,i){
      var x=3.82+i*3.03;s.addShape(pptx.ShapeType.roundRect,{x:x,y:1.39,w:2.84,h:.48,rectRadius:.04,fill:{color:'143E4C'},line:{color:accent,pt:.8}});
      s.addText(w[0],{x:x+.12,y:1.54,w:2.60,h:.13,fontFace:'Arial',fontSize:8.2,bold:true,color:C.white,align:'center',margin:0,fit:'shrink'});
    });
    (v.cases||[]).slice(0,4).forEach(function(ca,i){
      var col=i%2,row=Math.floor(i/2),x=3.82+col*4.43,y=2.08+row*1.70;
      s.addShape(pptx.ShapeType.roundRect,{x:x,y:y,w:4.20,h:1.50,rectRadius:.06,fill:{color:'103B49'},line:{color:accent,pt:.8}});
      s.addText(ca[0],{x:x+.16,y:y+.18,w:3.85,h:.18,fontFace:'Arial',fontSize:10.5,bold:true,color:accent,margin:0,fit:'shrink'});
      s.addText(ca[1],{x:x+.16,y:y+.52,w:3.85,h:.48,fontFace:'Arial',fontSize:9.2,color:C.white,margin:0,fit:'shrink'});
      var sol=(v.solutions&&v.solutions[i])||null;if(sol){
        s.addText((sol[1]||[]).join(' · '),{x:x+.16,y:y+1.15,w:3.85,h:.13,fontFace:'Arial',fontSize:6.7,bold:true,color:'DCE9ED',margin:0,fit:'shrink'});
      }
    });
    s.addShape(pptx.ShapeType.roundRect,{x:3.82,y:5.58,w:4.20,h:1.02,rectRadius:.05,fill:{color:'103B49'},line:{color:accent,pt:.8}});
    s.addText('IMPACTO ESPERADO',{x:3.98,y:5.78,w:1.55,h:.13,fontFace:'Arial',fontSize:7.5,bold:true,color:accent,margin:0});
    var impacts=(v.impacts||[]).slice(0,4).map(function(x){return x[0]}).join(' · ');
    s.addText(impacts,{x:3.98,y:6.10,w:3.75,h:.22,fontFace:'Arial',fontSize:8.3,color:C.white,margin:0,fit:'shrink'});
    s.addShape(pptx.ShapeType.roundRect,{x:8.25,y:5.58,w:4.66,h:1.02,rectRadius:.05,fill:{color:'103B49'},line:{color:accent,pt:.8}});
    s.addText('CÓMO EMPEZAR',{x:8.42,y:5.78,w:1.35,h:.13,fontFace:'Arial',fontSize:7.5,bold:true,color:accent,margin:0});
    s.addText((v.start||[]).slice(0,3).join('  →  '),{x:8.42,y:6.10,w:4.10,h:.22,fontFace:'Arial',fontSize:8.2,color:C.white,margin:0,fit:'shrink'});
    s.addShape(pptx.ShapeType.rect,{x:3.82,y:6.83,w:9.09,h:.38,fill:{color:accent},line:{color:accent}});
    s.addText('SIGUIENTE PASO  ·  '+v.nextStep,{x:3.98,y:6.94,w:8.70,h:.13,fontFace:'Arial',fontSize:8.5,bold:true,color:item.area==='cloud'?C.navy:C.white,margin:0,fit:'shrink'});
    addNotes(s,['Contenido estructurado a partir de Westcon Datasheets Verticales FY27.',v.references||'']);
    return s;
  }
  function addCover(item){
    var s=pptx.addSlide();s.background={color:C.navy};
    if(hero)s.addImage({data:hero,x:7.15,y:0,w:6.18,h:7.5});
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:7.45,h:7.5,fill:{color:C.navy,transparency:0},line:{color:C.navy}});
    if(logo){s.addShape(pptx.ShapeType.roundRect,{x:.55,y:.42,w:1.95,h:.64,fill:{color:C.white},line:{color:C.white}});s.addImage({data:logo,x:.87,y:.54,w:1.32,h:.38})}
    s.addText('WESTCON COMSTOR · FY2027',{x:.58,y:1.61,w:4.8,h:.14,fontFace:'Arial',fontSize:8.5,bold:true,color:C.cyan,charSpacing:1.5,margin:0});
    s.addText(item.title,{x:.58,y:2.04,w:5.85,h:.78,fontFace:'Arial',fontSize:31,bold:true,color:C.white,fit:'shrink',margin:0});
    s.addText(item.subtitle||'',{x:.60,y:3.08,w:5.65,h:.65,fontFace:'Arial',fontSize:16,color:'D8E6EA',fit:'shrink',margin:0});
    s.addShape(pptx.ShapeType.rect,{x:0,y:7.17,w:13.333,h:.33,fill:{color:C.cyan},line:{color:C.cyan}});
    return s;
  }
  function addCustom(item){
    var s=pptx.addSlide();s.background={color:C.navy2};
    s.addShape(pptx.ShapeType.rect,{x:.40,y:.28,w:12.45,h:.52,fill:{color:'31415C'},line:{color:C.magenta,pt:1}});
    s.addText(item.title,{x:.56,y:.44,w:11.8,h:.18,fontFace:'Arial',fontSize:14,bold:true,color:C.white,margin:0,fit:'shrink'});
    s.addText('MENSAJES CLAVE',{x:.52,y:1.18,w:2.2,h:.16,fontFace:'Arial',fontSize:10,bold:true,color:C.magenta,charSpacing:2,margin:0});
    var lines=String(item.body||'').split(/\n+/).map(function(x){return x.trim()}).filter(Boolean);
    var text=(lines.length?lines:[item.subtitle||'']).map(function(x){return '•  '+x}).join('\n');
    s.addText(text,{x:.65,y:1.78,w:11.75,h:4.35,fontFace:'Arial',fontSize:20,color:C.white,breakLine:false,fit:'shrink',margin:0});
    s.addShape(pptx.ShapeType.rect,{x:0,y:7.20,w:13.333,h:.30,fill:{color:C.magenta},line:{color:C.magenta}});
    return s;
  }

  for(var i=0;i<state.deck.length;i++){
    var item=state.deck[i];
    if(item.kind==='source'){await addOriginal(item.page);continue}
    if(item.kind==='curated-vendor'){addVendorSlide(item);continue}
    if(item.kind==='vertical'){addVerticalSlide(item);continue}
    if(item.kind==='cover'){addCover(item);continue}
    if(item.kind==='custom'){addCustom(item);continue}
  }
  var title=(state.deck.find(function(x){return x.kind==='cover'})||{}).title||'Westcon';
  try{await pptx.writeFile({fileName:slug(title)+'-FY27.pptx'})}catch(e){console.error(e);alert('No se pudo generar el PowerPoint.')}
}

function renderAll(){renderBlocks();renderLibrary();renderDeck()}
function init(){
  var d=load();if(d&&Array.isArray(d.deck))state.deck=d.deck;
  bind();renderAll();
}
init();
})();