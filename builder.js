(function(){
'use strict';

var K=window.WESTCON_KNOWLEDGE||{vendors:[],westconServices:[]};
var VI=window.WESTCON_VENDOR_INTELLIGENCE||{vendors:{}};
var INDEX=window.WESTCON_SLIDE_INDEX||{slides:[]};
var VERTICAL=window.WESTCON_VERTICAL_CONTENT||{verticals:{}};
var LOGOS=window.WESTCON_VENDOR_LOGOS||{};

var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var esc=function(s){return String(s==null?'':s).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})};
var norm=function(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')};
var slug=function(s){return norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'westcon-presentacion'};
var STORAGE='westcon.presentationBuilder.v5.1';

var C={
  navy:'082C3A',navy2:'17324A',navy3:'123F50',white:'FFFFFF',ink:'173744',
  magenta:'EC008C',cyan:'00A6B2',orange:'F5A800',purple:'7357A6',green:'48A57D',
  muted:'6D828B',light:'F2F5F7',line:'D8E3E7',pink:'FDE9F5',cyanSoft:'E7F7F8',orangeSoft:'FFF3DC'
};

var CURATED={
  'Cloudflare':{
    accent:'#F48120',pptAccent:'F48120',
    partner:[
      'Consolidar seguridad de aplicaciones, Zero Trust/SASE y servicios de red.',
      'Abrir proyectos de WAAP, API Security, DDoS y acceso privado.',
      'Reducir complejidad operativa al sustituir múltiples point products.',
      'Acompañar assessment, diseño, migración y operación.'
    ],
    sources:[
      'https://developers.cloudflare.com/reference-architecture/design-guides/secure-application-delivery/',
      'https://www.cloudflare.com/products/',
      'https://developers.cloudflare.com/reference-architecture/architectures/security/'
    ]
  },
  'Sonar (SonarQube)':{
    accent:'#D3121D',pptAccent:'D3121D',
    partner:[
      'Introducir quality gates como estándar de desarrollo y DevSecOps.',
      'Detectar vulnerabilidades y deuda técnica antes de llegar a producción.',
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

function uid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+Math.random()}
function key(item){return [item.kind,item.sourceId||'',item.vendor||'',item.vertical||'',item.area||'',item.phase||'',item.title||''].join('|')}
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
function areaName(area){return area==='cyber'?'Ciberseguridad':area==='network'?'Networking':'Cloud / UC / Automatización'}
function areaAccent(area){return area==='cyber'?'#EC008C':area==='network'?'#00A6B2':'#F5A800'}
function pptAccent(area){return area==='cyber'?C.magenta:area==='network'?C.cyan:C.orange}
function logoUrl(name){return LOGOS[name]||null}
function internalSlide(s){return s.type==='sector'||s.type==='vertical-datasheet'||/playbook|mensajes clave|abre con|preguntas que abren|uso del slide/i.test((s.title||'')+' '+(s.subtitle||''))}
function sourceItem(s){return {kind:'source',sourceId:s.id,page:s.page,title:s.title,subtitle:s.subtitle||s.area,asset:s.asset,type:s.type,area:s.area,vendors:s.vendors||[],tags:s.tags||[],source:s.source}}
function sourceSlides(){return (INDEX.slides||[]).filter(function(s){return !internalSlide(s)&&s.source!=='curated'}).map(sourceItem)}
function sourceByPage(p){var s=(INDEX.slides||[]).find(function(x){return x.source==='corporate'&&Number(x.page)===Number(p)});return s?sourceItem(s):null}
function curatedItem(name){
  var p=VI.vendors&&VI.vendors[name]||{},m=CURATED[name]||{};
  return {kind:'curated-vendor',vendor:name,title:p.headline||name,subtitle:p.tagline||p.category||'',area:p.category||'',type:'vendor',tags:[name].concat(p.buyingTriggers||[]),accent:m.accent||'#7357A6'};
}
function verticalModel(vertical,area){return VERTICAL.verticals&&VERTICAL.verticals[vertical]&&VERTICAL.verticals[vertical][area]||null}
function verticalPage(vertical,area,phase){
  var v=verticalModel(vertical,area);if(!v)return null;
  var names={
    context:'Contexto, reto e impacto',
    cases:'Casos de uso y fabricantes',
    action:'Activación y siguiente paso'
  };
  return {
    kind:'vertical-page',vertical:vertical,area:area,phase:phase,type:'vertical',
    title:vertical+' · '+v.areaLabel+' · '+names[phase],
    subtitle:v.title,accent:areaAccent(area)
  };
}
function verticalPages(vertical,area){return ['context','cases','action'].map(function(p){return verticalPage(vertical,area,p)}).filter(Boolean)}
function verticalSectorPages(vertical){
  var out=[];['cyber','network','cloud'].forEach(function(a){out=out.concat(verticalPages(vertical,a))});return out;
}
function allVerticalPages(){
  var out=[];Object.keys(VERTICAL.verticals||{}).forEach(function(v){out=out.concat(verticalSectorPages(v))});return out;
}
function allItems(){
  var base=sourceSlides().concat(Object.keys(CURATED).map(curatedItem));
  if(state.filter==='vertical'||state.query.trim())base=base.concat(allVerticalPages());
  return base;
}
function itemText(x){
  var extra='';
  if(x.kind==='vertical-page')extra=JSON.stringify(verticalModel(x.vertical,x.area)||{});
  else if(x.kind==='curated-vendor')extra=JSON.stringify(VI.vendors[x.vendor]||{});
  return norm([x.title,x.subtitle,x.area,x.vendor,x.vertical,x.phase].concat(x.vendors||[],x.tags||[]).join(' ')+' '+extra);
}
function matchesFilter(x){
  if(state.filter==='all')return true;
  if(state.filter==='corporate')return x.kind==='source'&&['corporate','section','taxonomy'].indexOf(x.type)>=0;
  if(state.filter==='service')return x.kind==='source'&&x.type==='service';
  if(state.filter==='vendor')return x.type==='vendor';
  if(state.filter==='vertical')return x.kind==='vertical-page';
  if(state.filter==='cyber')return (x.kind==='vertical-page'&&x.area==='cyber')||norm(x.area).indexOf('ciber')>=0;
  if(state.filter==='network')return (x.kind==='vertical-page'&&x.area==='network')||norm(x.area).indexOf('network')>=0;
  if(state.filter==='cloud')return (x.kind==='vertical-page'&&x.area==='cloud')||norm(x.area).indexOf('cloud')>=0||norm(x.area).indexOf('automat')>=0||norm(x.area).indexOf('uc')>=0;
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
  var out=(INDEX.slides||[]).filter(function(s){return !internalSlide(s)&&(s.vendors||[]).includes(name)&&s.source!=='curated'}).map(sourceItem);
  if(CURATED[name])out.push(curatedItem(name));
  return out;
}
function slideMatchesArea(s,area){
  var a=norm(s.area||'');
  if(area==='cyber')return a.indexOf('ciber')>=0;
  if(area==='network')return a.indexOf('network')>=0;
  if(area==='cloud')return a.indexOf('cloud')>=0||a.indexOf('automat')>=0||a.indexOf('uc')>=0;
  return false;
}
function curatedMatchesArea(name,area){
  var v=(K.vendors||[]).find(function(x){return x.name===name});var a=norm(v&&v.area||'');
  if(area==='cyber')return a.indexOf('ciber')>=0;
  if(area==='network')return a.indexOf('network')>=0;
  if(area==='cloud')return a.indexOf('cloud')>=0||a.indexOf('automat')>=0||a.indexOf('uc')>=0;
  return false;
}
function vendorSlidesForArea(area){
  var out=(INDEX.slides||[]).filter(function(s){return !internalSlide(s)&&s.source==='corporate'&&s.type==='vendor'&&slideMatchesArea(s,area)}).map(sourceItem);
  Object.keys(CURATED).forEach(function(name){if(curatedMatchesArea(name,area))out.push(curatedItem(name))});
  return out;
}
function overviewItems(area){
  return (INDEX.slides||[]).filter(function(s){return s.source==='corporate'&&(s.type==='section'||s.type==='taxonomy')&&areaKey(s.area)===area}).map(sourceItem);
}
function areaBlockItems(area){return overviewItems(area).concat(vendorSlidesForArea(area))}
function serviceBlock(){return (INDEX.slides||[]).filter(function(s){return s.source==='corporate'&&s.type==='service'&&Number(s.page)!==82}).map(sourceItem)}
function baseBlock(){return [1,2,3,4,5].map(sourceByPage).filter(Boolean)}
function addUnique(items){
  var keys={};state.deck.forEach(function(x){keys[key(x)]=1});
  items.forEach(function(x){if(x&&!keys[key(x)]){state.deck.push(Object.assign({},x,{uid:uid()}));keys[key(x)]=1}});
  renderDeck();renderLibrary();save();
}
function addItem(item){if(inDeck(item))return;state.deck.push(Object.assign({},item,{uid:uid()}));renderDeck();renderLibrary();save()}
function block(cls,title,desc,items){return {cls:cls,title:title,desc:desc,items:items.filter(Boolean)}}
function matchingVendors(q){
  q=norm(q);if(!q)return[];
  return (K.vendors||[]).filter(function(v){var p=VI.vendors&&VI.vendors[v.name]||{};return norm(v.name+' '+(v.tags||[]).join(' ')+' '+(p.category||'')+' '+(p.tagline||'')+' '+(p.buyingTriggers||[]).join(' ')).indexOf(q)>=0});
}
function matchingVerticals(q){
  q=norm(q);if(!q)return[];
  return Object.keys(VERTICAL.verticals||{}).filter(function(v){return norm(v+' '+JSON.stringify(VERTICAL.verticals[v])).indexOf(q)>=0});
}
function themeBlocks(){
  var q=state.query.trim(),out=[];
  if(q){
    matchingVendors(q).slice(0,8).forEach(function(v){out.push(block(areaKey(v.area),v.name,(VI.vendors[v.name]||{}).tagline||v.area,vendorItems(v.name)))});
    matchingVerticals(q).slice(0,6).forEach(function(v){out.push(block('vertical',v+' · vertical completo','9 slides: contexto, casos/fabricantes y activación para las tres áreas.',verticalSectorPages(v)))});
    if(out.length)return out;
  }
  if(state.filter==='vertical'){
    Object.keys(VERTICAL.verticals||{}).forEach(function(v){out.push(block('vertical',v,'9 slides: Ciberseguridad · Networking · Cloud/Automatización.',verticalSectorPages(v)))});
    return out;
  }
  if(state.filter==='vendor'){
    (K.vendors||[]).slice(0,16).forEach(function(v){out.push(block(areaKey(v.area),v.name,(VI.vendors[v.name]||{}).tagline||v.area,vendorItems(v.name)))});
    return out;
  }
  if(state.filter==='cyber')return[block('cyber','Ciberseguridad · bloque completo','Sección + taxonomía + todos los fabricantes de Ciberseguridad.',areaBlockItems('cyber'))];
  if(state.filter==='network')return[block('network','Networking · bloque completo','Sección + taxonomía + todos los fabricantes de Networking.',areaBlockItems('network'))];
  if(state.filter==='cloud')return[block('cloud','Cloud / UC / Automatización · bloque completo','Sección + taxonomía + todos los fabricantes de esta solución.',areaBlockItems('cloud'))];
  if(state.filter==='service')return[block('service','Servicios Westcon · bloque completo','Todas las slides de servicios FY27 relevantes.',serviceBlock())];
  if(state.filter==='corporate')return[block('','Base Westcon','Portada, quiénes somos, propuesta de valor, Blueprint y portfolio.',baseBlock())];
  return[
    block('','Base Westcon','Portada, quiénes somos, propuesta de valor, Blueprint y portfolio.',baseBlock()),
    block('cyber','Ciberseguridad · completo','Sección + taxonomía + '+vendorSlidesForArea('cyber').length+' fabricantes/slides.',areaBlockItems('cyber')),
    block('network','Networking · completo','Sección + taxonomía + '+vendorSlidesForArea('network').length+' fabricantes/slides.',areaBlockItems('network')),
    block('cloud','Cloud / UC / Automatización · completo','Sección + taxonomía + '+vendorSlidesForArea('cloud').length+' fabricantes/slides.',areaBlockItems('cloud')),
    block('service','Servicios Westcon · completo','Todo el bloque de servicios FY27.',serviceBlock())
  ];
}

function curatedThumb(item,full){
  var p=VI.vendors[item.vendor]||{},m=CURATED[item.vendor]||{},accent=m.accent||'#7357A6',logo=logoUrl(item.vendor);
  return '<div class="'+(full?'preview-generated ':'')+'curated-thumb" style="--accent:'+accent+'">'+
    '<div class="left"><div class="mini-head">'+esc(p.headline||item.title)+'</div><div class="logo-box">'+(logo?'<img src="'+esc(logo)+'" alt="'+esc(item.vendor)+'">':esc(item.vendor))+'</div><div class="tagline">'+esc(p.tagline||'')+'</div></div>'+
    '<div class="right"><h4>¿Qué aporta '+esc(item.vendor.replace(' (SonarQube)',''))+'?</h4><p>'+esc(p.valueProposition||'')+'</p><h4>VENTAJAS CLAVE PARA TU CLIENTE</h4><ul>'+(p.approvedAdvantages||[]).slice(0,4).map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div><div class="accent-bottom"></div></div>';
}
function verticalThumb(item,full){
  var v=verticalModel(item.vertical,item.area),accent=item.accent||'#EC008C',cls=' phase-'+item.phase;
  if(item.phase==='context'){
    var sig=(v.why||[]).slice(0,3).map(function(w){return '<div class="signal"><b>'+esc(w[0])+'</b><span>'+esc(w[1])+'</span></div>'}).join('');
    var impacts=(v.impacts||[]).slice(0,4).map(function(x){return '<div class="impact"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>'}).join('');
    return '<div class="'+(full?'preview-generated ':'')+'vertical-rich'+cls+'" style="--accent:'+accent+'"><div class="vr-head"><span>'+esc(v.areaLabel)+'</span><b>'+esc(item.vertical)+'</b><h4>'+esc(v.title)+'</h4></div><div class="vr-body"><h5>POR QUÉ ACTUAR AHORA</h5><div class="vr-signals">'+sig+'</div><div class="vr-challenge"><b>EL RETO</b><span>'+esc(v.challenge)+'</span></div><div class="vr-impact"><h5>IMPACTO ESPERADO</h5>'+impacts+'</div></div></div>';
  }
  if(item.phase==='cases'){
    var cases=(v.cases||[]).slice(0,4).map(function(c,i){var sol=(v.solutions||[])[i]||['',[]];return '<div class="usecase"><em>'+(i+1)+'</em><b>'+esc(c[0])+'</b><span>'+esc(c[1])+'</span><small>'+esc((sol[1]||[]).join(' · '))+'</small></div>'}).join('');
    var sols=(v.solutions||[]).slice(0,4).map(function(s){return '<div class="solution"><b>'+esc(s[0])+'</b><span>'+esc((s[1]||[]).join(' · '))+'</span></div>'}).join('');
    return '<div class="'+(full?'preview-generated ':'')+'vertical-rich'+cls+'" style="--accent:'+accent+'"><div class="vr-head compact"><span>'+esc(v.areaLabel)+'</span><b>'+esc(item.vertical)+'</b><h4>Casos de uso y cómo ayudan nuestros fabricantes</h4></div><div class="vr-body"><div class="vr-cases">'+cases+'</div><div class="vr-solutions"><h5>CÓMO LO RESOLVEMOS</h5>'+sols+'</div></div></div>';
  }
  var starts=(v.start||[]).slice(0,3).map(function(s,i){return '<div class="step"><em>'+(i+1)+'</em><span>'+esc(s)+'</span></div>'}).join('');
  var impacts2=(v.impacts||[]).slice(0,4).map(function(x){return '<div class="impact"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>'}).join('');
  return '<div class="'+(full?'preview-generated ':'')+'vertical-rich'+cls+'" style="--accent:'+accent+'"><div class="vr-head compact"><span>'+esc(v.areaLabel)+'</span><b>'+esc(item.vertical)+'</b><h4>Activación: del caso de uso al siguiente paso</h4></div><div class="vr-body"><h5>CÓMO EMPEZAR</h5><div class="vr-steps">'+starts+'</div><div class="vr-action-grid"><div><h5>IMPACTO ESPERADO</h5>'+impacts2+'</div><div class="westcon-help"><h5>WESTCON ACELERA</h5><p>Preventa y diseño · 3D Labs · PoC/PoV · Servicios y lifecycle</p></div></div><div class="vr-next">'+esc(v.nextStep)+'</div></div></div>';
}
function generatedMini(item){
  var accent=item.kind==='vertical-page'?item.accent:(CURATED[item.vendor]||{}).accent||'#EC008C';
  var label=item.kind==='vertical-page'?(item.vertical+' · '+(item.phase==='context'?'1/3':item.phase==='cases'?'2/3':'3/3')):item.vendor||'PERSONALIZADA';
  return '<div class="deck-mini-generated" style="--accent:'+accent+'">'+esc(label)+'</div>';
}
function thumbnail(item){
  if(item.asset)return '<div class="thumb"><img src="'+esc(item.asset)+'" alt=""><span class="thumb-tag">P. '+item.page+'</span></div>';
  if(item.kind==='curated-vendor')return '<div class="thumb">'+curatedThumb(item,false)+'</div>';
  if(item.kind==='vertical-page')return '<div class="thumb">'+verticalThumb(item,false)+'</div>';
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
    var label=item.kind==='vertical-page'?'Vertical '+(item.phase==='context'?'1/3':item.phase==='cases'?'2/3':'3/3'):item.kind==='curated-vendor'?'Fabricante':item.type==='service'?'Servicio':item.type==='vendor'?'Fabricante':'FY27';
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
  state.preview=item;$('#previewTitle').textContent=item.title;
  $('#previewKicker').textContent=item.kind==='vertical-page'?'VERTICAL · '+(item.phase==='context'?'CONTEXTO':item.phase==='cases'?'CASOS Y FABRICANTES':'ACTIVACIÓN'):item.kind==='curated-vendor'?'FABRICANTE':'SLIDE FY27';
  var stage=$('#previewStage');stage.innerHTML='';
  if(item.asset){var img=document.createElement('img');img.src=item.asset;img.alt=item.title;stage.appendChild(img)}
  else if(item.kind==='curated-vendor')stage.innerHTML=curatedThumb(item,true);
  else if(item.kind==='vertical-page')stage.innerHTML=verticalThumb(item,true);
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
  var westconLogo=null,hero=null;try{westconLogo=await assetData('assets/westcon-comstor.png')}catch(e){}try{hero=await assetData('assets/hero.jpeg')}catch(e){}

  async function addOriginal(page){var s=pptx.addSlide();s.background={color:C.white};var d=await assetData(sourceAsset(page));s.addImage({data:d,x:0,y:0,w:13.333,h:7.5});return s}
  function addNotes(s,lines){try{s.addNotes(lines.filter(Boolean).join('\n'))}catch(e){}}
  async function addLogo(s,name,x,y,w,h){
    var u=logoUrl(name);
    if(u){
      try{var d=await assetData(u);s.addImage({data:d,x:x,y:y,w:w,h:h});return}catch(e){}
    }
    s.addText(name,{x:x,y:y+h*.33,w:w,h:h*.34,fontFace:'Arial',fontSize:7.5,bold:true,color:C.ink,align:'center',fit:'shrink',margin:0});
  }
  function addHeader(s,area,vertical,title){
    var accent=pptAccent(area),soft=area==='cyber'?C.pink:area==='network'?C.cyanSoft:C.orangeSoft;
    s.background={color:'F4F7F8'};
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:1.42,fill:{color:'321640'},line:{color:'321640'}});
    s.addShape(pptx.ShapeType.roundRect,{x:.58,y:.26,w:1.75,h:.32,rectRadius:.05,fill:{color:C.navy},line:{color:C.navy}});
    s.addText(areaName(area).toUpperCase(),{x:.78,y:.36,w:1.36,h:.10,fontFace:'Arial',fontSize:7,bold:true,color:C.white,align:'center',margin:0,fit:'shrink'});
    s.addText(vertical.toUpperCase(),{x:.60,y:.76,w:3.4,h:.13,fontFace:'Arial',fontSize:8.5,bold:true,color:C.white,charSpacing:1.4,margin:0});
    s.addText(title,{x:.60,y:.98,w:10.65,h:.30,fontFace:'Arial',fontSize:20.5,bold:true,color:C.white,margin:0,fit:'shrink'});
    if(westconLogo){s.addShape(pptx.ShapeType.roundRect,{x:11.20,y:.26,w:1.50,h:.48,fill:{color:C.white},line:{color:C.white}});s.addImage({data:westconLogo,x:11.48,y:.36,w:.95,h:.26})}
    return {accent:accent,soft:soft};
  }
  function addFooter(s,n){
    s.addShape(pptx.ShapeType.rect,{x:0,y:7.20,w:13.333,h:.30,fill:{color:C.navy},line:{color:C.navy}});
    s.addText('Westcon Comstor España · FY2027',{x:.50,y:7.29,w:2.7,h:.08,fontFace:'Arial',fontSize:6.5,color:C.white,margin:0});
    s.addText(String(n||''),{x:12.35,y:7.29,w:.45,h:.08,fontFace:'Arial',fontSize:6.5,color:C.white,align:'right',margin:0});
  }
  async function addVendorSlide(item){
    var name=item.vendor,p=VI.vendors[name]||{},m=CURATED[name]||{},accent=m.pptAccent||C.purple,s=pptx.addSlide();
    s.background={color:C.navy2};
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:5.30,h:7.20,fill:{color:'253650'},line:{color:'253650'}});
    s.addShape(pptx.ShapeType.rect,{x:0,y:7.20,w:13.333,h:.30,fill:{color:accent},line:{color:accent}});
    s.addShape(pptx.ShapeType.line,{x:5.30,y:0,w:0,h:7.20,line:{color:accent,pt:1.2}});
    s.addShape(pptx.ShapeType.rect,{x:.40,y:.24,w:4.48,h:.45,fill:{color:'31415C'},line:{color:accent,pt:1}});
    s.addText(p.headline||item.title,{x:.50,y:.39,w:4.25,h:.13,fontFace:'Arial',fontSize:10,bold:true,color:C.white,charSpacing:2,margin:0,fit:'shrink'});
    s.addShape(pptx.ShapeType.rect,{x:.34,y:.83,w:4.62,h:1.94,fill:{color:C.white},line:{color:accent,pt:.8}});
    await addLogo(s,name,.72,1.18,3.85,1.22);
    s.addText(p.tagline||'',{x:.38,y:3.12,w:4.56,h:.54,fontFace:'Arial',fontSize:14,italic:true,color:C.white,margin:0,fit:'shrink'});
    s.addShape(pptx.ShapeType.rect,{x:.28,y:4.04,w:4.78,h:.51,fill:{color:'665331'},line:{color:C.orange,pt:1}});
    s.addText('OPORTUNIDAD PARA EL SOCIO',{x:.48,y:4.21,w:4.2,h:.14,fontFace:'Arial',fontSize:9.5,bold:true,color:C.white,margin:0});
    s.addShape(pptx.ShapeType.rect,{x:.28,y:4.55,w:4.78,h:2.48,fill:{color:'1C304A'},line:{color:accent,pt:.9}});
    s.addText((m.partner||[]).map(function(x){return '✓ '+x}).join('\n'),{x:.45,y:4.72,w:4.42,h:2.13,fontFace:'Arial',fontSize:8.6,color:C.white,margin:0,fit:'shrink'});
    s.addShape(pptx.ShapeType.rect,{x:5.45,y:.20,w:7.90,h:3.17,fill:{color:'243650'},line:{color:accent,pt:1}});
    s.addText('¿Qué aporta '+name.replace(' (SonarQube)','')+'?',{x:5.67,y:.47,w:6.9,h:.25,fontFace:'Arial',fontSize:14,bold:true,color:accent,margin:0});
    s.addText(p.valueProposition||'',{x:5.68,y:1.17,w:7.0,h:1.25,fontFace:'Arial',fontSize:12.3,color:'E6E9EC',margin:0,fit:'shrink'});
    s.addText('VENTAJAS CLAVE PARA TU CLIENTE',{x:5.48,y:3.70,w:6.9,h:.20,fontFace:'Arial',fontSize:10.5,bold:true,color:C.orange,charSpacing:3,margin:0});
    s.addText((p.approvedAdvantages||[]).slice(0,4).map(function(x){return '•  '+x}).join('\n'),{x:5.48,y:4.25,w:7.35,h:2.05,fontFace:'Arial',fontSize:11.2,color:'E3E6E9',margin:0,fit:'shrink'});
    addNotes(s,(m.sources||[]).map(function(x){return 'Fuente oficial: '+x}));
    return s;
  }
  function addImpactBars(s,v,x,y,w,accent){
    (v.impacts||[]).slice(0,4).forEach(function(it,i){
      var yy=y+i*.62,val=Math.max(0,Math.min(100,Number(it[1]||0)));
      s.addText(it[0],{x:x,y:yy,w:w-1.0,h:.11,fontFace:'Arial',fontSize:7.7,bold:true,color:C.ink,margin:0});
      s.addText(String(val),{x:x+w-.65,y:yy,w:.48,h:.11,fontFace:'Arial',fontSize:7.7,bold:true,color:accent,align:'right',margin:0});
      s.addShape(pptx.ShapeType.roundRect,{x:x,y:yy+.20,w:w-.25,h:.08,fill:{color:'DFE7EA'},line:{color:'DFE7EA'}});
      s.addShape(pptx.ShapeType.roundRect,{x:x,y:yy+.20,w:(w-.25)*val/100,h:.08,fill:{color:accent},line:{color:accent}});
    });
  }
  async function addVerticalContext(item){
    var v=verticalModel(item.vertical,item.area),s=pptx.addSlide(),h=addHeader(s,item.area,item.vertical,v.title),accent=h.accent;
    s.addText('POR QUÉ ACTUAR AHORA',{x:.60,y:1.64,w:2.4,h:.14,fontFace:'Arial',fontSize:9,bold:true,color:accent,charSpacing:1.1,margin:0});
    (v.why||[]).slice(0,3).forEach(function(it,i){
      var x=.60+i*4.05;
      s.addShape(pptx.ShapeType.roundRect,{x:x,y:1.91,w:3.78,h:1.15,rectRadius:.05,fill:{color:C.white},line:{color:'CBD9DE',pt:.7}});
      s.addShape(pptx.ShapeType.rect,{x:x,y:1.91,w:.08,h:1.15,fill:{color:accent},line:{color:accent}});
      s.addText(it[0],{x:x+.25,y:2.08,w:3.25,h:.17,fontFace:'Arial',fontSize:9.5,bold:true,color:C.ink,margin:0,fit:'shrink'});
      s.addText(it[1],{x:x+.25,y:2.43,w:3.25,h:.38,fontFace:'Arial',fontSize:8.5,color:'3A5661',margin:0,fit:'shrink'});
    });
    s.addShape(pptx.ShapeType.roundRect,{x:.60,y:3.28,w:12.13,h:.83,rectRadius:.05,fill:{color:item.area==='cyber'?C.pink:item.area==='network'?C.cyanSoft:C.orangeSoft},line:{color:item.area==='cyber'?'F9B9DA':item.area==='network'?'A8DDE1':'F7D699',pt:.6}});
    s.addText('EL RETO',{x:.86,y:3.48,w:.78,h:.12,fontFace:'Arial',fontSize:8,bold:true,color:accent,margin:0});
    s.addText(v.challenge,{x:1.80,y:3.42,w:10.35,h:.28,fontFace:'Arial',fontSize:12.2,bold:true,color:C.ink,margin:0,fit:'shrink'});
    s.addText('IMPACTO ESPERADO',{x:.60,y:4.42,w:2.0,h:.14,fontFace:'Arial',fontSize:9,bold:true,color:accent,margin:0});
    s.addShape(pptx.ShapeType.roundRect,{x:.60,y:4.68,w:5.65,h:2.12,rectRadius:.05,fill:{color:C.white},line:{color:'CBD9DE',pt:.7}});
    addImpactBars(s,v,.88,4.94,5.05,accent);
    s.addText('CONVERSACIONES QUE ABRE',{x:6.65,y:4.42,w:2.4,h:.14,fontFace:'Arial',fontSize:9,bold:true,color:accent,margin:0});
    s.addShape(pptx.ShapeType.roundRect,{x:6.65,y:4.68,w:6.08,h:2.12,rectRadius:.05,fill:{color:C.white},line:{color:'CBD9DE',pt:.7}});
    (v.cases||[]).slice(0,4).forEach(function(it,i){
      var col=i%2,row=Math.floor(i/2),x=6.90+col*2.83,y=4.96+row*.78;
      s.addShape(pptx.ShapeType.ellipse,{x:x,y:y,w:.30,h:.30,fill:{color:accent},line:{color:accent}});
      s.addText(String(i+1),{x:x,y:y+.08,w:.30,h:.08,fontFace:'Arial',fontSize:6.5,bold:true,color:C.white,align:'center',margin:0});
      s.addText(it[0],{x:x+.42,y:y+.03,w:2.18,h:.20,fontFace:'Arial',fontSize:8.5,bold:true,color:C.ink,margin:0,fit:'shrink'});
    });
    addFooter(s,'1/3');addNotes(s,['Contenido estructurado a partir de Westcon Datasheets Verticales FY27.',v.references||'']);
    return s;
  }
  async function addVerticalCases(item){
    var v=verticalModel(item.vertical,item.area),s=pptx.addSlide(),h=addHeader(s,item.area,item.vertical,'Casos de uso que mueven la conversación'),accent=h.accent;
    s.addText('CASOS DE USO',{x:.60,y:1.62,w:1.6,h:.14,fontFace:'Arial',fontSize:9,bold:true,color:accent,margin:0});
    (v.cases||[]).slice(0,4).forEach(function(ca,i){
      var col=i%2,row=Math.floor(i/2),x=.60+col*4.18,y=1.91+row*2.08;
      s.addShape(pptx.ShapeType.roundRect,{x:x,y:y,w:3.92,h:1.80,rectRadius:.05,fill:{color:C.white},line:{color:'CBD9DE',pt:.7}});
      s.addShape(pptx.ShapeType.ellipse,{x:x+.18,y:y+.18,w:.37,h:.37,fill:{color:accent},line:{color:accent}});
      s.addText(String(i+1),{x:x+.18,y:y+.28,w:.37,h:.09,fontFace:'Arial',fontSize:7,bold:true,color:C.white,align:'center',margin:0});
      s.addText(ca[0],{x:x+.68,y:y+.20,w:2.93,h:.18,fontFace:'Arial',fontSize:9.8,bold:true,color:C.ink,margin:0,fit:'shrink'});
      s.addText(ca[1],{x:x+.20,y:y+.70,w:3.48,h:.54,fontFace:'Arial',fontSize:8.5,color:'3A5661',margin:0,fit:'shrink'});
      var sol=(v.solutions||[])[i]||['',[]];
      s.addText(sol[0],{x:x+.20,y:y+1.43,w:1.25,h:.11,fontFace:'Arial',fontSize:6.8,bold:true,color:accent,margin:0,fit:'shrink'});
      s.addText((sol[1]||[]).join(' · '),{x:x+1.35,y:y+1.40,w:2.30,h:.15,fontFace:'Arial',fontSize:6.8,bold:true,color:C.ink,margin:0,fit:'shrink'});
    });
    s.addText('CÓMO LO RESOLVEMOS',{x:8.95,y:1.62,w:2.1,h:.14,fontFace:'Arial',fontSize:9,bold:true,color:accent,margin:0});
    for(var j=0;j<Math.min(4,(v.solutions||[]).length);j++){
      var sol2=v.solutions[j],yy=1.91+j*1.18;
      s.addShape(pptx.ShapeType.roundRect,{x:8.95,y:yy,w:3.78,h:1.02,rectRadius:.05,fill:{color:C.white},line:{color:'CBD9DE',pt:.7}});
      s.addText(sol2[0],{x:9.12,y:yy+.16,w:1.25,h:.13,fontFace:'Arial',fontSize:7.5,bold:true,color:accent,margin:0,fit:'shrink'});
      var names=(sol2[1]||[]).slice(0,4);
      var startX=10.30,boxW=.58,gap=.07;
      for(var k=0;k<names.length;k++){
        var bx=startX+k*(boxW+gap);
        s.addShape(pptx.ShapeType.roundRect,{x:bx,y:yy+.17,w:boxW,h:.54,rectRadius:.03,fill:{color:'FAFCFD'},line:{color:'D8E3E7',pt:.4}});
        await addLogo(s,names[k],bx+.04,yy+.23,boxW-.08,.42);
      }
      if(names.length===0)s.addText('Portfolio Westcon',{x:10.30,y:yy+.36,w:2.1,h:.12,fontFace:'Arial',fontSize:7.2,color:C.muted,margin:0});
    }
    s.addShape(pptx.ShapeType.roundRect,{x:.60,y:6.18,w:12.13,h:.62,rectRadius:.05,fill:{color:C.navy},line:{color:C.navy}});
    s.addText('WESTCON ACELERA  ·  Preventa y diseño  ·  3D Labs  ·  PoC / PoV  ·  Servicios profesionales y lifecycle',{x:.90,y:6.39,w:11.55,h:.13,fontFace:'Arial',fontSize:8.6,bold:true,color:C.white,align:'center',margin:0,fit:'shrink'});
    addFooter(s,'2/3');addNotes(s,['Contenido estructurado a partir de Westcon Datasheets Verticales FY27.',v.references||'']);
    return s;
  }
  async function addVerticalAction(item){
    var v=verticalModel(item.vertical,item.area),s=pptx.addSlide(),h=addHeader(s,item.area,item.vertical,'Cómo empezar y convertir el caso de uso en una oportunidad'),accent=h.accent;
    s.addText('CÓMO EMPEZAR',{x:.60,y:1.64,w:1.6,h:.14,fontFace:'Arial',fontSize:9,bold:true,color:accent,margin:0});
    (v.start||[]).slice(0,3).forEach(function(t,i){
      var x=.60+i*4.06;
      s.addShape(pptx.ShapeType.roundRect,{x:x,y:1.94,w:3.76,h:1.02,rectRadius:.05,fill:{color:C.white},line:{color:'CBD9DE',pt:.7}});
      s.addShape(pptx.ShapeType.ellipse,{x:x+.20,y:2.17,w:.39,h:.39,fill:{color:accent},line:{color:accent}});
      s.addText(String(i+1),{x:x+.20,y:2.28,w:.39,h:.09,fontFace:'Arial',fontSize:7,bold:true,color:C.white,align:'center',margin:0});
      s.addText(t,{x:x+.75,y:2.13,w:2.68,h:.31,fontFace:'Arial',fontSize:9.6,bold:true,color:C.ink,margin:0,fit:'shrink'});
    });
    s.addText('IMPACTO ESPERADO',{x:.60,y:3.30,w:1.95,h:.14,fontFace:'Arial',fontSize:9,bold:true,color:accent,margin:0});
    s.addShape(pptx.ShapeType.roundRect,{x:.60,y:3.58,w:5.75,h:2.32,rectRadius:.05,fill:{color:C.white},line:{color:'CBD9DE',pt:.7}});
    addImpactBars(s,v,.92,3.90,5.05,accent);
    s.addText('WESTCON ACELERA',{x:6.72,y:3.30,w:1.8,h:.14,fontFace:'Arial',fontSize:9,bold:true,color:accent,margin:0});
    var wc=[
      ['PREVENTA Y DISEÑO','Arquitectura, RFI/RFP y especialistas de fabricante.'],
      ['3D LABS','Demos y laboratorios para probar antes de desplegar.'],
      ['PoC / PoV','Criterios de éxito y validación técnica medible.'],
      ['LIFECYCLE','Staging, despliegue, soporte y Customer Success.']
    ];
    wc.forEach(function(it,i){
      var col=i%2,row=Math.floor(i/2),x=6.72+col*2.95,y=3.58+row*1.14;
      s.addShape(pptx.ShapeType.roundRect,{x:x,y:y,w:2.72,h:.96,rectRadius:.05,fill:{color:C.navy},line:{color:accent,pt:.7}});
      s.addText(it[0],{x:x+.15,y:y+.16,w:2.3,h:.12,fontFace:'Arial',fontSize:7.2,bold:true,color:accent,margin:0});
      s.addText(it[1],{x:x+.15,y:y+.43,w:2.38,h:.27,fontFace:'Arial',fontSize:7.3,color:C.white,margin:0,fit:'shrink'});
    });
    s.addShape(pptx.ShapeType.roundRect,{x:.60,y:6.15,w:8.40,h:.58,rectRadius:.04,fill:{color:accent},line:{color:accent}});
    s.addText('PRÓXIMO PASO RECOMENDADO  ·  '+v.nextStep,{x:.85,y:6.34,w:7.95,h:.12,fontFace:'Arial',fontSize:8.5,bold:true,color:item.area==='cloud'?C.navy:C.white,margin:0,fit:'shrink'});
    s.addShape(pptx.ShapeType.roundRect,{x:9.25,y:6.15,w:3.48,h:.58,rectRadius:.04,fill:{color:item.area==='cyber'?C.pink:item.area==='network'?C.cyanSoft:C.orangeSoft},line:{color:'D8E3E7',pt:.5}});
    s.addText('REFERENCIAS Y FUENTES',{x:9.47,y:6.28,w:1.55,h:.10,fontFace:'Arial',fontSize:6.3,bold:true,color:accent,margin:0});
    s.addText(v.references||'Westcon Datasheets Verticales FY27',{x:10.93,y:6.24,w:1.55,h:.18,fontFace:'Arial',fontSize:5.7,color:C.ink,margin:0,fit:'shrink'});
    addFooter(s,'3/3');addNotes(s,['Contenido estructurado a partir de Westcon Datasheets Verticales FY27.',v.references||'']);
    return s;
  }
  async function addCover(item){
    var s=pptx.addSlide();s.background={color:C.navy};
    if(hero)s.addImage({data:hero,x:7.15,y:0,w:6.18,h:7.5});
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:7.45,h:7.5,fill:{color:C.navy},line:{color:C.navy}});
    if(westconLogo){s.addShape(pptx.ShapeType.roundRect,{x:.55,y:.42,w:1.95,h:.64,fill:{color:C.white},line:{color:C.white}});s.addImage({data:westconLogo,x:.87,y:.54,w:1.32,h:.38})}
    s.addText('WESTCON COMSTOR · FY2027',{x:.58,y:1.61,w:4.8,h:.14,fontFace:'Arial',fontSize:8.5,bold:true,color:C.cyan,charSpacing:1.5,margin:0});
    s.addText(item.title,{x:.58,y:2.04,w:5.85,h:.78,fontFace:'Arial',fontSize:31,bold:true,color:C.white,fit:'shrink',margin:0});
    s.addText(item.subtitle||'',{x:.60,y:3.08,w:5.65,h:.65,fontFace:'Arial',fontSize:16,color:'D8E6EA',fit:'shrink',margin:0});
    s.addShape(pptx.ShapeType.rect,{x:0,y:7.17,w:13.333,h:.33,fill:{color:C.cyan},line:{color:C.cyan}});
    return s;
  }
  async function addCustom(item){
    var s=pptx.addSlide();s.background={color:C.navy2};
    s.addShape(pptx.ShapeType.rect,{x:.40,y:.28,w:12.45,h:.52,fill:{color:'31415C'},line:{color:C.magenta,pt:1}});
    s.addText(item.title,{x:.56,y:.44,w:11.8,h:.18,fontFace:'Arial',fontSize:14,bold:true,color:C.white,margin:0,fit:'shrink'});
    s.addText('MENSAJES CLAVE',{x:.52,y:1.18,w:2.2,h:.16,fontFace:'Arial',fontSize:10,bold:true,color:C.magenta,charSpacing:2,margin:0});
    var lines=String(item.body||'').split(/\n+/).map(function(x){return x.trim()}).filter(Boolean);
    s.addText((lines.length?lines:[item.subtitle||'']).map(function(x){return '•  '+x}).join('\n'),{x:.65,y:1.78,w:11.75,h:4.35,fontFace:'Arial',fontSize:20,color:C.white,fit:'shrink',margin:0});
    s.addShape(pptx.ShapeType.rect,{x:0,y:7.20,w:13.333,h:.30,fill:{color:C.magenta},line:{color:C.magenta}});
    return s;
  }

  for(var i=0;i<state.deck.length;i++){
    var item=state.deck[i];
    if(item.kind==='source'){await addOriginal(item.page);continue}
    if(item.kind==='curated-vendor'){await addVendorSlide(item);continue}
    if(item.kind==='vertical-page'&&item.phase==='context'){await addVerticalContext(item);continue}
    if(item.kind==='vertical-page'&&item.phase==='cases'){await addVerticalCases(item);continue}
    if(item.kind==='vertical-page'&&item.phase==='action'){await addVerticalAction(item);continue}
    if(item.kind==='cover'){await addCover(item);continue}
    if(item.kind==='custom'){await addCustom(item);continue}
  }
  var title=(state.deck.find(function(x){return x.kind==='cover'})||{}).title||'Westcon';
  try{await pptx.writeFile({fileName:slug(title)+'-FY27.pptx'})}catch(e){console.error(e);alert('No se pudo generar el PowerPoint.')}
}

function renderAll(){renderBlocks();renderLibrary();renderDeck()}
function init(){var d=load();if(d&&Array.isArray(d.deck))state.deck=d.deck;bind();renderAll()}
init();
})();