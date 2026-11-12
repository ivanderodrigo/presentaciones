(function(){
'use strict';

var K=window.WESTCON_KNOWLEDGE||{vendors:[]};
var VI=window.WESTCON_VENDOR_INTELLIGENCE||{vendors:{}};
var INDEX=window.WESTCON_SLIDE_INDEX||{slides:[]};
var VERTICAL=window.WESTCON_VERTICAL_CONTENT||{verticals:{}};
var LOGOS=window.WESTCON_VENDOR_LOGOS||{};

var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var esc=function(s){return String(s==null?'':s).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})};
var norm=function(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')};
var slug=function(s){return norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'westcon-presentacion'};
var STORAGE='westcon.presentationBuilder.v5.2';

var C={
  navy:'082C3A',navy2:'17324A',navy3:'123F50',white:'FFFFFF',ink:'173744',
  magenta:'EC008C',cyan:'00C7CD',orange:'F5A800',purple:'7357A6',green:'48A57D',
  light:'F4F7F8',muted:'6D828B',line:'D8E3E7'
};

var CURATED={
  'Cloudflare':{
    accent:'#F48120',pptAccent:'F48120',
    sources:[
      'https://www.cloudflare.com/products/',
      'https://developers.cloudflare.com/reference-architecture/architectures/sase/',
      'https://developers.cloudflare.com/use-cases/application-security/'
    ]
  },
  'Sonar (SonarQube)':{
    accent:'#D3121D',pptAccent:'D3121D',
    sources:[
      'https://www.sonarsource.com/products/sonarqube/',
      'https://www.sonarsource.com/resources/library/how-to-check-code-quality-using-sonarqube/'
    ]
  }
};

var OPPORTUNITY_LINES=[
  ['Generar oportunidades','identificar cuentas de alto potencial y completar el portfolio con los fabricantes adecuados.'],
  ['Crear demanda','campañas, webinars, Tech Insights e Intelligent Demand para generar oportunidades reales.'],
  ['Formar al equipo','workshops, certificaciones, SkillBoosts, Tech Xpert y Academy/LMS.'],
  ['Apoyar la preventa','diseño técnico, RFI/RFP, demos, PoC y 3D Lab para demostrar valor.'],
  ['Ampliar la oportunidad','servicios profesionales y soporte, FLEX, marketplaces, SaaS y renovaciones/lifecycle.']
];

var state={deck:[],filter:'all',query:'',drag:null,preview:null};

function uid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+Math.random()}
function key(item){return [item.kind,item.sourceId||'',item.vendor||'',item.vertical||'',item.area||'',item.title||''].join('|')}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify({deck:state.deck}))}catch(e){}}
function load(){try{return JSON.parse(localStorage.getItem(STORAGE)||'null')}catch(e){return null}}
function inDeck(item){var k=key(item);return state.deck.some(function(x){return key(x)===k})}
function logoUrl(name){return LOGOS[name]||null}

function areaKey(area){
  var a=norm(area);
  if(a.indexOf('ciber')>=0)return'cyber';
  if(a.indexOf('network')>=0)return'network';
  if(a.indexOf('cloud')>=0||a.indexOf('automat')>=0||a.indexOf('uc')>=0)return'cloud';
  if(a.indexOf('servicio')>=0)return'service';
  return'corporate';
}
function areaName(area){return area==='cyber'?'CIBERSEGURIDAD':area==='network'?'NETWORKING':'CLOUD, UC Y AUTOMATIZACIÓN'}
function areaAccent(area){return area==='cyber'?'#EC008C':area==='network'?'#00C7CD':'#F5A800'}
function pptAccent(area){return area==='cyber'?C.magenta:area==='network'?C.cyan:C.orange}

