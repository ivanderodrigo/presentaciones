(function(){
'use strict';

var K=window.WESTCON_KNOWLEDGE||{vendors:[]};
var VI=window.WESTCON_VENDOR_INTELLIGENCE||{vendors:{}};
var INDEX=window.WESTCON_SLIDE_INDEX||{slides:[]};
var VERTICAL=window.WESTCON_VERTICAL_CONTENT||{verticals:{}};
var LOGOS=window.WESTCON_VENDOR_LOGOS||{};
var TAXONOMY=(window.WESTCON_TAXONOMY&&window.WESTCON_TAXONOMY.areas)||{};

var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var esc=function(s){return String(s==null?'':s).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})};
var norm=function(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')};
var slug=function(s){return norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'westcon-presentacion'};
var STORAGE='westcon.presentationBuilder.v5.5';

var C={navy:'082335',navy2:'1A2E44',white:'FFFFFF',ink:'173744',magenta:'D40A82',cyan:'12C7C0',orange:'F09E0D',purple:'6C5CA3',blue:'24507B',muted:'D8E5E9'};
var CURATED={
  'Cloudflare':{accent:'#24507B',headline:'APPLICATION SECURITY & SASE',logo:'assets/vendors/cloudflare.svg',template:'assets/source-slides/corporate/slide-14.png'},
  'Sonar (SonarQube)':{accent:'#6C5CA3',headline:'APPLICATION SECURITY & DEVSECOPS',logo:'assets/vendors/sonar.svg',template:'assets/source-slides/corporate/slide-24.png'}
};
var OPPORTUNITY=[
  ['Generar oportunidades','identificar cuentas de alto potencial y completar el portfolio con los fabricantes adecuados.'],
  ['Crear demanda','campañas, webinars, Tech Insights e Intelligent Demand para generar oportunidades reales.'],
  ['Formar al equipo','workshops, certificaciones, SkillBoosts, Tech Xpert y Academy/LMS.'],
  ['Apoyar la preventa','diseño técnico, RFI/RFP, demos, PoC y 3D Lab para demostrar valor.'],
  ['Ampliar la oportunidad','servicios profesionales y soporte, FLEX, marketplaces, SaaS y renovaciones/lifecycle.']
];
var VERTICAL_TITLE={
  'Banca y seguros':{left:'BANCA Y\nSEGUROS',main:'BANCA Y SEGUROS',lf:20,mf:22},
  'Administración pública':{left:'ADMINISTRACIÓN\nPÚBLICA',main:'ADMINISTRACIÓN PÚBLICA',lf:17,mf:19},
  'Industria y utilities':{left:'INDUSTRIA Y\nUTILITIES',main:'INDUSTRIA Y UTILITIES',lf:18,mf:20},
  'Retail':{left:'RETAIL',main:'RETAIL',lf:21,mf:23},
  'Sanidad':{left:'SANIDAD',main:'SANIDAD',lf:21,mf:23},
  'Educación':{left:'EDUCACIÓN',main:'EDUCACIÓN',lf:20,mf:22},
  'Transporte y logística':{left:'TRANSPORTE Y\nLOGÍSTICA',main:'TRANSPORTE Y LOGÍSTICA',lf:16,mf:18},
  'Hostelería y turismo':{left:'HOSTELERÍA Y\nTURISMO',main:'HOSTELERÍA Y TURISMO',lf:16,mf:18},
  'Software y servicios digitales':{left:'SOFTWARE Y\nSERVICIOS DIGITALES',main:'SOFTWARE Y SERVICIOS DIGITALES',lf:14,mf:16}
};
var VERTICAL_QUESTION={
  'Banca y seguros':{cyber:'¿Qué servicio financiero no puede caer ni exponer datos?',network:'¿Qué sede o cajero depende de un único enlace?',cloud:'¿Qué proceso legacy limita hoy la experiencia o la eficiencia?'},
  'Administración pública':{cyber:'¿Qué servicio ciudadano no puede caer ni exponer datos?',network:'¿Qué edificio necesita cobertura y segmentación?',cloud:'¿Qué trámite genera más espera y reproceso?'},
  'Industria y utilities':{cyber:'¿Qué activo o acceso puede parar la planta?',network:'¿Dónde falta conectividad fiable?',cloud:'¿Qué parada o tarea manual limita producción?'},
  'Retail':{cyber:'¿Dónde se pierde margen: fraude, checkout o tienda?',network:'¿Podemos abrir una tienda en días y medir su Wi‑Fi?',cloud:'¿Qué fricción resta conversión y margen?'},
  'Sanidad':{cyber:'¿Qué servicio clínico no puede caer ni exponer datos?',network:'¿Qué área asistencial depende de Wi‑Fi y segmentación?',cloud:'¿Qué tarea administrativa resta tiempo a la atención?'},
  'Educación':{cyber:'¿Qué identidad o servicio académico sería más costoso comprometer?',network:'¿Dónde sufre más la experiencia Wi‑Fi del campus?',cloud:'¿Qué servicio académico necesita escalar sin más operación manual?'},
  'Transporte y logística':{cyber:'¿Qué hub, API o tercero puede detener la operación?',network:'¿Qué nodo logístico necesita movilidad y enlaces siempre disponibles?',cloud:'¿Qué proceso documental sigue siendo demasiado manual?'},
  'Hostelería y turismo':{cyber:'¿Qué fallo en reserva, pago o acceso dañaría antes la experiencia?',network:'¿Dónde nota más el huésped una conectividad deficiente?',cloud:'¿Qué interacción podemos automatizar sin perder contexto?'},
  'Software y servicios digitales':{cyber:'¿Cómo verificamos más código sin frenar la entrega?',network:'¿Qué dependencia de red limita una aplicación distribuida?',cloud:'¿Qué parte del ciclo necesita más elasticidad o automatización?'}
};

var state={deck:[],filter:'all',query:'',drag:null,preview:null};
var visualCache={};
var imageCache={};

function uid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+Math.random()}
function itemKey(x){return [x.kind,x.sourceId||'',x.page||'',x.vendor||'',x.vertical||'',x.area||'',x.title||''].join('|')}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify({deck:state.deck}))}catch(e){}}
function load(){try{return JSON.parse(localStorage.getItem(STORAGE)||'null')}catch(e){return null}}
function inDeck(item){var k=itemKey(item);return state.deck.some(function(x){return itemKey(x)===k})}
function logoUrl(name){return LOGOS[name]||null}
function areaName(a){return a==='cyber'?'CIBERSEGURIDAD':a==='network'?'NETWORKING':'CLOUD, UC Y AUTOMATIZACIÓN'}
function areaAccent(a){return a==='cyber'?'#D40A82':a==='network'?'#12C7C0':'#F5AE2D'}
function areaKey(area){
  var a=norm(area);
  if(a.indexOf('ciber')>=0)return'cyber';
  if(a.indexOf('network')>=0)return'network';
  if(a.indexOf('cloud')>=0||a.indexOf('automat')>=0||a.indexOf('uc')>=0)return'cloud';
  if(a.indexOf('servicio')>=0)return'service';
  return'corporate';
}
function internalSlide(s){
  return s.type==='sector'||s.type==='vertical-datasheet'||/playbook|mensajes clave|abre con|preguntas que abren|uso del slide/i.test((s.title||'')+' '+(s.subtitle||''));
}
function sourceItem(s){return {kind:'source',sourceId:s.id,page:s.page,title:s.title,subtitle:s.subtitle||s.area,asset:s.asset,type:s.type,area:s.area,vendors:s.vendors||[],tags:s.tags||[]}}
function sourceSlides(){return (INDEX.slides||[]).filter(function(s){return !internalSlide(s)&&s.source!=='curated'&&Number(s.page)!==82}).map(sourceItem)}
function sourceByPage(p){var s=(INDEX.slides||[]).find(function(x){return x.source==='corporate'&&Number(x.page)===Number(p)});return s?sourceItem(s):null}
function curatedItem(name){
  var p=VI.vendors&&VI.vendors[name]||{},m=CURATED[name]||{};
  return {kind:'curated-vendor',vendor:name,title:p.headline||m.headline||name,subtitle:p.tagline||'',area:'Ciberseguridad',type:'vendor',tags:[name].concat(p.buyingTriggers||[]),accent:m.accent};
}
function verticalModel(v,a){return VERTICAL.verticals&&VERTICAL.verticals[v]&&VERTICAL.verticals[v][a]||null}
function verticalItem(v,a){var m=verticalModel(v,a);return m?{kind:'vertical',vertical:v,area:a,title:v+' · '+m.areaLabel,subtitle:m.title,type:'vertical',accent:areaAccent(a)}:null}
function verticalAreaItems(a){return Object.keys(VERTICAL.verticals||{}).sort(function(x,y){return x.localeCompare(y,'es',{sensitivity:'base'})}).map(function(v){return verticalItem(v,a)}).filter(Boolean)}
function allVerticalItems(){return ['cyber','network','cloud'].reduce(function(out,a){return out.concat(verticalAreaItems(a))},[])}

