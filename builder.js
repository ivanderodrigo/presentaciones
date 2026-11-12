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
var STORAGE='westcon.presentationBuilder.v5.3';

var C={
  navy:'082C3A',navy2:'17324A',navy3:'123F50',white:'FFFFFF',ink:'173744',
  magenta:'EC008C',cyan:'00C7CD',orange:'F5A800',purple:'7357A6',green:'48A57D',
  light:'F4F7F8',muted:'6D828B',line:'D8E3E7'
};

var CURATED={
  'Cloudflare':{
    accent:'#24507B',pptAccent:'24507B',brandAccent:'#F48120',
    sources:[
      'https://www.cloudflare.com/products/',
      'https://developers.cloudflare.com/reference-architecture/architectures/sase/',
      'https://developers.cloudflare.com/use-cases/application-security/'
    ]
  },
  'Sonar (SonarQube)':{
    accent:'#6C5CA3',pptAccent:'6C5CA3',brandAccent:'#D3121D',
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


var TAXONOMY=(window.WESTCON_TAXONOMY&&window.WESTCON_TAXONOMY.areas)||{};

var VERTICAL_TITLE={
  'Banca y seguros':{left:'BANCA Y\nSEGUROS',main:'BANCA Y SEGUROS',lf:28.7,mf:29.8},
  'Administración pública':{left:'ADMINISTRACIÓN\nPÚBLICA',main:'ADMINISTRACIÓN PÚBLICA',lf:20.0,mf:24.0},
  'Industria y utilities':{left:'INDUSTRIA Y\nUTILITIES',main:'INDUSTRIA Y UTILITIES',lf:21.0,mf:25.0},
  'Retail':{left:'RETAIL',main:'RETAIL',lf:29.0,mf:30.0},
  'Sanidad':{left:'SANIDAD',main:'SANIDAD',lf:29.0,mf:30.0},
  'Educación':{left:'EDUCACIÓN',main:'EDUCACIÓN',lf:27.0,mf:29.0},
  'Transporte y logística':{left:'TRANSPORTE Y\nLOGÍSTICA',main:'TRANSPORTE Y LOGÍSTICA',lf:19.0,mf:23.0},
  'Hostelería y turismo':{left:'HOSTELERÍA Y\nTURISMO',main:'HOSTELERÍA Y TURISMO',lf:19.0,mf:23.0},
  'Software y servicios digitales':{left:'SOFTWARE Y\nSERVICIOS DIGITALES',main:'SOFTWARE Y SERVICIOS DIGITALES',lf:16.5,mf:20.0}
};

var VERTICAL_QUESTION={
  'Banca y seguros':{
    cyber:'¿Qué servicio financiero no puede caer ni exponer datos sensibles?',
    network:'¿Qué sucursal o servicio crítico depende de una red sin margen de fallo?',
    cloud:'¿Qué proceso legacy limita hoy la experiencia o la eficiencia?'
  },
  'Administración pública':{
    cyber:'¿Qué trámite digital no puede caer ni perder trazabilidad?',
    network:'¿Qué servicio público se resiente si falla la conectividad?',
    cloud:'¿Qué trámite sigue consumiendo tiempo por tareas manuales?'
  },
  'Industria y utilities':{
    cyber:'¿Qué activo OT no puede parar ni quedar expuesto?',
    network:'¿Qué proceso industrial necesita conectividad continua y predecible?',
    cloud:'¿Qué proceso de planta ganaría valor con edge, datos o automatización?'
  },
  'Retail':{
    cyber:'¿Qué caída o fraude impactaría hoy directamente en ventas?',
    network:'¿Qué tienda pierde experiencia cuando falla la conectividad?',
    cloud:'¿Qué fricción de cliente o back‑office podemos automatizar?'
  },
  'Sanidad':{
    cyber:'¿Qué servicio clínico no puede caer ni exponer datos del paciente?',
    network:'¿Qué área asistencial depende de Wi‑Fi y segmentación fiables?',
    cloud:'¿Qué tarea administrativa resta hoy tiempo a la atención?'
  },
  'Educación':{
    cyber:'¿Qué identidad o servicio académico sería más costoso comprometer?',
    network:'¿Dónde sufre más la experiencia Wi‑Fi en el campus?',
    cloud:'¿Qué servicio académico necesita escalar sin más operación manual?'
  },
  'Transporte y logística':{
    cyber:'¿Qué hub, API o tercero puede detener la operación si se compromete?',
    network:'¿Qué nodo logístico necesita movilidad y enlaces siempre disponibles?',
    cloud:'¿Qué proceso documental o de datos sigue siendo demasiado manual?'
  },
  'Hostelería y turismo':{
    cyber:'¿Qué fallo en reserva, pago o acceso dañaría antes la experiencia?',
    network:'¿Dónde nota más el huésped una conectividad deficiente?',
    cloud:'¿Qué interacción con el huésped podemos automatizar sin perder contexto?'
  },
  'Software y servicios digitales':{
    cyber:'¿Cómo verificamos más código sin frenar el ritmo de entrega?',
    network:'¿Qué dependencia de red limita una aplicación distribuida?',
    cloud:'¿Qué parte del ciclo de software necesita más elasticidad o automatización?'
  }
};

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
function areaAccent(area){return area==='cyber'?'#D40A82':area==='network'?'#12C7C0':'#F5AE2D'}
function pptAccent(area){return area==='cyber'?'D40A82':area==='network'?'12C7C0':'F5AE2D'}

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
  return sourceSlides().concat(Object.keys(CURATED).map(curatedItem)).concat(allVerticalItems());
}
function itemText(x){
  var extra='';
  if(x.kind==='vertical')extra=JSON.stringify(verticalModel(x.vertical,x.area)||{});
  if(x.kind==='curated-vendor')extra=JSON.stringify(VI.vendors[x.vendor]||{});
  return norm([x.title,x.subtitle,x.area,x.vendor,x.vertical].concat(x.vendors||[],x.tags||[]).join(' ')+' '+extra);
}
function matchesFilter(x){
  if(state.filter==='all')return true;
  if(state.filter==='corporate')return x.kind==='source'&&['corporate','section','taxonomy'].indexOf(x.type)>=0;
  if(state.filter==='service')return x.kind==='source'&&x.type==='service';
  if(state.filter==='vendor')return x.type==='vendor';
  if(state.filter==='vertical')return x.kind==='vertical';
  if(state.filter==='cyber')return (x.kind==='vertical'&&x.area==='cyber') || (x.kind!=='vertical'&&x.type==='vendor'&&norm(x.area).indexOf('ciber')>=0) || (x.kind==='source'&&(x.type==='section'||x.type==='taxonomy')&&areaKey(x.area)==='cyber');
  if(state.filter==='network')return (x.kind==='vertical'&&x.area==='network') || (x.kind!=='vertical'&&x.type==='vendor'&&norm(x.area).indexOf('network')>=0) || (x.kind==='source'&&(x.type==='section'||x.type==='taxonomy')&&areaKey(x.area)==='network');
  if(state.filter==='cloud')return (x.kind==='vertical'&&x.area==='cloud') || (x.kind!=='vertical'&&x.type==='vendor'&&(norm(x.area).indexOf('cloud')>=0||norm(x.area).indexOf('automat')>=0||norm(x.area).indexOf('uc')>=0)) || (x.kind==='source'&&(x.type==='section'||x.type==='taxonomy')&&areaKey(x.area)==='cloud');
  return true;
}
function presentationOrder(item){
  var p=Number(item.page||0),name=vendorName(item),vertical=String(item.vertical||'');
  var vRank=Object.keys(VERTICAL.verticals||{}).sort(function(a,b){return a.localeCompare(b,'es',{sensitivity:'base'})}).indexOf(vertical);
  var cyberNames=vendorSlidesForArea('cyber').map(vendorName);
  var networkNames=vendorSlidesForArea('network').map(vendorName);
  var cloudNames=vendorSlidesForArea('cloud').map(vendorName);
  if(item.kind==='source'&&p>=1&&p<=5)return p;
  if(item.kind==='source'&&(p===6||p===7))return 100+p;
  if(item.type==='vendor'&&norm(item.area).indexOf('ciber')>=0)return 200+Math.max(0,cyberNames.indexOf(name));
  if(item.kind==='vertical'&&item.area==='cyber')return 300+Math.max(0,vRank);
  if(item.kind==='source'&&(p===38||p===39))return 400+p;
  if(item.type==='vendor'&&norm(item.area).indexOf('network')>=0)return 500+Math.max(0,networkNames.indexOf(name));
  if(item.kind==='vertical'&&item.area==='network')return 600+Math.max(0,vRank);
  if(item.kind==='source'&&(p===57||p===58))return 700+p;
  if(item.type==='vendor'&&(norm(item.area).indexOf('cloud')>=0||norm(item.area).indexOf('automat')>=0||norm(item.area).indexOf('uc')>=0))return 800+Math.max(0,cloudNames.indexOf(name));
  if(item.kind==='vertical'&&item.area==='cloud')return 900+Math.max(0,vRank);
  if(item.kind==='source'&&p>=73)return 1000+p;
  return 1200+(p||999);
}
function filteredItems(){
  var q=norm(state.query);
  var items=allItems().filter(matchesFilter).filter(function(x){return !q||itemText(x).indexOf(q)>=0});
  return items.sort(function(a,b){
    var d=presentationOrder(a)-presentationOrder(b);
    if(d)return d;
    if(a.type==='vendor'&&b.type==='vendor')return vendorName(a).localeCompare(vendorName(b),'es',{sensitivity:'base'});
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
function verticalAreaItems(area){
  return Object.keys(VERTICAL.verticals||{}).sort(function(a,b){return a.localeCompare(b,'es',{sensitivity:'base'})}).map(function(v){return verticalItem(v,area)}).filter(Boolean);
}
function areaBlockItems(area){return overviewItems(area).concat(vendorSlidesForArea(area)).concat(verticalAreaItems(area))}
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


function specialPage(page){return [5,7,39,58].indexOf(Number(page))>=0}
function vendorNamesForArea(area){
  return (K.vendors||[]).filter(function(v){
    var a=norm(v.area||'');
    if(area==='cyber')return a.indexOf('ciber')>=0;
    if(area==='network')return a.indexOf('network')>=0;
    return a.indexOf('cloud')>=0||a.indexOf('automat')>=0||a.indexOf('uc')>=0;
  }).map(function(v){return v.name}).sort(function(a,b){return a.localeCompare(b,'es',{sensitivity:'base'})});
}
function logoCardHtml(name){
  var u=logoUrl(name);
  return '<div class="sp-logo-card">'+(u?'<img src="'+esc(u)+'" alt="'+esc(name)+'">':'<span>'+esc(name)+'</span>')+'</div>';
}
function portfolioHtml(full){
  var cyber=vendorNamesForArea('cyber').map(logoCardHtml).join('');
  var network=vendorNamesForArea('network').map(logoCardHtml).join('');
  var cloud=vendorNamesForArea('cloud').map(logoCardHtml).join('');
  return '<div class="'+(full?'preview-generated ':'')+'special-portfolio">'+
    '<h3>PORTFOLIO DE FABRICANTES</h3><p>Visión rápida del portfolio Westcon Comstor España por áreas de especialización</p>'+
    '<section class="sp-cyber"><h4>CIBERSEGURIDAD</h4><div class="sp-logo-grid cyber">'+cyber+'</div></section>'+
    '<section class="sp-network"><h4>NETWORKING</h4><div class="sp-logo-grid network">'+network+'</div></section>'+
    '<section class="sp-cloud"><h4>CLOUD Y OTRAS SOLUCIONES</h4><div class="sp-logo-grid cloud">'+cloud+'</div></section>'+
    '<footer>FY2027 — Westcon Comstor España</footer></div>';
}
function taxonomyHtml(area,full){
  var t=TAXONOMY[area],cards=t.cards.map(function(card){
    return '<article><h4>'+esc(card.title)+'</h4><p>'+esc(card.vendors.join(' · '))+'</p><small>'+esc(card.detail)+'</small></article>';
  }).join('');
  return '<div class="'+(full?'preview-generated ':'')+'special-taxonomy '+area+'">'+
    '<h3>'+esc(t.title)+'</h3><p class="subtitle">'+esc(t.subtitle)+'</p><div class="tax-grid count-'+t.cards.length+'">'+cards+'</div>'+
    '<footer>FY2027 — Westcon Comstor España</footer></div>';
}
function specialSourceHtml(item,full){
  var p=Number(item.page);
  if(p===5)return portfolioHtml(full);
  if(p===7)return taxonomyHtml('cyber',full);
  if(p===39)return taxonomyHtml('network',full);
  if(p===58)return taxonomyHtml('cloud',full);
  return '';
}
function sourceVisualHtml(item,showPage){
  if(specialPage(item.page))return '<div class="source-special">'+specialSourceHtml(item,false)+(showPage?'<span class="thumb-tag">P. '+item.page+'</span>':'')+'</div>';
  return '<div class="source-visual"><img src="'+esc(item.asset)+'" alt="'+esc(item.title||'')+'">'+(showPage?'<span class="thumb-tag">P. '+item.page+'</span>':'')+'</div>';
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


function verticalMeta(name){return VERTICAL_TITLE[name]||{left:String(name||'').toUpperCase(),main:String(name||'').toUpperCase(),lf:24,mf:26}}
function verticalQuestionFor(item){
  var x=VERTICAL_QUESTION[item.vertical]||{};
  return x[item.area]||'¿Qué iniciativa prioritaria podemos convertir en un piloto medible?';
}
function verticalVendors(v){
  var out=[];
  (v.solutions||[]).forEach(function(s){(s[1]||[]).forEach(function(n){if(out.indexOf(n)<0)out.push(n)})});
  return out.slice(0,6);
}
function verticalWhyWin(){
  return ['Portfolio multi-fabricante alineado al caso de uso','PoC, preventa y 3D Labs para demostrar valor','Servicios, FLEX y lifecycle para ampliar la oportunidad'];
}
function verticalThumb(item,full){
  var v=verticalModel(item.vertical,item.area),accent=item.accent||'#D40A82',meta=verticalMeta(item.vertical),lc=(meta.lf/10.7).toFixed(2),mc=(meta.mf/10.7).toFixed(2);
  var sig=(v.why||[]).slice(0,3).map(function(w){return '<div class="vs-signal">'+esc(w[0])+'</div>'}).join('');
  var cases=(v.cases||[]).slice(0,4).map(function(c,i){
    var sol=(v.solutions||[])[i]||['',[]];
    var logos=(sol[1]||[]).slice(0,2).map(function(name){var u=logoUrl(name);return u?'<span><img src="'+esc(u)+'" alt="'+esc(name)+'"></span>':'<span class="name">'+esc(name)+'</span>'}).join('');
    return '<div class="vs-case"><b>'+esc(c[0])+'</b><p>'+esc(c[1])+'</p><div class="vs-logo-row">'+logos+'</div></div>';
  }).join('');
  var quick=(v.start||[]).slice(0,3).map(function(x){return '• '+esc(x)}).join('<br>');
  var why=verticalWhyWin().map(function(x){return '• '+esc(x)}).join('<br>');
  return '<div class="'+(full?'preview-generated ':'')+'vertical-fy27" style="--accent:'+accent+';--left-size:'+lc+'cqw;--main-size:'+mc+'cqw">'+
    '<div class="vs-left"><em>PLAYBOOK SECTORIAL</em><h3>'+esc(meta.left).replace(/\n/g,'<br>')+'</h3><strong>'+esc(areaName(item.area))+'</strong>'+
      '<div class="vs-challenge"><b>ABRE CON</b><span>'+esc(verticalQuestionFor(item))+'</span></div>'+
      '<div class="vs-proof"><b>FABRICANTES CLAVE</b><span>'+esc(verticalVendors(v).join(' · '))+'</span></div></div>'+
    '<div class="vs-main"><div class="vs-area">'+esc(areaName(item.area))+'</div><h3>'+esc(meta.main)+'</h3>'+
      '<div class="vs-westcon"><img src="assets/westcon-comstor.png" alt="Westcon Comstor"></div>'+
      '<h5>SEÑALES DE OPORTUNIDAD</h5><div class="vs-signals">'+sig+'</div>'+
      '<div class="vs-cases">'+cases+'</div>'+
      '<div class="vs-bottom"><div><b>QUICK WINS</b><span>'+quick+'</span></div><div><b>POR QUÉ GANAMOS</b><span>'+why+'</span></div></div>'+
      '<div class="vs-next"><b>SIGUIENTE PASO</b><span>'+esc(v.nextStep)+'</span></div></div>'+
  '</div>';
}

function generatedMini(item){
  var accent=item.kind==='vertical'?item.accent:(CURATED[item.vendor]||{}).accent||'#EC008C';
  return '<div class="deck-mini-generated" style="--accent:'+accent+'">'+esc(item.kind==='vertical'?item.vertical:item.vendor||'PERSONALIZADA')+'</div>';
}
function thumbnail(item){
  if(item.asset)return '<div class="thumb">'+sourceVisualHtml(item,true)+'</div>';
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
    var mini=item.asset?'<div class="deck-thumb">'+sourceVisualHtml(item,false)+'</div>':'<div class="deck-thumb">'+generatedMini(item)+'</div>';
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
  if(item.asset){stage.innerHTML='<div class="preview-source">'+sourceVisualHtml(item,false)+'</div>'}
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


  async function addPortfolioSlide(){
    var s=pptx.addSlide();s.background={color:'1A2E44'};
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:.08,fill:{color:'12C7C0'},line:{color:'12C7C0'}});
    s.addText('PORTFOLIO DE FABRICANTES',{x:.44,y:.22,w:11.9,h:.42,fontFace:'Corbel',fontSize:22,bold:true,color:C.white,margin:0});
    s.addText('Visión rápida del portfolio Westcon Comstor España por áreas de especialización',{x:.44,y:.72,w:11.9,h:.25,fontFace:'Corbel',fontSize:12,color:'D8E5E9',margin:0});

    async function group(title,names,x,y,w,h,cols){
      s.addText(title,{x:x,y:y,w:w,h:.23,fontFace:'Corbel',fontSize:12,bold:true,color:C.white,margin:0});
      s.addShape(pptx.ShapeType.line,{x:x,y:y+.32,w:w,h:0,line:{color:'3CAABE',pt:1.2}});
      var gap=.12, cardW=(w-gap*(cols-1))/cols, rows=Math.ceil(names.length/cols), cardH=Math.min(.55,(h-.52-gap*(rows-1))/rows);
      for(var i=0;i<names.length;i++){
        var col=i%cols,row=Math.floor(i/cols),cx=x+col*(cardW+gap),cy=y+.48+row*(cardH+gap);
        s.addShape(pptx.ShapeType.roundRect,{x:cx,y:cy,w:cardW,h:cardH,rectRadius:.035,fill:{color:C.white},line:{color:'3CAABE',pt:.45}});
        await addLogo(s,names[i],cx+.07,cy+.07,cardW-.14,cardH-.14);
      }
    }
    await group('CIBERSEGURIDAD',vendorNamesForArea('cyber'),.44,1.18,7.15,5.68,4);
    await group('NETWORKING',vendorNamesForArea('network'),8.02,1.18,4.85,2.28,4);
    await group('CLOUD Y OTRAS SOLUCIONES',vendorNamesForArea('cloud'),8.02,3.82,4.85,2.32,3);
    s.addText('FY2027 — Westcon Comstor España',{x:.44,y:7.19,w:3.2,h:.10,fontFace:'Corbel',fontSize:7.5,color:'D8E5E9',margin:0});
    return s;
  }
  async function addTaxonomySlide(area){
    var t=TAXONOMY[area],accent=pptAccent(area),s=pptx.addSlide();s.background={color:'163A50'};
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:.08,fill:{color:accent},line:{color:accent}});
    s.addText(t.title,{x:.72,y:.34,w:11.8,h:.48,fontFace:'Corbel',fontSize:22,bold:true,color:C.white,margin:0,fit:'shrink'});
    s.addText(t.subtitle,{x:.72,y:1.04,w:11.8,h:.24,fontFace:'Corbel',fontSize:11.5,color:'D8E5E9',margin:0,fit:'shrink'});
    var cards=t.cards,n=cards.length;
    var specs=[];
    if(n===7){
      for(var i=0;i<4;i++)specs.push({x:.72+i*3.08,y:1.63,w:2.72,h:2.05});
      for(var j=0;j<3;j++)specs.push({x:1.15+j*4.05,y:4.02,w:3.55,h:2.05});
    }else{
      for(var r=0;r<2;r++)for(var q=0;q<3;q++)specs.push({x:.72+q*4.18,y:1.63+r*2.39,w:3.78,h:2.05});
    }
    for(var k=0;k<cards.length;k++){
      var card=cards[k],sp=specs[k];
      s.addShape(pptx.ShapeType.roundRect,{x:sp.x,y:sp.y,w:sp.w,h:sp.h,rectRadius:.055,fill:{color:'113A50'},line:{color:accent,pt:.75}});
      s.addText(card.title,{x:sp.x+.16,y:sp.y+.16,w:sp.w-.32,h:.30,fontFace:'Corbel',fontSize:12.4,bold:true,color:accent,margin:0,fit:'shrink'});
      s.addText(card.vendors.join(' · '),{x:sp.x+.16,y:sp.y+.63,w:sp.w-.32,h:.60,fontFace:'Corbel',fontSize:9.7,bold:true,color:C.white,margin:0,fit:'shrink'});
      s.addText(card.detail,{x:sp.x+.16,y:sp.y+1.34,w:sp.w-.32,h:.46,fontFace:'Corbel',fontSize:8.3,color:'D8E5E9',margin:0,fit:'shrink'});
    }
    s.addText('FY2027 — Westcon Comstor España',{x:.40,y:7.18,w:3.2,h:.10,fontFace:'Corbel',fontSize:7.5,color:'D8E5E9',margin:0});
    return s;
  }
  async function addOriginal(page){
    if(Number(page)===5)return addPortfolioSlide();
    if(Number(page)===7)return addTaxonomySlide('cyber');
    if(Number(page)===39)return addTaxonomySlide('network');
    if(Number(page)===58)return addTaxonomySlide('cloud');
    var s=pptx.addSlide();s.background={color:C.white};var d=await assetData(sourceAsset(page));s.addImage({data:d,x:0,y:0,w:13.333,h:7.5});return s;
  }
  function addNotes(s,lines){try{s.addNotes(lines.filter(Boolean).join('\n'))}catch(e){}}
  var logoDimCache={};
  async function logoDims(data){
    if(logoDimCache[data])return logoDimCache[data];
    return logoDimCache[data]=await new Promise(function(resolve){
      var im=new Image();
      im.onload=function(){resolve({w:im.naturalWidth||im.width||1,h:im.naturalHeight||im.height||1})};
      im.onerror=function(){resolve({w:1,h:1})};
      im.src=data;
    });
  }
  async function addLogo(s,name,x,y,w,h){
    var u=logoUrl(name);
    if(u){
      try{
        var d=await assetData(u),dim=await logoDims(d),scale=Math.min(w/dim.w,h/dim.h),iw=dim.w*scale,ih=dim.h*scale;
        s.addImage({data:d,x:x+(w-iw)/2,y:y+(h-ih)/2,w:iw,h:ih});
        return;
      }catch(e){}
    }
    s.addText(name,{x:x,y:y+h*.27,w:w,h:h*.46,fontFace:'Corbel',fontSize:7.5,bold:true,color:C.ink,align:'center',valign:'mid',fit:'shrink',margin:0});
  }

  async function addVendorSlide(item){
    var name=item.vendor,p=VI.vendors[name]||{},m=CURATED[name]||{},accent=m.pptAccent||C.purple,s=pptx.addSlide();
    var S=4/3, sc=function(v){return v*S};
    s.background={color:'1A2E44'};
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:sc(3.9),h:7.5,fill:{color:accent},line:{color:accent}});
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:sc(.12),h:7.5,fill:{color:accent},line:{color:accent}});

    s.addText(p.headline||item.title,{x:sc(.35),y:sc(.20),w:sc(3.20),h:sc(.28),fontFace:'Corbel',fontSize:12,bold:true,color:C.white,charSpacing:2.5,margin:0,fit:'shrink'});
    s.addShape(pptx.ShapeType.rect,{x:sc(.25),y:sc(.62),w:sc(3.45),h:sc(1.45),fill:{color:C.white},line:{color:accent,pt:1}});
    await addLogo(s,name,sc(.35),sc(.72),sc(3.25),sc(1.25));
    s.addText(p.tagline||'',{x:sc(.25),y:sc(2.20),w:sc(3.50),h:sc(.65),fontFace:'Corbel',fontSize:16.67,italic:true,color:C.white,margin:0,fit:'shrink'});

    s.addShape(pptx.ShapeType.rect,{x:sc(4.0),y:sc(.15),w:sc(5.85),h:sc(2.38),fill:{color:accent,transparency:93},line:{color:accent,pt:.8}});
    s.addText('¿Qué aporta '+name.replace(' (SonarQube)','')+'?',{x:sc(4.15),y:sc(.22),w:sc(5.55),h:sc(.38),fontFace:'Corbel',fontSize:16,bold:true,color:accent,margin:0,fit:'shrink'});
    s.addText(p.valueProposition||'',{x:sc(4.15),y:sc(.65),w:sc(5.55),h:sc(1.82),fontFace:'Corbel',fontSize:14.67,color:'E7E6E6',margin:0,fit:'shrink'});

    s.addText('VENTAJAS CLAVE PARA TU CLIENTE',{x:sc(4.0),y:sc(2.65),w:sc(5.85),h:sc(.32),fontFace:'Corbel',fontSize:13.6,bold:true,color:C.orange,charSpacing:3.3,margin:0,fit:'shrink'});
    var adv=(p.approvedAdvantages||[]).slice(0,4);
    s.addText(adv.map(function(t){return '•  '+t}).join('\n'),{x:sc(4.0),y:sc(3.0),w:sc(5.80),h:sc(2.35),fontFace:'Corbel',fontSize:14.67,color:'E7E6E6',margin:0,fit:'shrink',breakLine:false,paraSpaceAfterPt:4});

    s.addShape(pptx.ShapeType.rect,{x:sc(.20),y:sc(3.05),w:sc(3.55),h:sc(2.275),fill:{color:'1A2E44',transparency:40},line:{color:accent,pt:.8}});
    s.addShape(pptx.ShapeType.rect,{x:sc(.20),y:sc(3.05),w:sc(3.55),h:sc(.38),fill:{color:'F09E0D',transparency:70},line:{color:'F09E0D',pt:1}});
    s.addText('💼 OPORTUNIDAD PARA EL SOCIO',{x:sc(.30),y:sc(3.10),w:sc(3.35),h:sc(.28),fontFace:'Corbel',fontSize:12,bold:true,color:C.white,margin:0,fit:'shrink'});
    var oy=3.50;
    OPPORTUNITY_LINES.forEach(function(it){
      s.addText([
        {text:'✓ ',options:{bold:true,color:'FFAE00'}},
        {text:it[0],options:{bold:true,color:C.white}},
        {text:': '+it[1],options:{bold:false,color:C.white}}
      ],{x:sc(.30),y:sc(oy),w:sc(3.35),h:sc(.34),fontFace:'Corbel',fontSize:11.47,color:C.white,margin:0,fit:'shrink'});
      oy+=.355;
    });
    s.addShape(pptx.ShapeType.rect,{x:0,y:sc(5.40),w:13.333,h:sc(.225),fill:{color:accent},line:{color:accent}});
    addNotes(s,(m.sources||[]).map(function(x){return 'Fuente oficial: '+x}));
    return s;
  }

  function playbookQuestion(item){return verticalQuestionFor(item);}
  function playbookWhyWin(){
    return ['• Portfolio multi-fabricante alineado al caso de uso','• PoC, preventa y 3D Labs para demostrar valor','• Servicios, FLEX y lifecycle para ampliar la oportunidad'].join('\n');
  }
  async function addVerticalSlide(item){
    var v=verticalModel(item.vertical,item.area),accent=pptAccent(item.area),meta=verticalMeta(item.vertical),s=pptx.addSlide();
    var S=4/3,sc=function(v){return v*S};
    s.background={color:'082335'};

    if(hero){
      s.addImage({data:hero,x:0,y:0,w:sc(2.587),h:7.5});
      s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:sc(2.587),h:7.5,fill:{color:'082335',transparency:34},line:{color:'082335',transparency:100}});
    }else{
      s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:sc(2.587),h:7.5,fill:{color:'0B3140'},line:{color:'0B3140'}});
    }
    s.addShape(pptx.ShapeType.rect,{x:sc(2.542),y:0,w:sc(.045),h:7.5,fill:{color:accent},line:{color:accent}});

    s.addText('PLAYBOOK SECTORIAL',{x:sc(.225),y:sc(.255),w:sc(2.025),h:sc(.165),fontFace:'Arial',fontSize:10.9,bold:true,color:accent,margin:0});
    s.addText(meta.left,{x:sc(.225),y:sc(.540),w:sc(2.115),h:sc(.760),fontFace:'Arial',fontSize:meta.lf,bold:true,color:C.white,margin:0,fit:'shrink',breakLine:false});
    s.addText(areaName(item.area),{x:sc(.225),y:sc(1.400),w:sc(2.115),h:sc(.210),fontFace:'Arial',fontSize:12.8,bold:true,color:C.white,margin:0,fit:'shrink'});

    s.addShape(pptx.ShapeType.roundRect,{x:sc(.180),y:sc(3.615),w:sc(2.212),h:sc(1.005),rectRadius:.05,fill:{color:'082335',transparency:5},line:{color:accent,pt:1}});
    s.addText('ABRE CON',{x:sc(.330),y:sc(3.765),w:sc(.750),h:sc(.135),fontFace:'Arial',fontSize:10.55,bold:true,color:accent,margin:0});
    s.addText(playbookQuestion(item),{x:sc(.330),y:sc(3.975),w:sc(1.845),h:sc(.465),fontFace:'Arial',fontSize:15.8,bold:true,color:C.white,margin:0,fit:'shrink'});
    s.addText('FABRICANTES CLAVE',{x:sc(.270),y:sc(4.710),w:sc(1.50),h:sc(.120),fontFace:'Arial',fontSize:9.4,bold:true,color:accent,margin:0});
    s.addText(verticalVendors(v).join(' · '),{x:sc(.270),y:sc(4.875),w:sc(2.025),h:sc(.255),fontFace:'Arial',fontSize:8.8,color:C.white,margin:0,fit:'shrink'});

    s.addText(areaName(item.area),{x:sc(2.835),y:sc(.210),w:sc(3.375),h:sc(.165),fontFace:'Arial',fontSize:11.47,bold:true,color:accent,margin:0,fit:'shrink'});
    s.addText(meta.main,{x:sc(2.835),y:sc(.412),w:sc(5.025),h:sc(.360),fontFace:'Arial',fontSize:meta.mf,bold:true,color:C.white,margin:0,fit:'shrink'});
    if(westconLogo){
      s.addShape(pptx.ShapeType.roundRect,{x:sc(8.287),y:sc(.165),w:sc(1.462),h:sc(.540),fill:{color:C.white},line:{color:accent,pt:.7},rectRadius:.05});
      s.addImage({data:westconLogo,x:sc(8.363),y:sc(.225),w:sc(1.312),h:sc(.420)});
    }

    s.addText('SEÑALES DE OPORTUNIDAD',{x:sc(2.835),y:sc(.840),w:sc(1.650),h:sc(.135),fontFace:'Arial',fontSize:10.9,bold:true,color:accent,margin:0});
    (v.why||[]).slice(0,3).forEach(function(it,i){
      var x=[2.835,5.130,7.425][i];
      s.addShape(pptx.ShapeType.roundRect,{x:sc(x),y:sc(1.028),w:sc(2.175),h:sc(.315),rectRadius:.04,fill:{color:'113A50'},line:{color:accent,pt:.8}});
      s.addText(it[0],{x:sc(x+.060),y:sc(1.095),w:sc(2.055),h:sc(.135),fontFace:'Arial',fontSize:11.7,bold:true,color:C.white,align:'center',margin:0,fit:'shrink'});
    });

    var caseCoords=[
      {x:2.835,y:1.485},{x:6.285,y:1.485},{x:2.835,y:2.768},{x:6.285,y:2.768}
    ];
    for(var i=0;i<4;i++){
      var ca=(v.cases||[])[i]||['',''],sol=(v.solutions||[])[i]||['',[]],cc=caseCoords[i];
      s.addShape(pptx.ShapeType.roundRect,{x:sc(cc.x),y:sc(cc.y),w:sc(3.315),h:sc(1.147),rectRadius:.06,fill:{color:'113A50'},line:{color:accent,pt:.8}});
      s.addText(ca[0],{x:sc(cc.x+.120),y:sc(cc.y+.090),w:sc(3.075),h:sc(.180),fontFace:'Arial',fontSize:14.33,bold:true,color:accent,margin:0,fit:'shrink'});
      s.addText(ca[1],{x:sc(cc.x+.120),y:sc(cc.y+.315),w:sc(3.075),h:sc(.315),fontFace:'Arial',fontSize:12.15,color:C.white,margin:0,fit:'shrink'});
      var names=(sol[1]||[]).slice(0,2),n=names.length;
      var slotW=1.508,gap=.060,x0=n===1?cc.x+.904:cc.x+.120;
      for(var j=0;j<n;j++){
        var bx=x0+j*(slotW+gap);
        s.addShape(pptx.ShapeType.roundRect,{x:sc(bx),y:sc(cc.y+.795),w:sc(slotW),h:sc(.240),rectRadius:.02,fill:{color:C.white},line:{color:accent,pt:.45}});
        await addLogo(s,names[j],sc(bx+.045),sc(cc.y+.828),sc(slotW-.090),sc(.175));
      }
    }

    s.addShape(pptx.ShapeType.roundRect,{x:sc(2.835),y:sc(4.020),w:sc(3.315),h:sc(.990),rectRadius:.05,fill:{color:'113A50'},line:{color:accent,pt:.8}});
    s.addText('QUICK WINS',{x:sc(2.955),y:sc(4.110),w:sc(.938),h:sc(.135),fontFace:'Arial',fontSize:12.0,bold:true,color:accent,margin:0});
    s.addText((v.start||[]).slice(0,3).map(function(x){return '• '+x}).join('\n'),{x:sc(2.970),y:sc(4.298),w:sc(3.038),h:sc(.600),fontFace:'Arial',fontSize:11.7,color:C.white,margin:0,fit:'shrink'});

    s.addShape(pptx.ShapeType.roundRect,{x:sc(6.285),y:sc(4.020),w:sc(3.315),h:sc(.990),rectRadius:.05,fill:{color:'113A50'},line:{color:accent,pt:.8}});
    s.addText('POR QUÉ GANAMOS',{x:sc(6.405),y:sc(4.110),w:sc(1.312),h:sc(.135),fontFace:'Arial',fontSize:12.0,bold:true,color:accent,margin:0});
    s.addText(playbookWhyWin(),{x:sc(6.420),y:sc(4.298),w:sc(3.038),h:sc(.600),fontFace:'Arial',fontSize:11.7,color:C.white,margin:0,fit:'shrink'});

    s.addShape(pptx.ShapeType.rect,{x:sc(2.835),y:sc(5.175),w:sc(6.765),h:sc(.285),fill:{color:accent},line:{color:accent}});
    s.addText('SIGUIENTE PASO',{x:sc(2.940),y:sc(5.235),w:sc(1.238),h:sc(.120),fontFace:'Arial',fontSize:9.75,bold:true,color:'082335',margin:0});
    s.addText(v.nextStep,{x:sc(4.200),y:sc(5.220),w:sc(5.213),h:sc(.142),fontFace:'Arial',fontSize:12.27,bold:true,color:'082335',align:'center',margin:0,fit:'shrink'});

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