function internalSlide(s){
  return s.type==='sector'||s.type==='vertical-datasheet'||/playbook|mensajes clave|abre con|preguntas que abren|uso del slide/i.test((s.title||'')+' '+(s.subtitle||''));
}
function sourceItem(s){
  return {kind:'source',sourceId:s.id,page:s.page,title:s.title,subtitle:s.subtitle||s.area,asset:s.asset,type:s.type,area:s.area,vendors:s.vendors||[],tags:s.tags||[],source:s.source};
}
function sourceSlides(){return (INDEX.slides||[]).filter(function(s){return !internalSlide(s)&&s.source!=='curated'}).map(sourceItem)}
function sourceByPage(p){var s=(INDEX.slides||[]).find(function(x){return x.source==='corporate'&&Number(x.page)===Number(p)});return s?sourceItem(s):null}
function curatedItem(name){
  var p=VI.vendors&&VI.vendors[name]||{},m=CURATED[name]||{};
  return {kind:'curated-vendor',vendor:name,title:p.headline||name,subtitle:p.tagline||p.category||'',area:'Ciberseguridad',type:'vendor',tags:[name].concat(p.buyingTriggers||[]),accent:m.accent||'#7357A6'};
}
function verticalModel(vertical,area){return VERTICAL.verticals&&VERTICAL.verticals[vertical]&&VERTICAL.verticals[vertical][area]||null}
function verticalItem(vertical,area){
  var v=verticalModel(vertical,area);if(!v)return null;
  return {kind:'vertical',vertical:vertical,area:area,title:vertical+' · '+v.areaLabel,subtitle:v.title,type:'vertical',accent:areaAccent(area)};
}
function verticalSectorItems(vertical){return ['cyber','network','cloud'].map(function(a){return verticalItem(vertical,a)}).filter(Boolean)}
function allVerticalItems(){
  var out=[];Object.keys(VERTICAL.verticals||{}).forEach(function(v){out=out.concat(verticalSectorItems(v))});return out;
}