function vendorName(x){return x.vendor||(x.vendors&&x.vendors[0])||''}
function vendorSlidesForArea(a){
  var out=(INDEX.slides||[]).filter(function(s){return !internalSlide(s)&&s.source==='corporate'&&s.type==='vendor'&&areaKey(s.area)===a}).map(sourceItem);
  if(a==='cyber')Object.keys(CURATED).forEach(function(n){out.push(curatedItem(n))});
  return out.sort(function(x,y){return vendorName(x).localeCompare(vendorName(y),'es',{sensitivity:'base'})});
}
function overviewItems(a){
  return (INDEX.slides||[]).filter(function(s){return s.source==='corporate'&&(s.type==='section'||s.type==='taxonomy')&&areaKey(s.area)===a}).map(sourceItem).sort(function(x,y){return (x.page||999)-(y.page||999)});
}
function areaBlockItems(a){return overviewItems(a).concat(vendorSlidesForArea(a)).concat(verticalAreaItems(a))}
function baseBlock(){return [1,2,3,4,5].map(sourceByPage).filter(Boolean)}
function serviceBlock(){return sourceSlides().filter(function(x){return Number(x.page)>=73}).sort(function(a,b){return a.page-b.page})}

function allItems(){return sourceSlides().concat(Object.keys(CURATED).map(curatedItem)).concat(allVerticalItems())}
function itemText(x){
  var extra='';
  if(x.kind==='vertical')extra=JSON.stringify(verticalModel(x.vertical,x.area)||{});
  if(x.kind==='curated-vendor')extra=JSON.stringify(VI.vendors[x.vendor]||{});
  return norm([x.title,x.subtitle,x.area,x.vendor,x.vertical].concat(x.vendors||[],x.tags||[]).join(' ')+' '+extra);
}
function matchesFilter(x){
  if(state.filter==='all')return true;
  if(state.filter==='corporate')return x.kind==='source'&&Number(x.page)<=5;
  if(state.filter==='service')return x.kind==='source'&&Number(x.page)>=73;
  if(state.filter==='vendor')return x.type==='vendor';
  if(state.filter==='vertical')return x.kind==='vertical';
  if(state.filter==='cyber')return (x.kind==='vertical'&&x.area==='cyber')||(x.type==='vendor'&&areaKey(x.area)==='cyber')||(x.kind==='source'&&(x.type==='section'||x.type==='taxonomy')&&areaKey(x.area)==='cyber');
  if(state.filter==='network')return (x.kind==='vertical'&&x.area==='network')||(x.type==='vendor'&&areaKey(x.area)==='network')||(x.kind==='source'&&(x.type==='section'||x.type==='taxonomy')&&areaKey(x.area)==='network');
  if(state.filter==='cloud')return (x.kind==='vertical'&&x.area==='cloud')||(x.type==='vendor'&&areaKey(x.area)==='cloud')||(x.kind==='source'&&(x.type==='section'||x.type==='taxonomy')&&areaKey(x.area)==='cloud');
  return true;
}
function presentationOrder(x){
  var p=Number(x.page||0),vr=Object.keys(VERTICAL.verticals||{}).sort(function(a,b){return a.localeCompare(b,'es',{sensitivity:'base'})}).indexOf(x.vertical);
  if(x.kind==='source'&&p>=1&&p<=5)return p;
  if(x.kind==='source'&&(p===6||p===7))return 100+p;
  if(x.type==='vendor'&&areaKey(x.area)==='cyber')return 200+vendorSlidesForArea('cyber').map(vendorName).indexOf(vendorName(x));
  if(x.kind==='vertical'&&x.area==='cyber')return 300+vr;
  if(x.kind==='source'&&(p===38||p===39))return 400+p;
  if(x.type==='vendor'&&areaKey(x.area)==='network')return 500+vendorSlidesForArea('network').map(vendorName).indexOf(vendorName(x));
  if(x.kind==='vertical'&&x.area==='network')return 600+vr;
  if(x.kind==='source'&&(p===57||p===58))return 700+p;
  if(x.type==='vendor'&&areaKey(x.area)==='cloud')return 800+vendorSlidesForArea('cloud').map(vendorName).indexOf(vendorName(x));
  if(x.kind==='vertical'&&x.area==='cloud')return 900+vr;
  if(x.kind==='source'&&p>=73)return 1000+p;
  return 1200+(p||999);
}
function filteredItems(){
  var q=norm(state.query);
  return allItems().filter(matchesFilter).filter(function(x){return !q||itemText(x).indexOf(q)>=0}).sort(function(a,b){
    var d=presentationOrder(a)-presentationOrder(b);if(d)return d;
    return String(a.title).localeCompare(String(b.title),'es',{sensitivity:'base'});
  });
}

function addUnique(items){
  var seen={};state.deck.forEach(function(x){seen[itemKey(x)]=1});
  items.forEach(function(x){if(x&&!seen[itemKey(x)]){state.deck.push(Object.assign({},x,{uid:uid()}));seen[itemKey(x)]=1}});
  renderDeck();renderLibrary();save();
}
function addItem(item){if(!inDeck(item)){state.deck.push(Object.assign({},item,{uid:uid()}));renderDeck();renderLibrary();save()}}
function block(cls,title,desc,items){return {cls:cls,title:title,desc:desc,items:items.filter(Boolean)}}
function matchingVendors(q){q=norm(q);return !q?[]:(K.vendors||[]).filter(function(v){var p=VI.vendors&&VI.vendors[v.name]||{};return norm(v.name+' '+(v.tags||[]).join(' ')+' '+(p.category||'')+' '+(p.tagline||'')).indexOf(q)>=0})}
function matchingVerticals(q){q=norm(q);return !q?[]:Object.keys(VERTICAL.verticals||{}).filter(function(v){return norm(v+' '+JSON.stringify(VERTICAL.verticals[v])).indexOf(q)>=0})}
function themeBlocks(){
  var q=state.query.trim(),out=[];
  if(q){
    matchingVendors(q).slice(0,8).forEach(function(v){var items=vendorSlidesForArea(areaKey(v.area)).filter(function(x){return vendorName(x)===v.name});out.push(block(areaKey(v.area),v.name,(VI.vendors[v.name]||{}).tagline||v.area,items))});
    matchingVerticals(q).slice(0,6).forEach(function(v){out.push(block('vertical',v+' · vertical completo','3 slides: Ciberseguridad, Networking y Cloud/Automatización.',['cyber','network','cloud'].map(function(a){return verticalItem(v,a)})))});
    if(out.length)return out;
  }
  if(state.filter==='vertical')return Object.keys(VERTICAL.verticals||{}).sort(function(a,b){return a.localeCompare(b,'es')}).map(function(v){return block('vertical',v,'3 slides sectoriales.',['cyber','network','cloud'].map(function(a){return verticalItem(v,a)}))});
  if(state.filter==='cyber')return[block('cyber','Ciberseguridad · bloque completo','Sección + taxonomía + fabricantes + verticales.',areaBlockItems('cyber'))];
  if(state.filter==='network')return[block('network','Networking · bloque completo','Sección + taxonomía + fabricantes + verticales.',areaBlockItems('network'))];
  if(state.filter==='cloud')return[block('cloud','Cloud / UC / Automatización · bloque completo','Sección + taxonomía + fabricantes + verticales.',areaBlockItems('cloud'))];
  if(state.filter==='service')return[block('service','Servicios Westcon','Bloque de servicios FY27.',serviceBlock())];
  if(state.filter==='corporate')return[block('','Base Westcon','Portada, quiénes somos, propuesta de valor, Blueprint y portfolio.',baseBlock())];
  return[
    block('','Base Westcon','Portada, quiénes somos, propuesta de valor, Blueprint y portfolio.',baseBlock()),
    block('cyber','Ciberseguridad · completo','Sección + taxonomía + fabricantes + verticales.',areaBlockItems('cyber')),
    block('network','Networking · completo','Sección + taxonomía + fabricantes + verticales.',areaBlockItems('network')),
    block('cloud','Cloud / UC / Automatización · completo','Sección + taxonomía + fabricantes + verticales.',areaBlockItems('cloud')),
    block('service','Servicios Westcon','Servicios FY27 y cierre.',serviceBlock())
  ];
}