function vendorName(item){
  if(item.vendor)return item.vendor;
  if(item.vendors&&item.vendors.length)return item.vendors[0];
  return '';
}
function allItems(){
  var base=sourceSlides().concat(Object.keys(CURATED).map(curatedItem));
  if(state.filter==='vertical'||state.query.trim())base=base.concat(allVerticalItems());
  return base;
}
function itemText(x){
  var extra='';
  if(x.kind==='vertical')extra=JSON.stringify(verticalModel(x.vertical,x.area)||{});
  if(x.kind==='curated-vendor')extra=JSON.stringify(VI.vendors[x.vendor]||{});
  return norm([x.title,x.subtitle,x.area,x.vendor,x.vertical].concat(x.vendors||[],x.tags||[]).join(' ')+' '+extra);
}
function matchesFilter(x){
  if(state.filter==='all')return x.kind!=='vertical';
  if(state.filter==='corporate')return x.kind==='source'&&['corporate','section','taxonomy'].indexOf(x.type)>=0;
  if(state.filter==='service')return x.kind==='source'&&x.type==='service';
  if(state.filter==='vendor')return x.type==='vendor';
  if(state.filter==='vertical')return x.kind==='vertical';
  if(state.filter==='cyber')return x.kind!=='vertical'&&x.type==='vendor'&&norm(x.area).indexOf('ciber')>=0 || x.kind==='source'&&(x.type==='section'||x.type==='taxonomy')&&areaKey(x.area)==='cyber';
  if(state.filter==='network')return x.kind!=='vertical'&&x.type==='vendor'&&norm(x.area).indexOf('network')>=0 || x.kind==='source'&&(x.type==='section'||x.type==='taxonomy')&&areaKey(x.area)==='network';
  if(state.filter==='cloud')return x.kind!=='vertical'&&x.type==='vendor'&&(norm(x.area).indexOf('cloud')>=0||norm(x.area).indexOf('automat')>=0||norm(x.area).indexOf('uc')>=0) || x.kind==='source'&&(x.type==='section'||x.type==='taxonomy')&&areaKey(x.area)==='cloud';
  return true;
}
function filteredItems(){
  var q=norm(state.query);
  var items=allItems().filter(matchesFilter).filter(function(x){return !q||itemText(x).indexOf(q)>=0});
  return items.sort(function(a,b){
    var aIntro=a.kind==='source'&&(a.type==='section'||a.type==='taxonomy');
    var bIntro=b.kind==='source'&&(b.type==='section'||b.type==='taxonomy');
    if(aIntro!==bIntro)return aIntro?-1:1;
    if(aIntro&&bIntro)return (a.page||999)-(b.page||999);
    if(a.type==='vendor'&&b.type==='vendor')return vendorName(a).localeCompare(vendorName(b),'es',{sensitivity:'base'});
    if(a.kind==='vertical'&&b.kind==='vertical'){
      var v=String(a.vertical).localeCompare(String(b.vertical),'es',{sensitivity:'base'});
      if(v)return v;
      return ['cyber','network','cloud'].indexOf(a.area)-['cyber','network','cloud'].indexOf(b.area);
    }
    if(a.kind==='source'&&b.kind==='source')return (a.page||999)-(b.page||999);
    return String(a.title).localeCompare(String(b.title),'es',{sensitivity:'base'});
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
function vendorSlidesForArea(area){
  var out=(INDEX.slides||[]).filter(function(s){return !internalSlide(s)&&s.source==='corporate'&&s.type==='vendor'&&slideMatchesArea(s,area)}).map(sourceItem);
  Object.keys(CURATED).forEach(function(name){if(area==='cyber')out.push(curatedItem(name))});
  return out.sort(function(a,b){return vendorName(a).localeCompare(vendorName(b),'es',{sensitivity:'base'})});
}
function overviewItems(area){
  return (INDEX.slides||[]).filter(function(s){return s.source==='corporate'&&(s.type==='section'||s.type==='taxonomy')&&areaKey(s.area)===area}).map(sourceItem).sort(function(a,b){return (a.page||999)-(b.page||999)});
}
function areaBlockItems(area){return overviewItems(area).concat(vendorSlidesForArea(area))}
function serviceBlock(){return (INDEX.slides||[]).filter(function(s){return s.source==='corporate'&&s.type==='service'&&Number(s.page)!==82}).map(sourceItem).sort(function(a,b){return (a.page||999)-(b.page||999)})}
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
  return (K.vendors||[]).filter(function(v){
    var p=VI.vendors&&VI.vendors[v.name]||{};
    return norm(v.name+' '+(v.tags||[]).join(' ')+' '+(p.category||'')+' '+(p.tagline||'')+' '+(p.buyingTriggers||[]).join(' ')).indexOf(q)>=0;
  });
}
function matchingVerticals(q){
  q=norm(q);if(!q)return[];
  return Object.keys(VERTICAL.verticals||{}).filter(function(v){return norm(v+' '+JSON.stringify(VERTICAL.verticals[v])).indexOf(q)>=0});
}
function themeBlocks(){
  var q=state.query.trim(),out=[];
  if(q){
    matchingVendors(q).slice(0,8).forEach(function(v){out.push(block(areaKey(v.area),v.name,(VI.vendors[v.name]||{}).tagline||v.area,vendorItems(v.name)))});
    matchingVerticals(q).slice(0,6).forEach(function(v){out.push(block('vertical',v+' · vertical completo','3 slides: Ciberseguridad, Networking y Cloud/Automatización.',verticalSectorItems(v)))});
    if(out.length)return out;
  }
  if(state.filter==='vertical'){
    Object.keys(VERTICAL.verticals||{}).sort(function(a,b){return a.localeCompare(b,'es')}).forEach(function(v){
      out.push(block('vertical',v,'3 slides ricas: Ciberseguridad · Networking · Cloud/Automatización.',verticalSectorItems(v)));
    });
    return out;
  }
  if(state.filter==='vendor'){
    (K.vendors||[]).slice().sort(function(a,b){return a.name.localeCompare(b.name,'es')}).forEach(function(v){
      out.push(block(areaKey(v.area),v.name,(VI.vendors[v.name]||{}).tagline||v.area,vendorItems(v.name)));
    });
    return out.slice(0,18);
  }
  if(state.filter==='cyber')return[block('cyber','Ciberseguridad · bloque completo','Sección + taxonomía + todos los fabricantes de Ciberseguridad en orden alfabético.',areaBlockItems('cyber'))];
  if(state.filter==='network')return[block('network','Networking · bloque completo','Sección + taxonomía + todos los fabricantes de Networking.',areaBlockItems('network'))];
  if(state.filter==='cloud')return[block('cloud','Cloud / UC / Automatización · bloque completo','Sección + taxonomía + todos los fabricantes de esta solución.',areaBlockItems('cloud'))];
  if(state.filter==='service')return[block('service','Servicios Westcon · bloque completo','Todas las slides de servicios FY27 relevantes.',serviceBlock())];
  if(state.filter==='corporate')return[block('','Base Westcon','Portada, quiénes somos, propuesta de valor, Blueprint y portfolio.',baseBlock())];
  return[
    block('','Base Westcon','Portada, quiénes somos, propuesta de valor, Blueprint y portfolio.',baseBlock()),
    block('cyber','Ciberseguridad · completo','Sección + taxonomía + '+vendorSlidesForArea('cyber').length+' fabricantes en orden alfabético.',areaBlockItems('cyber')),
    block('network','Networking · completo','Sección + taxonomía + '+vendorSlidesForArea('network').length+' fabricantes.',areaBlockItems('network')),
    block('cloud','Cloud / UC / Automatización · completo','Sección + taxonomía + '+vendorSlidesForArea('cloud').length+' fabricantes.',areaBlockItems('cloud')),
    block('service','Servicios Westcon · completo','Todo el bloque de servicios FY27.',serviceBlock())
  ];
}

function opportunityHtml(){
  return OPPORTUNITY_LINES.map(function(it){return '<div><b>✓ '+esc(it[0])+':</b> '+esc(it[1])+'</div>'}).join('');
}
function curatedThumb(item,full){
  var p=VI.vendors[item.vendor]||{},m=CURATED[item.vendor]||{},accent=m.accent||'#7357A6',logo=logoUrl(item.vendor);
  return '<div class="'+(full?'preview-generated ':'')+'vendor-fy27" style="--accent:'+accent+'">'+
    '<div class="vf-left">'+
      '<div class="vf-category">'+esc(p.headline||item.title)+'</div>'+
      '<div class="vf-logo">'+(logo?'<img src="'+esc(logo)+'" alt="'+esc(item.vendor)+'">':esc(item.vendor))+'</div>'+
      '<div class="vf-tagline">'+esc(p.tagline||'')+'</div>'+
      '<div class="vf-opportunity"><strong>💼 OPORTUNIDAD PARA EL SOCIO</strong>'+opportunityHtml()+'</div>'+
    '</div>'+
    '<div class="vf-right">'+
      '<div class="vf-value"><h4>¿Qué aporta '+esc(item.vendor.replace(' (SonarQube)',''))+'?</h4><p>'+esc(p.valueProposition||'')+'</p></div>'+
      '<h5>VENTAJAS CLAVE PARA TU CLIENTE</h5>'+
      '<ul>'+(p.approvedAdvantages||[]).slice(0,4).map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>'+
    '</div>'+
    '<div class="vf-bottom"></div>'+
  '</div>';
}

function verticalThumb(item,full){
  var v=verticalModel(item.vertical,item.area),accent=item.accent||'#EC008C';
  var sig=(v.why||[]).slice(0,3).map(function(w){return '<div class="vs-signal">'+esc(w[0])+'</div>'}).join('');
  var cases=(v.cases||[]).slice(0,4).map(function(c,i){
    var sol=(v.solutions||[])[i]||['',[]];
    return '<div class="vs-case"><b>'+esc(c[0])+'</b><span>'+esc(c[1])+'</span><small>'+esc((sol[1]||[]).join(' · '))+'</small></div>';
  }).join('');
  var impact=(v.impacts||[]).slice(0,4).map(function(x){return '<span>'+esc(x[0])+' '+esc(x[1])+'</span>'}).join('');
  return '<div class="'+(full?'preview-generated ':'')+'vertical-fy27" style="--accent:'+accent+'">'+
    '<div class="vs-left"><em>SOLUCIÓN SECTORIAL</em><h3>'+esc(item.vertical)+'</h3><strong>'+esc(areaName(item.area))+'</strong><div class="vs-challenge"><b>EL RETO</b><span>'+esc(v.challenge)+'</span></div></div>'+
    '<div class="vs-main"><div class="vs-area">'+esc(areaName(item.area))+'</div><h3>'+esc(item.vertical)+'</h3><div class="vs-signals">'+sig+'</div><div class="vs-cases">'+cases+'</div><div class="vs-bottom"><div><b>CÓMO EMPEZAR</b><span>'+esc((v.start||[]).join(' · '))+'</span></div><div><b>IMPACTO ESPERADO</b><span>'+impact+'</span></div></div><div class="vs-next">SIGUIENTE PASO · '+esc(v.nextStep)+'</div></div>'+
  '</div>';
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
    var label=item.kind==='vertical'?'Vertical':item.kind==='curated-vendor'?'Fabricante':item.type==='service'?'Servicio':item.type==='vendor'?'Fabricante':'FY27';
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
  $('#previewKicker').textContent=item.kind==='vertical'?'VERTICAL':item.kind==='curated-vendor'?'FABRICANTE':'SLIDE FY27';
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
  var westconLogo=null,hero=null;try{westconLogo=await assetData('assets/westcon-comstor.png')}catch(e){}try{hero=await assetData('assets/hero.jpeg')}catch(e){}

  async function addOriginal(page){
    var s=pptx.addSlide();s.background={color:C.white};var d=await assetData(sourceAsset(page));s.addImage({data:d,x:0,y:0,w:13.333,h:7.5});return s;
  }
  function addNotes(s,lines){try{s.addNotes(lines.filter(Boolean).join('\n'))}catch(e){}}
  async function addLogo(s,name,x,y,w,h){
    var u=logoUrl(name);
    if(u){
      try{var d=await assetData(u);s.addImage({data:d,x:x,y:y,w:w,h:h});return}catch(e){}
    }
    s.addText(name,{x:x,y:y+h*.27,w:w,h:h*.46,fontFace:'Arial',fontSize:7.5,bold:true,color:C.ink,align:'center',valign:'mid',fit:'shrink',margin:0});
  }

  async function addVendorSlide(item){
    var name=item.vendor,p=VI.vendors[name]||{},m=CURATED[name]||{},accent=m.pptAccent||C.purple,s=pptx.addSlide();
    s.background={color:'17324A'};
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:5.28,h:7.18,fill:{color:'20354C'},line:{color:'20354C'}});
    s.addShape(pptx.ShapeType.line,{x:5.28,y:0,w:0,h:7.18,line:{color:accent,pt:1.2}});
    s.addShape(pptx.ShapeType.rect,{x:0,y:7.18,w:13.333,h:.32,fill:{color:accent},line:{color:accent}});

    s.addShape(pptx.ShapeType.rect,{x:.40,y:.24,w:4.48,h:.44,fill:{color:'31415C'},line:{color:accent,pt:.8}});
    s.addText(p.headline||item.title,{x:.50,y:.37,w:4.25,h:.13,fontFace:'Arial',fontSize:10,bold:true,color:C.white,charSpacing:2,margin:0,fit:'shrink'});

    s.addShape(pptx.ShapeType.rect,{x:.34,y:.83,w:4.62,h:1.94,fill:{color:'F7F7F7'},line:{color:accent,pt:.8}});
    await addLogo(s,name,.70,1.12,3.90,1.30);

    s.addText(p.tagline||'',{x:.38,y:3.10,w:4.48,h:.56,fontFace:'Arial',fontSize:14.2,italic:true,color:C.white,margin:0,fit:'shrink'});

    s.addShape(pptx.ShapeType.rect,{x:.26,y:4.03,w:4.80,h:.50,fill:{color:'695A34'},line:{color:C.orange,pt:1}});
    s.addText('💼 OPORTUNIDAD PARA EL SOCIO',{x:.45,y:4.18,w:4.15,h:.14,fontFace:'Arial',fontSize:9.4,bold:true,color:C.white,margin:0});
    s.addShape(pptx.ShapeType.rect,{x:.26,y:4.53,w:4.80,h:2.52,fill:{color:'1C304A'},line:{color:accent,pt:.85}});

    var y=4.68;
    OPPORTUNITY_LINES.forEach(function(it){
      s.addText('✓ '+it[0]+':',{x:.43,y:y,w:1.70,h:.16,fontFace:'Arial',fontSize:8.7,bold:true,color:C.white,margin:0,fit:'shrink'});
      s.addText(it[1],{x:2.00,y:y,w:2.78,h:.32,fontFace:'Arial',fontSize:8.5,color:C.white,margin:0,fit:'shrink'});
      y+=.43;
    });

    s.addShape(pptx.ShapeType.rect,{x:5.42,y:.20,w:7.91,h:3.20,fill:{color:'243650'},line:{color:accent,pt:.9}});
    s.addText('¿Qué aporta '+name.replace(' (SonarQube)','')+'?',{x:5.65,y:.46,w:6.9,h:.27,fontFace:'Arial',fontSize:14.5,bold:true,color:accent,margin:0});
    s.addText(p.valueProposition||'',{x:5.66,y:1.50,w:7.02,h:1.06,fontFace:'Arial',fontSize:12.4,color:'E8ECEF',margin:0,fit:'shrink'});

    s.addText('VENTAJAS CLAVE PARA TU CLIENTE',{x:5.44,y:3.67,w:6.95,h:.20,fontFace:'Arial',fontSize:10.6,bold:true,color:C.orange,charSpacing:3,margin:0});
    var adv=(p.approvedAdvantages||[]).slice(0,4);
    var ay=5.05;
    adv.forEach(function(t){
      s.addText('•',{x:5.44,y:ay,w:.18,h:.13,fontFace:'Arial',fontSize:12,color:C.white,margin:0});
      s.addText(t,{x:5.95,y:ay-.01,w:6.82,h:.34,fontFace:'Arial',fontSize:11.3,color:'E3E6E9',margin:0,fit:'shrink'});
      ay+=.38;
    });
    addNotes(s,(m.sources||[]).map(function(x){return 'Fuente oficial: '+x}));
    return s;
  }

  function addPlaybookLeft(s,item,v,accent){
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:3.47,h:7.50,fill:{color:'092D3A'},line:{color:'092D3A'}});
    if(hero){
      s.addImage({data:hero,x:0,y:2.05,w:3.47,h:5.45});
      s.addShape(pptx.ShapeType.rect,{x:0,y:2.05,w:3.47,h:5.45,fill:{color:'062B38',transparency:28},line:{color:'062B38',transparency:100}});
    }
    s.addShape(pptx.ShapeType.rect,{x:3.44,y:0,w:.04,h:7.50,fill:{color:accent},line:{color:accent}});
    s.addText('SOLUCIÓN SECTORIAL',{x:.30,y:.36,w:2.25,h:.14,fontFace:'Arial',fontSize:9,bold:true,color:accent,charSpacing:1.1,margin:0});
    s.addText(item.vertical.toUpperCase(),{x:.30,y:.81,w:2.85,h:.78,fontFace:'Arial',fontSize:25,bold:true,color:C.white,fit:'shrink',margin:0});
    s.addText(areaName(item.area),{x:.30,y:1.64,w:2.65,h:.45,fontFace:'Arial',fontSize:13,bold:true,color:C.white,fit:'shrink',margin:0});

    s.addShape(pptx.ShapeType.roundRect,{x:.23,y:4.70,w:2.96,h:1.56,rectRadius:.05,fill:{color:'082C3A',transparency:5},line:{color:accent,pt:1}});
    s.addText('EL RETO',{x:.43,y:4.98,w:.85,h:.12,fontFace:'Arial',fontSize:8,bold:true,color:accent,margin:0});
    s.addText(v.challenge,{x:.43,y:5.32,w:2.48,h:.65,fontFace:'Arial',fontSize:10.4,bold:true,color:C.white,fit:'shrink',margin:0});

    if(westconLogo){
      s.addShape(pptx.ShapeType.roundRect,{x:.31,y:6.65,w:2.50,h:.43,fill:{color:C.white},line:{color:accent,pt:.5}});
      s.addImage({data:westconLogo,x:.74,y:6.75,w:1.65,h:.23});
    }
  }

  async function addVerticalSlide(item){
    var v=verticalModel(item.vertical,item.area),accent=pptAccent(item.area),s=pptx.addSlide();
    s.background={color:C.navy};
    addPlaybookLeft(s,item,v,accent);

    s.addText(areaName(item.area),{x:3.86,y:.30,w:3.2,h:.15,fontFace:'Arial',fontSize:9.5,bold:true,color:accent,charSpacing:.5,margin:0});
    s.addText(item.vertical.toUpperCase(),{x:3.86,y:.66,w:6.75,h:.40,fontFace:'Arial',fontSize:24,bold:true,color:C.white,margin:0,fit:'shrink'});
    if(westconLogo){
      s.addShape(pptx.ShapeType.roundRect,{x:11.20,y:.24,w:1.70,h:.58,fill:{color:C.white},line:{color:accent,pt:.6}});
      s.addImage({data:westconLogo,x:11.51,y:.36,w:1.08,h:.29});
    }

    s.addText('SEÑALES DE OPORTUNIDAD',{x:3.86,y:1.18,w:2.35,h:.13,fontFace:'Arial',fontSize:8.5,bold:true,color:accent,margin:0});
    (v.why||[]).slice(0,3).forEach(function(it,i){
      var x=3.86+i*3.07;
      s.addShape(pptx.ShapeType.roundRect,{x:x,y:1.39,w:2.84,h:.44,rectRadius:.04,fill:{color:'123F50'},line:{color:accent,pt:.8}});
      s.addText(it[0],{x:x+.12,y:1.51,w:2.60,h:.13,fontFace:'Arial',fontSize:8.3,bold:true,color:C.white,align:'center',margin:0,fit:'shrink'});
    });

    for(var i=0;i<4;i++){
      var ca=(v.cases||[])[i]||['',''],sol=(v.solutions||[])[i]||['',[]];
      var col=i%2,row=Math.floor(i/2),x=3.86+col*4.47,y=2.03+row*1.66;
      s.addShape(pptx.ShapeType.roundRect,{x:x,y:y,w:4.22,h:1.45,rectRadius:.06,fill:{color:'123F50'},line:{color:accent,pt:.8}});
      s.addText(ca[0],{x:x+.17,y:y+.16,w:3.75,h:.17,fontFace:'Arial',fontSize:10,bold:true,color:accent,margin:0,fit:'shrink'});
      s.addText(ca[1],{x:x+.17,y:y+.48,w:3.75,h:.40,fontFace:'Arial',fontSize:8.5,color:C.white,margin:0,fit:'shrink'});
      var names=(sol[1]||[]).slice(0,4),n=names.length,boxW=n<=2?1.70:n===3?1.13:.84,gap=.08,start=x+.17;
      for(var j=0;j<n;j++){
        var bx=start+j*(boxW+gap);
        s.addShape(pptx.ShapeType.roundRect,{x:bx,y:y+1.02,w:boxW,h:.28,rectRadius:.02,fill:{color:C.white},line:{color:accent,pt:.35}});
        await addLogo(s,names[j],bx+.04,y+1.06,boxW-.08,.20);
      }
    }

    s.addShape(pptx.ShapeType.roundRect,{x:3.86,y:5.43,w:4.22,h:1.18,rectRadius:.05,fill:{color:'123F50'},line:{color:accent,pt:.8}});
    s.addText('CÓMO EMPEZAR',{x:4.02,y:5.61,w:1.30,h:.12,fontFace:'Arial',fontSize:7.5,bold:true,color:accent,margin:0});
    s.addText((v.start||[]).slice(0,3).map(function(x){return '• '+x}).join('\n'),{x:4.02,y:5.88,w:3.78,h:.52,fontFace:'Arial',fontSize:8.2,color:C.white,margin:0,fit:'shrink'});

    s.addShape(pptx.ShapeType.roundRect,{x:8.33,y:5.43,w:4.22,h:1.18,rectRadius:.05,fill:{color:'123F50'},line:{color:accent,pt:.8}});
    s.addText('IMPACTO ESPERADO',{x:8.49,y:5.61,w:1.62,h:.12,fontFace:'Arial',fontSize:7.5,bold:true,color:accent,margin:0});
    var impacts=(v.impacts||[]).slice(0,4);
    var ix=8.49,iy=5.93;
    impacts.forEach(function(it,j){
      var cx=ix+(j%2)*1.88,cy=iy+Math.floor(j/2)*.34;
      s.addText(it[0],{x:cx,y:cy,w:1.28,h:.10,fontFace:'Arial',fontSize:6.5,color:C.white,margin:0,fit:'shrink'});
      s.addText(String(it[1]),{x:cx+1.30,y:cy,w:.32,h:.10,fontFace:'Arial',fontSize:6.8,bold:true,color:accent,align:'right',margin:0});
    });

    s.addShape(pptx.ShapeType.rect,{x:3.86,y:6.82,w:8.69,h:.40,fill:{color:accent},line:{color:accent}});
    s.addText('SIGUIENTE PASO',{x:4.02,y:6.95,w:1.22,h:.10,fontFace:'Arial',fontSize:7.2,bold:true,color:item.area==='cloud'?C.navy:C.white,margin:0});
    s.addText(v.nextStep,{x:5.43,y:6.91,w:6.78,h:.17,fontFace:'Arial',fontSize:8.7,bold:true,color:item.area==='cloud'?C.navy:C.white,align:'center',margin:0,fit:'shrink'});

    addNotes(s,['Contenido estructurado a partir de Westcon Datasheets Verticales FY27.',v.references||'']);
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
    if(item.kind==='vertical'){await addVerticalSlide(item);continue}
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