/* ---------- deterministic canvas renderer ---------- */
function loadImg(url){
  if(imageCache[url])return imageCache[url];
  imageCache[url]=new Promise(function(resolve,reject){
    var im=new Image();im.onload=function(){resolve(im)};im.onerror=function(){reject(new Error('No se pudo cargar '+url))};im.src=url;
  });
  return imageCache[url];
}
function rgba(hex,a){hex=hex.replace('#','');return 'rgba('+parseInt(hex.slice(0,2),16)+','+parseInt(hex.slice(2,4),16)+','+parseInt(hex.slice(4,6),16)+','+a+')'}
function makeCanvas(mode){var c=document.createElement('canvas');c.width=mode==='full'?1600:640;c.height=mode==='full'?900:360;return c}
function renderer(canvas){
  var ctx=canvas.getContext('2d'),S=canvas.width/10,P=function(x){return x*S},PT=function(pt){return pt*S/72};
  ctx.textBaseline='top';
  function font(pt,bold,italic,family){ctx.font=(italic?'italic ':'')+(bold?'700 ':'400 ')+PT(pt)+'px '+(family||'Arial')}
  function rect(x,y,w,h,fill,stroke,sw,r){var X=P(x),Y=P(y),W=P(w),H=P(h),R=P(r||0);ctx.beginPath();if(R){ctx.roundRect(X,Y,W,H,R)}else{ctx.rect(X,Y,W,H)}if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.lineWidth=P(sw||.008);ctx.strokeStyle=stroke;ctx.stroke()}}
  function lines(text,maxWidth){var out=[];String(text||'').split('\n').forEach(function(par){var words=par.split(/\s+/),line='';if(!words[0]){out.push('');return}words.forEach(function(word){var test=line?line+' '+word:word;if(ctx.measureText(test).width<=maxWidth||!line)line=test;else{out.push(line);line=word}});if(line)out.push(line)});return out}
  function text(text,x,y,w,h,opt){
    opt=opt||{};var pt=opt.pt||10,min=opt.min||pt,lh=opt.lh||1.12,fam=opt.family||'Arial',bold=!!opt.bold,italic=!!opt.italic,align=opt.align||'left',color=opt.color||'#fff',max=P(w),H=P(h),ls;
    for(;pt>=min;pt-=.25){font(pt,bold,italic,fam);ls=lines(text,max);if(ls.length*PT(pt)*lh<=H)break}
    ctx.fillStyle=color;ctx.textAlign=align;
    var xx=align==='center'?P(x+w/2):align==='right'?P(x+w):P(x),yy=P(y),step=PT(pt)*lh;
    ls.forEach(function(line){ctx.fillText(line,xx,yy,max);yy+=step});
    ctx.textAlign='left';return {pt:pt,lines:ls.length,height:yy-P(y)}
  }
  async function contain(url,x,y,w,h,pad){
    if(!url)return;var im=await loadImg(url),pd=P(pad||0),W=P(w)-2*pd,H=P(h)-2*pd,sc=Math.min(W/im.naturalWidth,H/im.naturalHeight),iw=im.naturalWidth*sc,ih=im.naturalHeight*sc;
    ctx.drawImage(im,P(x)+pd+(W-iw)/2,P(y)+pd+(H-ih)/2,iw,ih);
  }
  return {ctx:ctx,P:P,PT:PT,font:font,rect:rect,text:text,contain:contain};
}
async function renderVendor(item,mode){
  var canvas=makeCanvas(mode),r=renderer(canvas),ctx=r.ctx,p=VI.vendors[item.vendor]||{},m=CURATED[item.vendor]||{},accent=m.accent||'#6C5CA3';
  function mix(base,over,a){
    function rgb(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
    var b=rgb(base),o=rgb(over),v=b.map(function(x,i){return Math.round(x*(1-a)+o[i]*a)});
    return '#'+v.map(function(x){return x.toString(16).padStart(2,'0')}).join('');
  }
  var leftBase=mix('#1A2E44',accent,.12),cat=mix(leftBase,accent,.40),rightBox=mix('#1A2E44',accent,.07);
  try{var template=await loadImg(m.template);ctx.drawImage(template,0,0,canvas.width,canvas.height)}catch(e){ctx.fillStyle='#1A2E44';ctx.fillRect(0,0,canvas.width,canvas.height)}
  // Replace only variable regions. The standard partner-opportunity block remains untouched from the FY27 template.
  r.rect(.30,.18,3.30,.32,cat,accent,.008);r.text(p.headline||item.title,.35,.20,3.20,.28,{pt:9,min:8.2,bold:true,family:'Corbel',color:'#fff',lh:1});
  r.rect(.25,.62,3.45,1.45,'#FFFFFF',accent,.008);await r.contain(m.logo||logoUrl(item.vendor),.35,.72,3.25,1.25,.04);
  r.rect(.23,2.16,3.57,.72,leftBase);r.text(p.tagline||'',.25,2.20,3.50,.65,{pt:12.5,min:10.5,italic:true,family:'Corbel',color:'#fff',lh:1.08});
  r.rect(4.14,.20,5.58,.40,rightBox);r.text('¿Qué aporta '+item.vendor.replace(' (SonarQube)','')+'?',4.15,.22,5.55,.38,{pt:12,min:10.5,bold:true,family:'Corbel',color:accent,lh:1});
  r.rect(4.14,.60,5.58,1.87,rightBox);r.text(p.valueProposition||'',4.15,.65,5.55,1.82,{pt:11,min:9.7,family:'Corbel',color:'#E7E6E6',lh:1.15});
  r.rect(3.96,2.93,5.90,2.38,'#1A2E44');
  var adv=(p.approvedAdvantages||[]).slice(0,4),yy=3.00;
  adv.forEach(function(a){
    r.text('•',4.00,yy,.25,.28,{pt:11,family:'Corbel',color:'#E7E6E6'});
    var tx=r.text(a,4.38,yy,5.30,.48,{pt:11,min:9.8,family:'Corbel',color:'#E7E6E6',lh:1.08});
    yy+=Math.max(.42,tx.height/r.P(1)+.055);
  });
  return canvas.toDataURL('image/png');
}
async function drawLogoCard(r,name,x,y,w,h){
  r.rect(x,y,w,h,'#fff','#3CAABE',.006,.035);
  var u=logoUrl(name);
  if(u){try{await r.contain(u,x+.05,y+.04,w-.10,h-.08,.015);return}catch(e){}}
  r.text(name,x+.05,y+.08,w-.10,h-.12,{pt:6.8,min:5.4,bold:true,family:'Arial',color:'#173744',align:'center',lh:1.0});
}
function vendorNamesForArea(area){
  return (K.vendors||[]).filter(function(v){return areaKey(v.area)===area}).map(function(v){return v.name}).sort(function(a,b){return a.localeCompare(b,'es',{sensitivity:'base'})});
}
async function renderPortfolio(mode){
  var canvas=makeCanvas(mode),r=renderer(canvas),ctx=r.ctx;ctx.fillStyle='#1A2E44';ctx.fillRect(0,0,canvas.width,canvas.height);
  r.rect(0,0,10,.06,'#12C7C0');r.text('PORTFOLIO DE FABRICANTES',.35,.23,8.8,.35,{pt:18,bold:true,family:'Corbel'});
  r.text('Westcon Comstor España · FY2027',.35,.67,6,.22,{pt:9,family:'Corbel',color:'#D8E5E9'});
  async function group(title,names,x,y,w,h,cols){
    r.text(title,x,y,w,.20,{pt:9.5,bold:true,family:'Corbel'});r.rect(x,y+.27,w,.015,'#3CAABE');
    var gap=.09,rows=Math.ceil(names.length/cols),cw=(w-gap*(cols-1))/cols,ch=Math.min(.50,(h-.45-gap*(rows-1))/rows);
    for(var i=0;i<names.length;i++){var col=i%cols,row=Math.floor(i/cols);await drawLogoCard(r,names[i],x+col*(cw+gap),y+.42+row*(ch+gap),cw,ch)}
  }
  await group('CIBERSEGURIDAD',vendorNamesForArea('cyber'),.35,1.05,5.65,4.25,4);
  await group('NETWORKING',vendorNamesForArea('network'),6.30,1.05,3.35,1.75,4);
  await group('CLOUD Y OTRAS SOLUCIONES',vendorNamesForArea('cloud'),6.30,3.15,3.35,1.70,3);
  r.text('FY2027 — Westcon Comstor España',.35,5.35,3,.14,{pt:6.8,family:'Corbel',color:'#D8E5E9'});
  return canvas.toDataURL('image/png');
}
async function renderTaxonomy(area,mode){
  var t=TAXONOMY[area],accent=areaAccent(area),canvas=makeCanvas(mode),r=renderer(canvas),ctx=r.ctx;ctx.fillStyle='#163A50';ctx.fillRect(0,0,canvas.width,canvas.height);r.rect(0,0,10,.06,accent);
  r.text(t.title,.55,.30,8.9,.38,{pt:18,min:15,bold:true,family:'Corbel'});r.text(t.subtitle,.55,.82,8.9,.23,{pt:9.4,min:8,family:'Corbel',color:'#D8E5E9'});
  var cards=t.cards||[],specs=[];
  if(cards.length===7){for(var i=0;i<4;i++)specs.push({x:.45+i*2.38,y:1.28,w:2.14,h:1.63});for(var j=0;j<3;j++)specs.push({x:1.02+j*3.00,y:3.28,w:2.65,h:1.63})}
  else{for(var rr=0;rr<2;rr++)for(var cc=0;cc<3;cc++)specs.push({x:.55+cc*3.10,y:1.28+rr*2.00,w:2.78,h:1.63})}
  cards.forEach(function(card,i){var s=specs[i];r.rect(s.x,s.y,s.w,s.h,'#113A50',accent,.006,.055);r.text(card.title,s.x+.12,s.y+.12,s.w-.24,.26,{pt:10,min:8.3,bold:true,family:'Corbel',color:accent});r.text(card.vendors.join(' · '),s.x+.12,s.y+.52,s.w-.24,.48,{pt:7.7,min:6.3,bold:true,family:'Corbel',color:'#fff',lh:1.10});r.text(card.detail,s.x+.12,s.y+1.12,s.w-.24,.35,{pt:6.6,min:5.7,family:'Corbel',color:'#D8E5E9',lh:1.08})});
  r.text('FY2027 — Westcon Comstor España',.35,5.35,3,.14,{pt:6.8,family:'Corbel',color:'#D8E5E9'});
  return canvas.toDataURL('image/png');
}
function verticalMeta(v){return VERTICAL_TITLE[v]||{left:String(v||'').toUpperCase(),main:String(v||'').toUpperCase(),lf:18,mf:20}}
function verticalQuestion(item){var q=VERTICAL_QUESTION[item.vertical]||{};return q[item.area]||'¿Qué iniciativa prioritaria podemos convertir en un piloto medible?'}
function impactText(v){return (v.impacts||[]).slice(0,4).map(function(x){return x[0]+' '+x[1]}).join(' · ')}
async function renderVertical(item,mode){
  var v=verticalModel(item.vertical,item.area),meta=verticalMeta(item.vertical),accent=areaAccent(item.area),canvas=makeCanvas(mode),r=renderer(canvas),ctx=r.ctx;
  ctx.fillStyle='#082335';ctx.fillRect(0,0,canvas.width,canvas.height);
  try{var hero=await loadImg('assets/hero.jpeg');ctx.drawImage(hero,0,0,r.P(2.59),canvas.height);ctx.fillStyle='rgba(8,35,53,.38)';ctx.fillRect(0,0,r.P(2.59),canvas.height)}catch(e){r.rect(0,0,2.59,5.62,'#0B3140')}
  r.rect(2.54,0,.04,5.62,accent);
  r.text('PLAYBOOK SECTORIAL',.23,.26,2.02,.17,{pt:9,bold:true,color:accent});
  r.text(meta.left,.23,.54,2.12,.78,{pt:meta.lf,min:12,bold:true,color:'#fff',lh:.98});
  r.text(areaName(item.area),.23,1.42,2.12,.21,{pt:9.5,min:8,bold:true,color:'#fff'});
  r.rect(.18,3.62,2.21,1.00,'rgba(8,35,53,.94)',accent,.006,.06);
  r.text('ABRE CON',.33,3.76,.75,.14,{pt:8,bold:true,color:accent});
  r.text(verticalQuestion(item),.33,3.97,1.84,.47,{pt:11.5,min:9.3,bold:true,color:'#fff',lh:1.04});
  r.text('IMPACTO ESPERADO',.27,4.71,1.50,.12,{pt:6.9,bold:true,color:accent});
  r.text(impactText(v),.27,4.88,2.02,.28,{pt:6.2,min:5.3,color:'#fff',lh:1.08});
  r.text(areaName(item.area),2.83,.21,3.38,.17,{pt:9,bold:true,color:accent});
  r.text(meta.main,2.83,.41,5.03,.36,{pt:meta.mf,min:14,bold:true,color:'#fff',lh:.98});
  r.rect(8.29,.17,1.46,.54,'#fff',accent,.006,.04);try{await r.contain('assets/westcon-comstor.png',8.36,.22,1.31,.42,.02)}catch(e){}
  r.text('SEÑALES DE OPORTUNIDAD',2.83,.84,1.65,.14,{pt:8,bold:true,color:accent});
  var sigX=[2.83,5.13,7.42];(v.why||[]).slice(0,3).forEach(function(it,i){r.rect(sigX[i],1.03,2.17,.32,'#113A50',accent,.006,.04);r.text(it[0],sigX[i]+.07,1.09,2.06,.14,{pt:8.1,min:6.8,bold:true,align:'center',color:'#fff',lh:1.0})});
  var cases=[{x:2.83,y:1.49},{x:6.29,y:1.49},{x:2.83,y:2.77},{x:6.29,y:2.77}];
  for(var i=0;i<4;i++){
    var ca=(v.cases||[])[i]||['',''],sol=(v.solutions||[])[i]||['',[]],cc=cases[i];r.rect(cc.x,cc.y,3.31,1.15,'#113A50',accent,.006,.06);
    r.text(ca[0],cc.x+.13,cc.y+.08,3.08,.18,{pt:10,min:8.4,bold:true,color:accent,lh:1.0});r.text(ca[1],cc.x+.13,cc.y+.31,3.08,.34,{pt:8.4,min:7.0,color:'#fff',lh:1.06});
    var names=(sol[1]||[]).slice(0,4),bw=.72,g=.06,x0=cc.x+.13;
    for(var j=0;j<4;j++){var bx=x0+j*(bw+g);r.rect(bx,cc.y+.79,bw,.24,'#fff',accent,.004,.02);if(names[j]){var u=logoUrl(names[j]);if(u){try{await r.contain(u,bx+.04,cc.y+.82,bw-.08,.18,.01)}catch(e){r.text(names[j],bx+.03,cc.y+.855,bw-.06,.10,{pt:4.7,min:4,bold:true,color:'#173744',align:'center'})}}}}
  }
  r.rect(2.83,4.02,3.31,.99,'#113A50',accent,.006,.05);r.text('QUICK WINS',2.96,4.11,.94,.14,{pt:8,bold:true,color:accent});r.text((v.start||[]).slice(0,3).map(function(x){return '• '+x}).join('\n'),2.97,4.30,3.04,.60,{pt:7.8,min:6.5,color:'#fff',lh:1.06});
  r.rect(6.29,4.02,3.31,.99,'#113A50',accent,.006,.05);r.text('POR QUÉ GANAMOS',6.41,4.11,1.31,.14,{pt:8,bold:true,color:accent});r.text('• Portfolio multi-fabricante alineado al caso de uso\n• PoC, preventa y 3D Labs para demostrar valor\n• Servicios, FLEX y lifecycle para ampliar la oportunidad',6.42,4.30,3.04,.60,{pt:7.7,min:6.4,color:'#fff',lh:1.06});
  r.rect(2.83,5.17,6.76,.28,accent,accent);r.text('SIGUIENTE PASO',2.94,5.24,1.24,.12,{pt:6.8,bold:true,color:'#082335'});r.text(v.nextStep||'',4.20,5.22,5.21,.14,{pt:8.0,min:6.4,bold:true,color:'#082335',align:'center',lh:1.0});
  return canvas.toDataURL('image/png');
}
function isSpecialPage(page){return [5,7,39,58].indexOf(Number(page))>=0}
async function renderSpecialSource(item,mode){
  var p=Number(item.page);if(p===5)return renderPortfolio(mode);if(p===7)return renderTaxonomy('cyber',mode);if(p===39)return renderTaxonomy('network',mode);if(p===58)return renderTaxonomy('cloud',mode);return item.asset;
}
function visualKey(item,mode){return itemKey(item)+'|'+mode}
async function getVisualSrc(item,mode){
  mode=mode||'thumb';var k=visualKey(item,mode);if(visualCache[k])return visualCache[k];
  var promise;
  if(item.kind==='source'&&!isSpecialPage(item.page))promise=Promise.resolve(item.asset);
  else if(item.kind==='source')promise=renderSpecialSource(item,mode);
  else if(item.kind==='curated-vendor')promise=renderVendor(item,mode);
  else if(item.kind==='vertical')promise=renderVertical(item,mode);
  else promise=Promise.resolve('');
  visualCache[k]=promise;return promise;
}

/* ---------- UI ---------- */
function renderBlocks(){
  var host=$('#themeBlocks');host.innerHTML='';
  themeBlocks().forEach(function(b){var el=document.createElement('article');el.className='theme-block '+b.cls;el.innerHTML='<strong>'+esc(b.title)+'</strong><small>'+esc(b.desc)+'</small><footer><span>'+b.items.length+' slides</span><button type="button">Añadir bloque</button></footer>';$('button',el).onclick=function(){addUnique(b.items)};host.appendChild(el)});
}
function makeThumb(item){
  var d=document.createElement('div');d.className='thumb';d.innerHTML='<div class="visual-placeholder">Cargando…</div><span class="thumb-tag">'+(item.page?'P. '+item.page:item.kind==='vertical'?'VERTICAL':'NUEVA')+'</span>';
  getVisualSrc(item,'thumb').then(function(src){if(!src)return;var im=document.createElement('img');im.alt=item.title;im.src=src;var ph=$('.visual-placeholder',d);if(ph)ph.replaceWith(im)}).catch(function(e){var ph=$('.visual-placeholder',d);if(ph){ph.textContent='Vista no disponible';ph.classList.add('error')}console.error('Visual error',item,e)});
  d.onclick=function(){openPreview(item)};return d;
}
function renderLibrary(){
  var host=$('#libraryGrid');host.innerHTML='';var items=filteredItems();$('#libraryCount').textContent=items.length;
  items.forEach(function(item){
    try{
      var card=document.createElement('article');card.className='slide-card';card.appendChild(makeThumb(item));
      var meta=document.createElement('div');meta.className='slide-meta';var added=inDeck(item);
      meta.innerHTML='<strong>'+esc(item.title)+'</strong><small>'+esc(item.subtitle||'')+'</small><footer><span>'+(item.kind==='vertical'?'Vertical':item.type==='vendor'?'Fabricante':item.type==='service'?'Servicio':'FY27')+'</span><button type="button" '+(added?'disabled':'')+'>'+(added?'Añadida':'＋ Añadir')+'</button></footer>';
      $('button',meta).onclick=function(e){e.stopPropagation();addItem(item)};card.appendChild(meta);host.appendChild(card);
    }catch(e){console.error('Card error',item,e);var fallback=document.createElement('article');fallback.className='slide-card';fallback.innerHTML='<div class="thumb"><div class="visual-placeholder error">Error de miniatura</div></div><div class="slide-meta"><strong>'+esc(item.title)+'</strong></div>';host.appendChild(fallback)}
  });
}
function renderDeck(){
  var host=$('#deckList');host.innerHTML='';$('#emptyDeck').classList.toggle('hidden',state.deck.length>0);$('#deckCount').textContent=state.deck.length;
  state.deck.forEach(function(item,i){
    var row=document.createElement('div');row.className='deck-item';row.draggable=true;row.innerHTML='<div class="deck-num">'+(i+1)+'</div><div class="deck-thumb"><div class="visual-placeholder"></div></div><div class="deck-copy"><strong>'+esc(item.title)+'</strong><small>'+esc(item.subtitle||'')+'</small></div><div class="deck-actions"><button title="Subir">↑</button><button title="Bajar">↓</button><button title="Duplicar">⧉</button><button title="Quitar">×</button></div>';
    getVisualSrc(item,'thumb').then(function(src){if(src){var im=document.createElement('img');im.src=src;im.alt='';$('.deck-thumb',row).innerHTML='';$('.deck-thumb',row).appendChild(im)}}).catch(function(){});
    $('.deck-thumb',row).onclick=function(){openPreview(item)};
    var bs=$$('button',row);bs[0].onclick=function(){move(i,-1)};bs[1].onclick=function(){move(i,1)};bs[2].onclick=function(){duplicate(i)};bs[3].onclick=function(){state.deck.splice(i,1);renderDeck();renderLibrary();save()};
    row.addEventListener('dragstart',function(){state.drag=i;row.classList.add('dragging')});row.addEventListener('dragend',function(){row.classList.remove('dragging')});row.addEventListener('dragover',function(e){e.preventDefault()});row.addEventListener('drop',function(e){e.preventDefault();if(state.drag==null||state.drag===i)return;var x=state.deck.splice(state.drag,1)[0];state.deck.splice(i,0,x);state.drag=null;renderDeck();save()});
    host.appendChild(row);
  });
}
function move(i,d){var j=i+d;if(j<0||j>=state.deck.length)return;var x=state.deck[i];state.deck[i]=state.deck[j];state.deck[j]=x;renderDeck();save()}
function duplicate(i){state.deck.splice(i+1,0,Object.assign({},state.deck[i],{uid:uid()}));renderDeck();save()}
async function openPreview(item){
  state.preview=item;$('#previewTitle').textContent=item.title;$('#previewKicker').textContent=item.kind==='vertical'?'VERTICAL':item.type==='vendor'?'FABRICANTE':'SLIDE FY27';var stage=$('#previewStage');stage.innerHTML='<div class="preview-loading">Generando vista…</div>';
  try{var src=await getVisualSrc(item,'full');stage.innerHTML='';var im=document.createElement('img');im.src=src;im.alt=item.title;stage.appendChild(im)}catch(e){stage.innerHTML='<div class="preview-loading error">No se pudo generar la vista.</div>';console.error(e)}
  $('#previewAddBtn').style.display=inDeck(item)?'none':'inline-flex';$('#previewDialog').showModal();
}
function bind(){
  $('#searchSlides').oninput=function(){state.query=this.value;renderBlocks();renderLibrary()};
  $('#clearSearchBtn').onclick=function(){state.query='';$('#searchSlides').value='';renderBlocks();renderLibrary()};
  $$('#filters button').forEach(function(b){b.onclick=function(){state.filter=b.dataset.filter;$$('#filters button').forEach(function(x){x.classList.toggle('active',x===b)});renderBlocks();renderLibrary()}});
  $('#clearDeckBtn').onclick=function(){state.deck=[];renderDeck();renderLibrary();save()};
  $('#newDeckBtn').onclick=function(){if(!state.deck.length||confirm('¿Empezar una presentación nueva?')){state.deck=[];state.query='';state.filter='all';$('#searchSlides').value='';$$('#filters button').forEach(function(x){x.classList.toggle('active',x.dataset.filter==='all')});renderAll();save()}};
  $('#previewAddBtn').onclick=function(){if(state.preview){addItem(state.preview);$('#previewDialog').close()}};
  $('#closePreviewBtn').onclick=function(){$('#previewDialog').close()};
  $('#personalizeBtn').onclick=function(){$('#personalizeDialog').showModal()};
  $('#addCoverBtn').onclick=function(){var t=$('#coverTitle').value.trim()||'Presentación Westcon Comstor',s=$('#coverSubtitle').value.trim();addItem({kind:'cover',title:t,subtitle:s,type:'custom'});$('#personalizeDialog').close()};
  $('#customSlideBtn').onclick=function(){$('#customDialog').showModal()};
  $('#addCustomBtn').onclick=function(){var t=$('#customTitle').value.trim();if(!t)return;addItem({kind:'custom',title:t,subtitle:'Contenido propio',body:$('#customBody').value.trim(),type:'custom'});$('#customDialog').close();$('#customTitle').value='';$('#customBody').value=''};
  $('#generateBtn').onclick=generatePptx;
}

/* ---------- PPT ---------- */
var assetCache={};
async function assetData(url){if(assetCache[url])return assetCache[url];var rr=await fetch(url);if(!rr.ok)throw new Error('No se pudo cargar '+url);var b=await rr.blob();var d=await new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){res(fr.result)};fr.onerror=rej;fr.readAsDataURL(b)});assetCache[url]=d;return d}
async function generatePptx(){
  if(!state.deck.length){alert('Añade al menos una slide.');return}
  if(typeof PptxGenJS==='undefined'){alert('No se ha cargado PptxGenJS.');return}
  var pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Westcon Comstor España';pptx.company='Westcon Comstor';pptx.subject='Presentación ad-hoc FY2027';pptx.title='Westcon Presentation Builder';pptx.lang='es-ES';pptx.theme={headFontFace:'Arial',bodyFontFace:'Arial',lang:'es-ES'};
  async function addVisual(item){var s=pptx.addSlide(),src=await getVisualSrc(item,'full');s.addImage({data:src,x:0,y:0,w:13.333,h:7.5});return s}
  async function addCover(item){var s=pptx.addSlide();s.background={color:C.navy};var logo=await assetData('assets/westcon-comstor.png');s.addShape(pptx.ShapeType.roundRect,{x:.55,y:.42,w:1.95,h:.64,fill:{color:C.white},line:{color:C.white}});s.addImage({data:logo,x:.87,y:.54,w:1.32,h:.38});s.addText('WESTCON COMSTOR · FY2027',{x:.58,y:1.61,w:4.8,h:.14,fontFace:'Arial',fontSize:8.5,bold:true,color:C.cyan,charSpacing:1.5,margin:0});s.addText(item.title,{x:.58,y:2.04,w:5.85,h:.78,fontFace:'Arial',fontSize:31,bold:true,color:C.white,fit:'shrink',margin:0});s.addText(item.subtitle||'',{x:.60,y:3.08,w:5.65,h:.65,fontFace:'Arial',fontSize:16,color:'D8E6EA',fit:'shrink',margin:0});s.addShape(pptx.ShapeType.rect,{x:0,y:7.17,w:13.333,h:.33,fill:{color:C.cyan},line:{color:C.cyan}})}
  async function addCustom(item){var s=pptx.addSlide();s.background={color:'1A2E44'};s.addText(item.title,{x:.55,y:.55,w:12.0,h:.55,fontFace:'Arial',fontSize:25,bold:true,color:C.white,margin:0,fit:'shrink'});var lines=String(item.body||'').split(/\n+/).map(function(x){return x.trim()}).filter(Boolean);s.addText(lines.map(function(x){return '• '+x}).join('\n'),{x:.75,y:1.55,w:11.6,h:4.7,fontFace:'Arial',fontSize:20,color:C.white,margin:0,fit:'shrink'});s.addShape(pptx.ShapeType.rect,{x:0,y:7.2,w:13.333,h:.3,fill:{color:C.magenta},line:{color:C.magenta}})}
  for(var i=0;i<state.deck.length;i++){var item=state.deck[i];if(item.kind==='cover')await addCover(item);else if(item.kind==='custom')await addCustom(item);else await addVisual(item)}
  var title=(state.deck.find(function(x){return x.kind==='cover'})||{}).title||'Westcon';
  try{await pptx.writeFile({fileName:slug(title)+'-FY27.pptx'})}catch(e){console.error(e);alert('No se pudo generar el PowerPoint.')}
}

function renderAll(){renderBlocks();renderLibrary();renderDeck()}
function init(){var d=load();if(d&&Array.isArray(d.deck))state.deck=d.deck;bind();renderAll()}
init();
})();