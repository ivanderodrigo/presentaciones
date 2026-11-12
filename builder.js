/* Westcon Presentation Studio v4 — visual ad-hoc deck builder */
(function(){
  'use strict';

  var K=window.WESTCON_KNOWLEDGE||{vendors:[],verticals:[]};
  var VI=window.WESTCON_VENDOR_INTELLIGENCE||{vendors:{}};
  var LIVE=window.WESTCON_LIVE_INTELLIGENCE||{vendors:{}};
  var PARTNERS=window.WESTCON_PARTNER_INTELLIGENCE||{partners:{}};
  var SLIDES=window.WESTCON_SLIDE_INDEX||{slides:[]};
  var VERTICAL=window.WESTCON_VERTICAL_CONTENT||{verticals:{}};

  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var esc=function(s){return String(s==null?'':s).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})};
  var slug=function(s){return String(s||'presentacion').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'presentacion'};
  var STORAGE='westcon.presentationStudio.v4';

  var ROLE_META={
    psm:{label:'PSM',title:'Negocio y relación',impact:'Prioriza una historia ejecutiva: valor conjunto, portfolio, verticales, servicios de crecimiento y próximos pasos.',services:[78,81,80],maxVendorGenerated:1},
    vsm:{label:'VSM',title:'Fabricante y desarrollo',impact:'Prioriza el fabricante: propuesta de valor, diferenciación, evidencia pública y activación de canal.',services:[75,81,77],maxVendorGenerated:2},
    sa:{label:'SA',title:'Solución y prueba',impact:'Prioriza el caso de uso: criterios técnicos, prueba de valor, PoV/PoC y recursos de preventa.',services:[73,74,76],maxVendorGenerated:2}
  };
  var VERTICAL_META={
    'Banca y seguros':'Resiliencia, regulación, continuidad y protección del dato.',
    'Administración pública':'Servicio al ciudadano, ENS/NIS2, trazabilidad y eficiencia.',
    'Industria y utilities':'Continuidad de planta, OT/IoT, edge y conectividad industrial.',
    'Retail':'Disponibilidad de tienda, experiencia, pagos, datos y automatización.'
  };

  var state={deck:[],selectedVendors:new Set(),role:'',vertical:'',filter:'all',dragIndex:null,previewItem:null};

  function uid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+String(Math.random()).slice(2)}
  function context(){return {partner:$('#partner').value.trim(),objective:$('#objective').value.trim(),role:state.role,vertical:state.vertical,vendors:Array.from(state.selectedVendors)}}
  function saveDraft(){try{localStorage.setItem(STORAGE,JSON.stringify({context:context(),deck:state.deck}))}catch(e){}}
  function loadDraft(){try{return JSON.parse(localStorage.getItem(STORAGE)||'null')}catch(e){return null}}
  function vendorByName(name){return (K.vendors||[]).find(function(v){return v.name===name})}
  function vendorIntel(name){return VI&&VI.vendors?VI.vendors[name]||null:null}
  function liveEvidence(name){return (LIVE&&LIVE.vendors&&LIVE.vendors[name]&&LIVE.vendors[name].evidence||[]).filter(function(e){return e&&e.title})}
  function partnerKey(s){return String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
  function partnerIntel(name){return PARTNERS&&PARTNERS.partners?(PARTNERS.partners[partnerKey(name)]||PARTNERS.partners[name]||null):null}
  function vendorLogo(name){return (window.WESTCON_VENDOR_LOGOS&&window.WESTCON_VENDOR_LOGOS[name])||('assets/vendors/'+String(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.png')}

  function evidenceScore(e){
    var text=((e.publisher||'')+' '+(e.url||'')+' '+(e.kind||'')+' '+(e.sourceClass||'')).toLowerCase();
    var s=Number(e.authorityScore||e.score||0);
    if(!s){
      if((e.analysts||[]).length||/gartner|forrester|idc|omdia|gigaom|kuppinger|canalys|\bisg\b/.test(text))s=91;
      else if(/official|vendor/.test(text))s=83;
      else if(/crn|techtarget|computer weekly|network world|darkreading|securityweek|sdxcentral/.test(text))s=77;
      else s=62;
    }
    if(e.publishedAt){
      var age=(Date.now()-new Date(e.publishedAt).getTime())/86400000;
      if(isFinite(age)&&age<365)s+=5;
      if(isFinite(age)&&age>1095)s-=12;
    }
    return s;
  }
  function rankedEvidence(name){
    var seen={};
    return liveEvidence(name).map(function(e){return {e:e,s:evidenceScore(e)}}).filter(function(x){
      var k=String(x.e.title||'').toLowerCase().replace(/\s+/g,' ').trim();
      if(!k||seen[k])return false;seen[k]=1;return x.s>=68;
    }).sort(function(a,b){return b.s-a.s}).map(function(x){return x.e}).slice(0,10);
  }
  function analystEvidence(name){
    return rankedEvidence(name).filter(function(e){return (e.analysts||[]).length||/gartner|forrester|idc|marketscape|omdia|gigaom|kuppinger|canalys|\bisg\b/i.test((e.title||'')+' '+(e.publisher||'')+' '+(e.url||''))}).slice(0,5);
  }
  function evidenceLabel(e){
    if((e.analysts||[]).length)return 'Validación externa';
    var t=((e.kind||'')+' '+(e.sourceClass||'')+' '+(e.title||'')).toLowerCase();
    if(/customer|case|reference|deployment/.test(t))return 'Adopción / referencia';
    if(/partner|channel|certification|specialization/.test(t))return 'Ecosistema y canal';
    if(/launch|innovation|release|roadmap|acquisition/.test(t))return 'Momentum de producto';
    return 'Señal de mercado';
  }
  function evidenceLine(e){
    var date=e.publishedAt?String(e.publishedAt).slice(0,10):'';
    return (e.title||'')+(e.publisher?' · '+e.publisher:'')+(date?' · '+date:'');
  }

  function sourceItem(x){
    return {kind:'source',sourceId:x.id,page:x.page,title:x.title,subtitle:x.subtitle||x.area,asset:x.asset,category:x.type==='vendor'?'vendor':x.type==='service'?'service':'corporate',vendors:x.vendors||[],area:x.area,tags:x.tags||[],type:x.type};
  }
  function sourceByPage(page){var x=(SLIDES.slides||[]).find(function(s){return s.source==='corporate'&&Number(s.page)===Number(page)});return x?sourceItem(x):null}
  function internalSlide(x){
    var title=String(x.title||'').toUpperCase();
    var tags=(x.tags||[]).join(' ').toLowerCase();
    return x.type==='sector'||/PLAYBOOK SECTORIAL|MENSAJES CLAVE|ABRE CON|PREGUNTAS QUE ABREN|USO DEL SLIDE/.test(title)||/playbook|mensajes clave/.test(tags);
  }
  function sourceSlides(){return (SLIDES.slides||[]).filter(function(x){return x.source==='corporate'&&!internalSlide(x)}).map(sourceItem)}
  function vendorAreaKeys(vendors){
    var out=[];
    vendors.forEach(function(n){
      var a=((vendorByName(n)||{}).area||'').toLowerCase();
      if(a.indexOf('ciber')>=0)out.push('cyber');
      if(a.indexOf('network')>=0)out.push('network');
      if(a.indexOf('cloud')>=0||a.indexOf('automat')>=0||a.indexOf('uc')>=0)out.push('cloud');
    });
    return Array.from(new Set(out));
  }
  function relevantVerticalAreas(c){
    var areas=vendorAreaKeys(c.vendors);
    if(areas.length)return areas;
    if(c.role==='sa')return ['network'];
    if(c.role==='vsm')return ['cyber'];
    return ['cyber','network'];
  }

  function vendorStoryModel(name,c){
    var p=vendorIntel(name)||{};
    var verticalAngles=(p.verticalAngles&&c.vertical&&p.verticalAngles[c.vertical])||[];
    var why=Array.from(new Set([].concat(verticalAngles||[],p.buyingTriggers||[]))).slice(0,4);
    var adv=(p.approvedAdvantages||[]).slice(0,4);
    var criteria=(p.decisionCriteria||[]).slice(0,4);
    var value=p.valueProposition||p.positioningFrame||p.tagline||p.category||'';
    var outcome=c.role==='sa'?'Aterrizar el caso de uso y una prueba medible':c.role==='vsm'?'Construir una propuesta de valor defendible con el partner':'Conectar la capacidad con una oportunidad de negocio real';
    if(c.vertical)outcome+=' en '+c.vertical;
    var density=(value?2:0)+why.length+adv.length+criteria.length;
    return {
      kind:'vendor-story',vendor:name,category:'generated',title:name+' · historia de valor',
      subtitle:p.tagline||p.category||'Propuesta de valor y encaje',
      quality:density>=12?'high':density>=8?'medium':'low',
      density:density,
      sections:[
        {title:'PROPUESTA DE VALOR',body:value},
        {title:'POR QUÉ AHORA',bullets:why},
        {title:'DIFERENCIALES',bullets:adv},
        {title:'QUÉ DEBE DEMOSTRAR',bullets:criteria},
        {title:'RESULTADO BUSCADO',body:outcome}
      ]
    };
  }
  function povSteps(p,c){
    var proof=(p.proofThemes||[]).slice(0,4);
    if(proof.length>=3)return proof;
    var criteria=(p.decisionCriteria||[]).slice(0,4);
    return criteria.map(function(x){return 'Validar '+String(x).toLowerCase()});
  }
  function vendorProofModel(name,c){
    var p=vendorIntel(name)||{};
    var ev=rankedEvidence(name);
    var analysts=analystEvidence(name);
    var chosen=(analysts.length?analysts:ev).slice(0,3);
    var proof=povSteps(p,c);
    var criteria=(p.decisionCriteria||[]).slice(0,4);
    var corp=(p.approvedAdvantages||[]).slice(0,3);
    var density=proof.length+criteria.length+corp.length+Math.min(3,chosen.length)*2;
    return {
      kind:'vendor-proof',vendor:name,category:'generated',title:name+' · prueba de valor',
      subtitle:chosen.length?'PoV + evidencia pública atribuible':'PoV medible + evidencia FY27 aprobada',
      quality:density>=13?'high':density>=9?'medium':'low',density:density,evidence:chosen,
      sections:[
        {title:'CÓMO PROBARLO',bullets:proof},
        {title:'QUÉ MEDIR',bullets:criteria},
        {title:'EVIDENCIA FY27',bullets:corp},
        {title:'VALIDACIÓN EXTERNA',bullets:chosen.map(evidenceLine)}
      ]
    };
  }
  function vendorMarketModel(name){
    var ev=rankedEvidence(name).slice(0,5);
    var score=ev.reduce(function(a,e){return a+evidenceScore(e)},0);
    return {
      kind:'vendor-market',vendor:name,category:'generated',title:name+' · señales de mercado',
      subtitle:ev.length+' evidencias públicas de calidad',
      quality:ev.length>=4&&score/Math.max(1,ev.length)>=78?'high':'medium',
      density:ev.length*2,evidence:ev,
      sections:ev.slice(0,4).map(function(e){return {title:evidenceLabel(e).toUpperCase(),body:evidenceLine(e)}})
    };
  }
  function verticalItem(vertical,area){
    var vd=VERTICAL.verticals&&VERTICAL.verticals[vertical]&&VERTICAL.verticals[vertical][area];
    if(!vd)return null;
    return {kind:'vertical',vertical:vertical,area:area,category:'vertical',title:vertical+' · '+vd.areaLabel,subtitle:vd.title,quality:'high',density:15};
  }
  function partnerItem(c){
    var p=partnerIntel(c.partner),ev=(p&&((p.evidence||p.signals)||[]))||[];
    if(ev.length<2)return null;
    return {kind:'partner',category:'generated',title:c.partner+' · contexto relevante',subtitle:ev.length+' señales públicas disponibles',quality:'high',density:ev.length,evidence:ev.slice(0,6)};
  }
  function generatedLibrary(){
    var c=context();
    var out=[
      {kind:'cover',title:'Portada personalizada',subtitle:'Partner, objetivo, fabricantes y vertical',category:'generated',quality:'high'},
      {kind:'agenda',title:'Objetivo y recorrido',subtitle:'Una apertura visual y breve',category:'generated',quality:'high'},
      {kind:'next',title:'Siguientes pasos',subtitle:'Cierre con acción, responsable y fecha',category:'generated',quality:'high'}
    ];
    var pi=partnerItem(c);if(pi)out.push(pi);
    if(c.vertical)relevantVerticalAreas(c).forEach(function(area){var x=verticalItem(c.vertical,area);if(x)out.push(x)});
    c.vendors.forEach(function(v){
      var story=vendorStoryModel(v,c);if(story.density>=8)out.push(story);
      var proof=vendorProofModel(v,c);if(proof.density>=9)out.push(proof);
      var market=vendorMarketModel(v);if(market.evidence&&market.evidence.length>=3)out.push(market);
    });
    out.push({kind:'custom-new',title:'Slide libre',subtitle:'Añade un mensaje propio con el estilo del deck',category:'generated',quality:'high'});
    return out;
  }
  function libraryItems(){return generatedLibrary().concat(sourceSlides())}
  function itemKey(x){return [x.kind,x.sourceId||'',x.vendor||'',x.vertical||'',x.area||'',x.title||''].join('|')}
  function matchesFilter(x){
    if(state.filter==='all')return true;
    if(state.filter==='vertical')return x.kind==='vertical';
    if(state.filter==='generated')return ['cover','agenda','partner','next','vendor-story','vendor-proof','vendor-market','custom-new'].indexOf(x.kind)>=0;
    return x.category===state.filter;
  }
  function qualityLabel(item){
    if(item.kind==='source')return {text:'Original FY27',cls:''};
    if(item.quality==='high')return {text:'Contenido sólido',cls:''};
    if(item.quality==='medium')return {text:'Evidencia útil',cls:'medium'};
    return {text:'Opcional',cls:'medium'};
  }

  function init(){
    var d=loadDraft();
    renderVerticalCards();
    if(d&&d.context){
      $('#partner').value=d.context.partner||'';
      $('#objective').value=d.context.objective||'';
      state.role=d.context.role||'';
      state.vertical=d.context.vertical||'';
      (d.context.vendors||[]).forEach(function(v){state.selectedVendors.add(v)});
      state.deck=Array.isArray(d.deck)?d.deck:[];
    }
    bind();
    renderRoleCards();renderVerticalCards();renderVendors();renderContextImpact();renderQuickBlocks();renderLibrary();renderDeck();
  }
  function bind(){
    ['partner','objective'].forEach(function(id){$('#'+id).addEventListener('input',function(){renderContextImpact();renderQuickBlocks();renderLibrary();saveDraft()})});
    $$('#roleCards .role-card').forEach(function(b){b.addEventListener('click',function(){state.role=state.role===b.dataset.role?'':b.dataset.role;renderRoleCards();renderContextImpact();renderQuickBlocks();renderLibrary();saveDraft()})});
    $('#clearRoleBtn').addEventListener('click',function(){state.role='';renderRoleCards();renderContextImpact();renderQuickBlocks();renderLibrary();saveDraft()});
    $('#clearVerticalBtn').addEventListener('click',function(){state.vertical='';renderVerticalCards();renderContextImpact();renderQuickBlocks();renderLibrary();saveDraft()});
    $('#vendorSearch').addEventListener('input',renderVendors);
    $('#searchSlides').addEventListener('input',renderLibrary);
    $$('#libraryTabs button').forEach(function(b){b.addEventListener('click',function(){state.filter=b.dataset.filter;$$('#libraryTabs button').forEach(function(x){x.classList.toggle('active',x===b)});renderLibrary()})});
    $('#suggestBtn').addEventListener('click',proposeDeck);
    $('#emptyBtn').addEventListener('click',function(){state.deck=[];renderDeck();saveDraft()});
    $('#clearDeckBtn').addEventListener('click',function(){state.deck=[];renderDeck();saveDraft()});
    $('#resetBtn').addEventListener('click',function(){if(!confirm('¿Empezar un deck nuevo y borrar el borrador local?'))return;localStorage.removeItem(STORAGE);location.reload()});
    $('#generateBtn').addEventListener('click',generatePptx);
    $('#addCustomBtn').addEventListener('click',function(){$('#customDialog').showModal()});
    $('#saveCustomBtn').addEventListener('click',function(){var t=$('#customTitle').value.trim();if(!t)return;addToDeck({kind:'custom',title:t,body:$('#customBody').value.trim(),subtitle:'Contenido ad-hoc',category:'generated',quality:'high'});$('#customTitle').value='';$('#customBody').value='';$('#customDialog').close()});
    $('#closePreviewBtn').addEventListener('click',function(){$('#previewDialog').close()});
    $('#previewAddBtn').addEventListener('click',function(){if(state.previewItem){if(state.previewItem.kind==='custom-new'){$('#previewDialog').close();$('#customDialog').showModal()}else addToDeck(state.previewItem)}});
  }

  function renderRoleCards(){
    $$('#roleCards .role-card').forEach(function(b){b.classList.toggle('active',b.dataset.role===state.role)});
  }
  function renderVerticalCards(){
    var host=$('#verticalCards');if(!host)return;host.innerHTML='';
    (K.verticals||[]).filter(function(v){return v!=='Otros'}).forEach(function(v){
      var b=document.createElement('button');b.type='button';b.className='vertical-card'+(state.vertical===v?' active':'');b.innerHTML='<strong>'+esc(v)+'</strong><small>'+esc(VERTICAL_META[v]||'Añade casos de uso sectoriales FY27.')+'</small>';
      b.addEventListener('click',function(){state.vertical=state.vertical===v?'':v;renderVerticalCards();renderContextImpact();renderQuickBlocks();renderLibrary();saveDraft()});
      host.appendChild(b);
    });
  }
  function renderVendors(){
    var host=$('#vendorChips'),q=$('#vendorSearch').value.trim().toLowerCase();host.innerHTML='';
    (K.vendors||[]).filter(function(v){return !q||v.name.toLowerCase().indexOf(q)>=0||(v.tags||[]).join(' ').toLowerCase().indexOf(q)>=0}).forEach(function(v){
      var b=document.createElement('button');b.type='button';b.className='chip'+(state.selectedVendors.has(v.name)?' active':'');b.textContent=v.name;
      b.addEventListener('click',function(){if(state.selectedVendors.has(v.name))state.selectedVendors.delete(v.name);else state.selectedVendors.add(v.name);renderVendors();renderContextImpact();renderQuickBlocks();renderLibrary();saveDraft()});
      host.appendChild(b);
    });
  }
  function renderContextImpact(){
    var c=context(),bits=[];
    if(c.role)bits.push(ROLE_META[c.role].impact);
    if(c.vertical)bits.push('La vertical '+c.vertical+' activa casos de uso sectoriales y prioriza las áreas que encajan con los fabricantes elegidos.');
    if(c.vendors.length)bits.push('Para '+c.vendors.join(', ')+' se priorizan slides oficiales y, solo si hay densidad suficiente, slides IA de historia de valor, prueba y evidencia.');
    var strong=c.role||c.vertical||c.vendors.length?'Esto cambiará la propuesta automática':'Sin contexto adicional';
    var text=bits.length?bits.join(' '):'Puedes empezar directamente desde la biblioteca original FY27. Rol y vertical son ayudas, nunca requisitos.';
    $('#contextImpact').querySelector('strong').textContent=strong;
    $('#contextImpact').querySelector('span').textContent=text;
  }

  function blockCard(cls,title,desc,count,action,label){
    var d=document.createElement('article');d.className='quick-block '+(cls||'');
    d.innerHTML='<strong>'+esc(title)+'</strong><small>'+esc(desc)+'</small><footer><span>'+count+' slides aprox.</span><button type="button">'+esc(label||'Añadir bloque')+'</button></footer>';
    $('button',d).addEventListener('click',action);return d;
  }
  function serviceItemsForRole(role){
    var pages=(ROLE_META[role]&&ROLE_META[role].services)||[73,74,78];
    return pages.map(sourceByPage).filter(Boolean);
  }
  function vendorBlockItems(name,c){
    var p=vendorIntel(name)||{},items=[];
    (p.sourceSlides||[]).slice(0,c.role==='sa'?2:1).forEach(function(pg){var x=sourceByPage(pg);if(x)items.push(x)});
    var story=vendorStoryModel(name,c);if(story.density>=8)items.push(story);
    var proof=vendorProofModel(name,c);if(proof.density>=9)items.push(proof);
    if(c.role==='vsm'||/gartner|analista|mercado|market/i.test(c.objective||'')){var market=vendorMarketModel(name);if(market.evidence.length>=3)items.push(market)}
    return items;
  }
  function verticalBlockItems(c){
    if(!c.vertical)return[];
    return relevantVerticalAreas(c).slice(0,c.role==='sa'?1:2).map(function(a){return verticalItem(c.vertical,a)}).filter(Boolean);
  }
  function baseBlockItems(c){
    var items=[{kind:'cover',title:'Portada personalizada',subtitle:c.partner||'Presentación Westcon',category:'generated',quality:'high'}];
    var corp2=sourceByPage(2);if(corp2)items.push(corp2);
    if(c.role==='psm'||!c.role){var corp3=sourceByPage(3);if(corp3)items.push(corp3)}
    items.push({kind:'agenda',title:'Objetivo y recorrido',subtitle:c.objective||'Foco de la conversación',category:'generated',quality:'high'});
    return items;
  }
  function closureItems(){return [{kind:'next',title:'Siguientes pasos',subtitle:'Plan de acción compartido',category:'generated',quality:'high'}]}
  function addItems(items){
    var keys={};state.deck.forEach(function(x){keys[itemKey(x)]=1});
    items.forEach(function(x){if(x&&!keys[itemKey(x)]){state.deck.push(Object.assign({},x,{uid:uid()}));keys[itemKey(x)]=1}});
    renderDeck();saveDraft();
  }
  function renderQuickBlocks(){
    var c=context(),host=$('#quickBlocks');host.innerHTML='';
    host.appendChild(blockCard('','Base Westcon','Portada, contexto corporativo mínimo y objetivo. Sin convertir el deck en un catálogo.',baseBlockItems(c).length,function(){addItems(baseBlockItems(c))},'Añadir base'));
    c.vendors.slice(0,4).forEach(function(v){
      var items=vendorBlockItems(v,c),p=vendorIntel(v)||{};
      host.appendChild(blockCard('vendor',v,p.tagline||p.category||'Bloque de fabricante',items.length,function(){addItems(items)},'Añadir '+v));
    });
    if(c.vertical){
      var vi=verticalBlockItems(c);
      host.appendChild(blockCard('vertical','Vertical · '+c.vertical,'Casos de uso FY27 adaptados a las áreas de los fabricantes seleccionados.',vi.length,function(){addItems(vi)},'Añadir vertical'));
    }
    if(c.role){
      var si=serviceItemsForRole(c.role);
      host.appendChild(blockCard('service','Servicios para '+ROLE_META[c.role].label,'Servicios Westcon que mejor refuerzan este tipo de conversación.',si.length,function(){addItems(si)},'Añadir servicios'));
    }
    host.appendChild(blockCard('','Cierre','Slide final editable para concretar acción, responsable y fecha.',1,function(){addItems(closureItems())},'Añadir cierre'));
  }

  function renderLibrary(){
    var q=$('#searchSlides').value.trim().toLowerCase(),host=$('#slideLibrary');host.innerHTML='';
    var c=context(),items=libraryItems().filter(matchesFilter).filter(function(x){
      var blob=[x.title,x.subtitle,x.area,x.vendor].concat(x.vendors||[],x.tags||[]).join(' ').toLowerCase();
      return !q||blob.indexOf(q)>=0;
    });
    items.sort(function(a,b){
      var av=((a.vendors||[]).concat(a.vendor||[])).some(function(v){return c.vendors.indexOf(v)>=0})?-12:0;
      var bv=((b.vendors||[]).concat(b.vendor||[])).some(function(v){return c.vendors.indexOf(v)>=0})?-12:0;
      var ag=a.kind==='vertical'&&c.vertical===a.vertical?-8:0,bg=b.kind==='vertical'&&c.vertical===b.vertical?-8:0;
      return av-bv+ag-bg||String(a.title).localeCompare(String(b.title),'es');
    });
    $('#libraryCount').textContent=items.length;
    items.forEach(function(item){
      var card=document.createElement('article');card.className='library-card';
      var badges='';
      if(item.page)badges+='<span class="thumb-badge">P. '+item.page+'</span>';
      if(item.vendor)badges+='<span class="thumb-badge">'+esc(item.vendor)+'</span>';
      var thumb=item.asset?'<div class="slide-thumb"><img src="'+esc(item.asset)+'" alt=""><div class="thumb-badges">'+badges+'</div></div>':'<div class="slide-thumb"><div class="generated-thumb '+(item.kind==='vertical'?'vertical':item.kind==='vendor-proof'||item.kind==='vendor-market'?'proof':'')+'"><strong>'+esc(item.title)+'</strong><small>'+esc(item.subtitle||'Contenido generado')+'</small></div></div>';
      var ql=qualityLabel(item);
      card.innerHTML=thumb+'<div class="lib-body"><strong>'+esc(item.title)+'</strong><small>'+esc(item.subtitle||'')+'</small><div class="lib-foot"><span class="quality-tag '+ql.cls+'">'+esc(ql.text)+'</span><button type="button">＋ Añadir</button></div></div>';
      $('.slide-thumb',card).addEventListener('click',function(){openPreview(item)});
      $('.lib-foot button',card).addEventListener('click',function(){if(item.kind==='custom-new'){$('#customDialog').showModal();return}addToDeck(item)});
      host.appendChild(card);
    });
  }

  function addToDeck(item){state.deck.push(Object.assign({},item,{uid:uid()}));renderDeck();saveDraft()}
  function removeAt(i){state.deck.splice(i,1);renderDeck();saveDraft()}
  function move(i,dir){var j=i+dir;if(j<0||j>=state.deck.length)return;var t=state.deck[i];state.deck[i]=state.deck[j];state.deck[j]=t;renderDeck();saveDraft()}
  function duplicate(i){state.deck.splice(i+1,0,Object.assign({},state.deck[i],{uid:uid()}));renderDeck();saveDraft()}
  function renderDeck(){
    var host=$('#deckList');host.innerHTML='';$('#deckEmpty').classList.toggle('hidden',state.deck.length>0);$('#deckCount').textContent=state.deck.length;$('#deckSummary').textContent=state.deck.length+' slide'+(state.deck.length===1?'':'s');
    var original=state.deck.filter(function(x){return x.kind==='source'}).length;
    var generated=state.deck.length-original;
    $('#deckQuality').textContent=state.deck.length?(original+' originales · '+generated+' adaptadas'):'Deck vacío';
    state.deck.forEach(function(item,i){
      var row=document.createElement('div');row.className='deck-item';row.draggable=true;row.dataset.index=i;
      var thumb=item.asset?'<div class="deck-thumb"><img src="'+esc(item.asset)+'" alt=""></div>':'<div class="deck-thumb"><div class="mini-generated">'+esc(item.kind==='vertical'?'VERTICAL':item.vendor||'GENERADA')+'</div></div>';
      row.innerHTML='<div class="deck-num">'+(i+1)+'</div>'+thumb+'<div class="deck-copy"><strong>'+esc(item.title)+'</strong><small>'+esc(item.subtitle||'')+'</small></div><div class="deck-actions"><button title="Subir">↑</button><button title="Bajar">↓</button><button title="Duplicar">⧉</button><button title="Eliminar">×</button></div>';
      $('.deck-thumb',row).addEventListener('click',function(){openPreview(item)});
      var btns=$$('button',row);btns[0].onclick=function(){move(i,-1)};btns[1].onclick=function(){move(i,1)};btns[2].onclick=function(){duplicate(i)};btns[3].onclick=function(){removeAt(i)};
      row.addEventListener('dragstart',function(){state.dragIndex=i;row.classList.add('dragging')});
      row.addEventListener('dragend',function(){row.classList.remove('dragging')});
      row.addEventListener('dragover',function(e){e.preventDefault()});
      row.addEventListener('drop',function(e){e.preventDefault();var from=state.dragIndex,to=i;if(from==null||from===to)return;var m=state.deck.splice(from,1)[0];state.deck.splice(to,0,m);state.dragIndex=null;renderDeck();saveDraft()});
      host.appendChild(row);
    });
  }

  function fakePreviewSections(item){
    if(item.kind==='vendor-story'||item.kind==='vendor-proof'||item.kind==='vendor-market')return (item.sections||[]).slice(0,4);
    if(item.kind==='vertical'){
      var vd=VERTICAL.verticals&&VERTICAL.verticals[item.vertical]&&VERTICAL.verticals[item.vertical][item.area];
      if(!vd)return[];
      return [
        {title:'POR QUÉ AHORA',body:(vd.why||[]).map(function(x){return x[0]}).join(' · ')},
        {title:'EL RETO',body:vd.challenge},
        {title:'CASOS DE USO',body:(vd.cases||[]).map(function(x){return x[0]}).join(' · ')},
        {title:'SIGUIENTE PASO',body:vd.nextStep}
      ];
    }
    if(item.kind==='agenda')return [{title:'CONTEXTO',body:'Punto de partida y prioridades'},{title:'PROPUESTA',body:'Capacidades y casos de uso'},{title:'PRUEBA',body:'Evidencia y criterio'},{title:'SIGUIENTE PASO',body:'Acción, responsable y fecha'}];
    if(item.kind==='next')return [{title:'WESTCON',body:'Recursos y especialistas'},{title:'PARTNER',body:'Caso de uso y responsables'},{title:'FABRICANTE',body:'Recursos y alineación'},{title:'RESULTADO',body:'Acción concreta y medible'}];
    return [];
  }
  function openPreview(item){
    state.previewItem=item;$('#previewTitle').textContent=item.title;$('#previewKind').textContent=item.kind==='source'?'SLIDE ORIGINAL FY27':item.kind==='vertical'?'CASO DE USO VERTICAL':'CONTENIDO ADAPTADO';
    var stage=$('#previewStage');stage.innerHTML='';
    if(item.asset){var img=document.createElement('img');img.src=item.asset;img.alt=item.title;stage.appendChild(img)}
    else{
      var sections=fakePreviewSections(item),html='<div class="fake-slide"><span class="fs-kicker">'+esc(item.vendor||item.vertical||'WESTCON COMSTOR')+'</span><h3>'+esc(item.title)+'</h3><p>'+esc(item.subtitle||'')+'</p><div class="fake-slide-grid">';
      sections.forEach(function(s){var body=s.body||(s.bullets||[]).join(' · ');html+='<div class="fake-card"><b>'+esc(s.title)+'</b><span>'+esc(body)+'</span></div>'});
      html+='</div></div>';stage.innerHTML=html;
    }
    $('#previewAddBtn').style.display=item.uid?'none':'inline-flex';$('#previewDialog').showModal();
  }

  function proposeDeck(){
    var c=context();state.deck=[];
    addItems([{kind:'cover',title:'Portada personalizada',subtitle:c.partner||'Presentación Westcon',category:'generated',quality:'high'}]);
    addItems([{kind:'agenda',title:'Objetivo y recorrido',subtitle:c.objective||'Foco de la conversación',category:'generated',quality:'high'}]);
    if(c.role==='psm'||(!c.role&&c.vendors.length===0)){var w=sourceByPage(3);if(w)addItems([w])}
    else {var q=sourceByPage(2);if(q)addItems([q])}
    var pi=partnerItem(c);if(pi)addItems([pi]);
    if(c.vertical)addItems(verticalBlockItems(c));
    c.vendors.forEach(function(v){addItems(vendorBlockItems(v,c))});
    if(c.role)addItems(serviceItemsForRole(c.role).slice(0,c.role==='sa'?2:1));
    addItems(closureItems());
    renderDeck();saveDraft();
    var reason=[];
    if(c.role)reason.push(ROLE_META[c.role].label);
    if(c.vertical)reason.push(c.vertical);
    if(c.vendors.length)reason.push(c.vendors.join(', '));
    $('#contextImpact').querySelector('strong').textContent='Deck propuesto · '+state.deck.length+' slides';
    $('#contextImpact').querySelector('span').textContent='He priorizado '+(reason.length?reason.join(' · '):'una narrativa breve Westcon')+'. Puedes eliminar o reordenar cualquier slide.';
  }

  var assetCache={};
  async function assetData(url){
    if(assetCache[url])return assetCache[url];
    var r=await fetch(url);if(!r.ok)throw new Error(url);var b=await r.blob();
    var data=await new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){res(fr.result)};fr.onerror=rej;fr.readAsDataURL(b)});
    assetCache[url]=data;return data;
  }
  function sourceAsset(page){return 'assets/source-slides/corporate/slide-'+String(page).padStart(2,'0')+'.png'}

  async function generatePptx(){
    if(!state.deck.length){alert('Añade al menos una slide.');return}
    if(typeof PptxGenJS==='undefined'){alert('No se ha cargado el generador PowerPoint.');return}
    var c=context(),pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Westcon Comstor España';pptx.subject='Presentación ad-hoc FY2027';pptx.title=(c.partner||'Westcon')+' · Presentation Studio';pptx.company='Westcon Comstor';
    pptx.lang='es-ES';pptx.theme={headFontFace:'Aptos Display',bodyFontFace:'Aptos',lang:'es-ES'};
    var C={navy:'082C3A',navy2:'0D3B4D',cyan:'31BBC7',magenta:'A92A80',purple:'7551A0',amber:'F2AB27',green:'2DB58A',ink:'173744',muted:'69808A',line:'D9E4E8',bg:'F4F7F8',white:'FFFFFF',soft:'EEF4F6'};
    var logo=null,hero=null;try{logo=await assetData('assets/westcon-comstor.png')}catch(e){}try{hero=await assetData('assets/hero.jpeg')}catch(e){}

    function addFooter(s,source){
      s.addShape(pptx.ShapeType.line,{x:.58,y:7.17,w:12.15,h:0,line:{color:'DDE7EA',pt:.6}});
      s.addText('Westcon Comstor España · FY2027',{x:.6,y:7.22,w:3.2,h:.11,fontFace:'Aptos',fontSize:6.8,color:C.muted,margin:0});
      if(source)s.addText(source,{x:6.1,y:7.22,w:6.55,h:.11,fontFace:'Aptos',fontSize:6.5,color:C.muted,align:'right',margin:0,fit:'shrink'});
    }
    function addShell(s,kicker,title,subtitle,accent,source){
      s.background={color:C.bg};
      s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:.09,fill:{color:accent},line:{color:accent}});
      s.addShape(pptx.ShapeType.roundRect,{x:.58,y:.42,w:.17,h:.55,rectRadius:.04,fill:{color:accent},line:{color:accent}});
      s.addText(kicker,{x:.92,y:.43,w:6.6,h:.15,fontFace:'Aptos',fontSize:8.5,bold:true,color:accent,charSpacing:1.2,margin:0});
      s.addText(title,{x:.92,y:.70,w:10.25,h:.50,fontFace:'Aptos Display',fontSize:25,bold:true,color:C.navy,margin:0,fit:'shrink'});
      if(subtitle)s.addText(subtitle,{x:.94,y:1.26,w:10.8,h:.32,fontFace:'Aptos',fontSize:10.5,color:C.muted,margin:0,fit:'shrink'});
      if(logo){s.addShape(pptx.ShapeType.roundRect,{x:11.55,y:.35,w:1.18,h:.58,fill:{color:C.white},line:{color:'E3ECEF',pt:.5}});s.addImage({data:logo,x:11.68,y:.45,w:.92,h:.39})}
      addFooter(s,source);
    }
    function card(s,x,y,w,h,title,body,accent,opts){
      opts=opts||{};s.addShape(pptx.ShapeType.roundRect,{x:x,y:y,w:w,h:h,rectRadius:.05,fill:{color:opts.dark?C.navy:C.white},line:{color:opts.dark?C.navy:'DBE6E9',pt:.7}});
      s.addShape(pptx.ShapeType.rect,{x:x,y:y,w:.055,h:h,fill:{color:accent},line:{color:accent}});
      s.addText(title,{x:x+.18,y:y+.18,w:w-.36,h:.17,fontFace:'Aptos',fontSize:8,bold:true,color:opts.dark?C.cyan:accent,charSpacing:.7,margin:0,fit:'shrink'});
      s.addText(body||'',{x:x+.18,y:y+.49,w:w-.36,h:h-.64,fontFace:'Aptos',fontSize:opts.fontSize||10.2,color:opts.dark?C.white:C.ink,breakLine:false,margin:0,fit:'shrink',valign:'top'});
    }
    function bulletsText(arr){return (arr||[]).filter(Boolean).map(function(x){return '• '+x}).join('\n')}
    async function vendorMark(s,name,x,y,w,h){
      try{var data=await assetData(vendorLogo(name));s.addShape(pptx.ShapeType.roundRect,{x:x,y:y,w:w,h:h,fill:{color:C.white},line:{color:'DCE6E9',pt:.5}});s.addImage({data:data,x:x+.12,y:y+.12,w:w-.24,h:h-.24,sizing:'contain'})}catch(e){}
    }
    async function addOriginal(page){var s=pptx.addSlide();s.background={color:C.white};var data=await assetData(sourceAsset(page));s.addImage({data:data,x:0,y:0,w:13.333,h:7.5});return s}
    async function addVertical(item){
      var vd=VERTICAL.verticals&&VERTICAL.verticals[item.vertical]&&VERTICAL.verticals[item.vertical][item.area];if(!vd)return null;
      var s=pptx.addSlide(),accent=item.area==='cyber'?C.purple:item.area==='network'?'268A8B':C.magenta;
      addShell(s,vd.areaLabel,item.vertical,vd.title,accent,'Fuente: datasheet vertical Westcon FY27');
      s.addText('POR QUÉ ACTUAR AHORA',{x:.62,y:1.78,w:2.8,h:.14,fontFace:'Aptos',fontSize:8,bold:true,color:accent,margin:0});
      (vd.why||[]).slice(0,3).forEach(function(it,i){card(s,.62+i*4.08,2.00,3.78,.78,it[0],it[1],accent,{fontSize:7.4})});
      s.addShape(pptx.ShapeType.roundRect,{x:.62,y:2.92,w:12.08,h:.52,fill:{color:'EEF4F6'},line:{color:'EEF4F6'}});
      s.addText('EL RETO',{x:.86,y:3.04,w:.75,h:.10,fontFace:'Aptos',fontSize:7,bold:true,color:accent,margin:0});
      s.addText(vd.challenge,{x:1.72,y:3.00,w:10.55,h:.20,fontFace:'Aptos',fontSize:9.5,bold:true,color:C.navy,margin:0,fit:'shrink'});
      s.addText('CASOS DE USO',{x:.62,y:3.63,w:2.0,h:.14,fontFace:'Aptos',fontSize:8,bold:true,color:accent,margin:0});
      (vd.cases||[]).slice(0,4).forEach(function(it,i){var col=i%2,row=Math.floor(i/2);card(s,.62+col*4.04,3.86+row*.92,3.76,.76,(i+1)+' · '+it[0],it[1],accent,{fontSize:7.2})});
      s.addText('IMPACTO ESPERADO',{x:8.88,y:3.63,w:2.2,h:.14,fontFace:'Aptos',fontSize:8,bold:true,color:accent,margin:0});
      s.addShape(pptx.ShapeType.roundRect,{x:8.88,y:3.86,w:3.82,h:1.68,fill:{color:C.white},line:{color:'DBE6E9',pt:.7}});
      (vd.impacts||[]).slice(0,4).forEach(function(it,i){var yy=4.04+i*.34,val=Math.max(0,Math.min(100,Number(it[1]||0)));s.addText(it[0],{x:9.08,y:yy,w:2.25,h:.10,fontFace:'Aptos',fontSize:6.8,bold:true,color:C.ink,margin:0});s.addText(String(val),{x:11.84,y:yy,w:.42,h:.10,fontFace:'Aptos',fontSize:6.8,bold:true,color:accent,align:'right',margin:0});s.addShape(pptx.ShapeType.roundRect,{x:9.08,y:yy+.15,w:3.0,h:.07,fill:{color:'E5ECEF'},line:{color:'E5ECEF'}});s.addShape(pptx.ShapeType.roundRect,{x:9.08,y:yy+.15,w:3.0*val/100,h:.07,fill:{color:accent},line:{color:accent}})});
      s.addShape(pptx.ShapeType.roundRect,{x:.62,y:5.92,w:12.08,h:.78,fill:{color:C.navy},line:{color:C.navy}});
      s.addText('SIGUIENTE PASO',{x:.86,y:6.10,w:1.55,h:.13,fontFace:'Aptos',fontSize:7.5,bold:true,color:C.cyan,margin:0});
      s.addText(vd.nextStep,{x:2.38,y:6.06,w:9.65,h:.23,fontFace:'Aptos',fontSize:10.5,bold:true,color:C.white,margin:0,fit:'shrink'});
      return s;
    }
    async function addVendorStory(item){
      var p=vendorIntel(item.vendor)||{},m=vendorStoryModel(item.vendor,c),s=pptx.addSlide();
      addShell(s,'PROPUESTA DE VALOR',item.vendor,'Una historia con caso de uso, diferenciales y criterios de decisión.',C.magenta,'Fuente base: Westcon FY27 · slide '+((p.sourceSlides||[])[0]||''));
      await vendorMark(s,item.vendor,11.25,1.05,1.48,.72);
      var value=(m.sections[0]&&m.sections[0].body)||p.valueProposition||'';
      s.addShape(pptx.ShapeType.roundRect,{x:.62,y:1.86,w:4.08,h:4.76,fill:{color:C.navy},line:{color:C.navy}});
      s.addText('LA IDEA CENTRAL',{x:.92,y:2.17,w:1.7,h:.14,fontFace:'Aptos',fontSize:8,bold:true,color:C.cyan,charSpacing:.8,margin:0});
      s.addText(value,{x:.92,y:2.55,w:3.48,h:1.55,fontFace:'Aptos Display',fontSize:18,bold:true,color:C.white,fit:'shrink',margin:0});
      var outcome=(m.sections[4]&&m.sections[4].body)||'Convertir la capacidad en una prueba medible.';
      s.addShape(pptx.ShapeType.roundRect,{x:.90,y:5.05,w:3.52,h:1.10,fill:{color:'123F50'},line:{color:'123F50'}});
      s.addText('RESULTADO BUSCADO',{x:1.10,y:5.25,w:1.6,h:.11,fontFace:'Aptos',fontSize:6.8,bold:true,color:C.amber,margin:0});
      s.addText(outcome,{x:1.10,y:5.51,w:3.05,h:.30,fontFace:'Aptos',fontSize:9.5,bold:true,color:C.white,fit:'shrink',margin:0});
      card(s,4.98,1.86,3.72,2.18,'POR QUÉ AHORA',bulletsText(m.sections[1].bullets),C.cyan,{fontSize:9});
      card(s,8.98,1.86,3.72,2.18,'DIFERENCIALES',bulletsText(m.sections[2].bullets),C.magenta,{fontSize:9});
      card(s,4.98,4.32,3.72,2.30,'CRITERIOS DE DECISIÓN',bulletsText(m.sections[3].bullets),C.purple,{fontSize:8.8});
      card(s,8.98,4.32,3.72,2.30,'QUÉ CONVIENE DEMOSTRAR',bulletsText((p.proofThemes||[]).slice(0,4)),C.amber,{fontSize:8.8});
      return s;
    }
    async function addVendorProof(item){
      var p=vendorIntel(item.vendor)||{},m=vendorProofModel(item.vendor,c),s=pptx.addSlide(),ev=m.evidence||[];
      addShell(s,'PRUEBA DE VALOR',item.vendor,'Qué medir, cómo demostrarlo y qué evidencia pública respalda la conversación.',C.cyan,'Fuente: Westcon FY27 + evidencia pública atribuible');
      await vendorMark(s,item.vendor,11.25,1.05,1.48,.72);
      s.addText('RUTA DE PoV / PoC',{x:.62,y:1.88,w:2.2,h:.14,fontFace:'Aptos',fontSize:8,bold:true,color:C.cyan,margin:0});
      (m.sections[0].bullets||[]).slice(0,4).forEach(function(t,i){var yy=2.18+i*.82;s.addShape(pptx.ShapeType.ellipse,{x:.66,y:yy,w:.39,h:.39,fill:{color:i===3?C.magenta:C.cyan},line:{color:i===3?C.magenta:C.cyan}});s.addText(String(i+1),{x:.66,y:yy+.08,w:.39,h:.10,fontFace:'Aptos',fontSize:7,bold:true,color:C.white,align:'center',margin:0});s.addText(t,{x:1.20,y:yy-.02,w:4.28,h:.38,fontFace:'Aptos',fontSize:10,bold:true,color:C.navy,fit:'shrink',margin:0});if(i<3)s.addShape(pptx.ShapeType.line,{x:.855,y:yy+.39,w:0,h:.42,line:{color:'BFD4DA',pt:1.2}})});
      card(s,.62,5.72,4.88,.82,'QUÉ MEDIR',bulletsText((m.sections[1].bullets||[]).slice(0,4)),C.purple,{fontSize:7.9});
      s.addText('EVIDENCIA Y VALIDACIÓN',{x:5.86,y:1.88,w:2.8,h:.14,fontFace:'Aptos',fontSize:8,bold:true,color:C.magenta,margin:0});
      if(ev.length){
        ev.slice(0,3).forEach(function(e,i){card(s,5.86,2.18+i*1.36,6.84,1.10,evidenceLabel(e).toUpperCase(),evidenceLine(e),i===0?C.magenta:i===1?C.cyan:C.purple,{fontSize:8.5})});
      }else{
        card(s,5.86,2.18,6.84,1.48,'EVIDENCIA FY27',bulletsText((p.approvedAdvantages||[]).slice(0,3)),C.magenta,{fontSize:9});
        card(s,5.86,3.92,6.84,1.48,'REFERENCIA PARA EL WORKSHOP','La slide oficial FY27 y la PoV deben usarse como base. No se muestra una afirmación externa si no existe evidencia atribuible de calidad.',C.cyan,{fontSize:9.2});
      }
      card(s,5.86,6.05,6.84,.60,'CRITERIO DE ÉXITO','Salir de la sesión con un alcance medible, responsable, datos necesarios y siguiente hito acordado.',C.amber,{fontSize:8.2});
      if(ev.length)try{s.addNotes(ev.map(function(e){return evidenceLine(e)+' | '+(e.url||'')}).join('\n'))}catch(e){}
      return s;
    }
    async function addVendorMarket(item){
      var m=vendorMarketModel(item.vendor),ev=m.evidence||[],s=pptx.addSlide();
      addShell(s,'MERCADO Y VALIDACIÓN',item.vendor,'Solo señales públicas con atribución y suficiente calidad.',C.purple,'Fuentes públicas · ver notas');
      await vendorMark(s,item.vendor,11.25,1.05,1.48,.72);
      ev.slice(0,4).forEach(function(e,i){var col=i%2,row=Math.floor(i/2);card(s,.62+col*6.05,1.95+row*2.30,5.72,2.00,evidenceLabel(e).toUpperCase(),evidenceLine(e),i===0?C.magenta:i===1?C.cyan:i===2?C.purple:C.amber,{fontSize:10})});
      if(ev.length)try{s.addNotes(ev.map(function(e){return evidenceLine(e)+' | '+(e.url||'')}).join('\n'))}catch(e){}
      return s;
    }
    async function addPartner(item){
      var s=pptx.addSlide(),ev=item.evidence||[];
      addShell(s,'CONTEXTO DEL PARTNER',c.partner||'Partner','Señales públicas relevantes para situar la conversación, no para llenar la presentación.',C.cyan,'Fuentes públicas · ver notas');
      ev.slice(0,6).forEach(function(e,i){var col=i%2,row=Math.floor(i/2);card(s,.62+col*6.05,1.92+row*1.55,5.72,1.28,(e.publisher||e.kind||'SEÑAL PÚBLICA').toUpperCase(),e.title||e.description||String(e),i%2?C.purple:C.cyan,{fontSize:8.6})});
      try{s.addNotes(ev.map(function(e){return (e.title||e.description||'')+' | '+(e.url||'')}).join('\n'))}catch(e){}
      return s;
    }
    async function addAgenda(){
      var s=pptx.addSlide();addShell(s,'OBJETIVO','Una conversación con foco',c.objective||'Alinear prioridades y acordar el siguiente paso.',C.magenta);
      var stages=[['01','CONTEXTO',c.partner?'Partimos de '+c.partner+' y de lo que queremos conseguir.':'Partimos del objetivo y del alcance de la sesión.'],['02','PROPUESTA',c.vendors.length?'Capacidades y casos de uso de '+c.vendors.join(', ')+'.':'Seleccionamos únicamente las capacidades que aportan valor.'],['03','PRUEBA','Criterios de decisión, evidencia y demostración cuando aplique.'],['04','ACCIÓN','Siguiente paso, responsable y fecha.']];
      stages.forEach(function(x,i){var xx=.62+i*3.05;s.addShape(pptx.ShapeType.roundRect,{x:xx,y:2.18,w:2.72,h:3.18,fill:{color:C.white},line:{color:'DBE6E9',pt:.7}});s.addText(x[0],{x:xx+.18,y:2.42,w:.6,h:.25,fontFace:'Aptos Display',fontSize:17,bold:true,color:i===0?C.magenta:i===1?C.cyan:i===2?C.purple:C.amber,margin:0});s.addText(x[1],{x:xx+.18,y:3.08,w:2.25,h:.18,fontFace:'Aptos',fontSize:8,bold:true,color:C.navy,margin:0});s.addText(x[2],{x:xx+.18,y:3.47,w:2.25,h:1.15,fontFace:'Aptos',fontSize:10,color:C.ink,fit:'shrink',margin:0})});
      return s;
    }
    async function addNext(){
      var s=pptx.addSlide();addShell(s,'SIGUIENTE PASO','De la conversación a la acción','Cerrar con una decisión sencilla y medible.',C.magenta);
      card(s,.62,2.02,3.72,2.42,'WESTCON','Activar especialistas, preventa, laboratorio, assessment o servicios necesarios para el siguiente hito.',C.magenta,{fontSize:11});
      card(s,4.80,2.02,3.72,2.42,'PARTNER','Confirmar caso de uso, responsables, datos necesarios y criterio de éxito.',C.cyan,{fontSize:11});
      card(s,8.98,2.02,3.72,2.42,'FABRICANTE','Alinear recursos, programa, arquitectura o apoyo de canal cuando aplique.',C.purple,{fontSize:11});
      s.addShape(pptx.ShapeType.roundRect,{x:.62,y:4.94,w:12.08,h:1.28,fill:{color:C.navy},line:{color:C.navy}});
      s.addText('RESULTADO',{x:.90,y:5.20,w:1.35,h:.14,fontFace:'Aptos',fontSize:8,bold:true,color:C.amber,margin:0});
      s.addText('Siguiente paso concreto · responsable · fecha · criterio de éxito',{x:2.30,y:5.16,w:9.7,h:.28,fontFace:'Aptos Display',fontSize:17,bold:true,color:C.white,margin:0,fit:'shrink'});
      return s;
    }
    async function addCustom(item){
      var s=pptx.addSlide();addShell(s,'CONTENIDO AD-HOC',item.title,'Un mensaje propio dentro del lenguaje visual de la presentación.',C.magenta);
      var lines=String(item.body||'').split(/\n+/).map(function(x){return x.trim()}).filter(Boolean);
      if(lines.length>1){
        s.addShape(pptx.ShapeType.roundRect,{x:.72,y:2.02,w:11.90,h:4.25,fill:{color:C.white},line:{color:'DBE6E9',pt:.7}});
        s.addText(lines.map(function(t){return {text:t,options:{bullet:{indent:14},breakLine:true}}}),{x:1.08,y:2.43,w:11.15,h:3.4,fontFace:'Aptos',fontSize:18,color:C.ink,fit:'shrink',margin:.02,paraSpaceAfterPt:9});
      }else card(s,.72,2.05,11.90,3.85,'MENSAJE PRINCIPAL',item.body||'',C.magenta,{fontSize:19});
      return s;
    }
    async function addCover(){
      var s=pptx.addSlide();s.background={color:C.navy};
      if(hero){s.addImage({data:hero,x:7.28,y:0,w:6.05,h:7.50});s.addShape(pptx.ShapeType.rect,{x:7.28,y:0,w:6.05,h:7.50,fill:{color:C.navy,transparency:38},line:{color:C.navy,transparency:100}})}
      s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:7.70,h:7.50,fill:{color:C.navy},line:{color:C.navy}});
      s.addShape(pptx.ShapeType.rect,{x:.62,y:.52,w:.09,h:.82,fill:{color:C.magenta},line:{color:C.magenta}});
      if(logo){s.addShape(pptx.ShapeType.roundRect,{x:.92,y:.50,w:1.65,h:.68,fill:{color:C.white},line:{color:C.white}});s.addImage({data:logo,x:1.12,y:.63,w:1.25,h:.42})}
      s.addText('WESTCON COMSTOR · FY2027',{x:.92,y:1.72,w:5.65,h:.16,fontFace:'Aptos',fontSize:8.5,bold:true,color:C.cyan,charSpacing:1.5,margin:0});
      s.addText((c.partner||'PRESENTACIÓN AD-HOC').toUpperCase(),{x:.92,y:2.15,w:5.65,h:.82,fontFace:'Aptos Display',fontSize:31,bold:true,color:C.white,fit:'shrink',margin:0});
      s.addText(c.objective||'Una conversación construida a medida',{x:.94,y:3.16,w:5.55,h:.72,fontFace:'Aptos',fontSize:17,color:'D7E8ED',fit:'shrink',margin:0});
      var meta=[];if(c.vendors.length)meta.push(c.vendors.join(' · '));if(c.vertical)meta.push(c.vertical);
      if(meta.length)s.addText(meta.join('  |  '),{x:.94,y:4.28,w:5.55,h:.30,fontFace:'Aptos',fontSize:10.5,bold:true,color:C.amber,fit:'shrink',margin:0});
      s.addShape(pptx.ShapeType.roundRect,{x:.92,y:5.62,w:4.72,h:.65,fill:{color:'123F50'},line:{color:'123F50'}});
      s.addText('PRESENTATION STUDIO',{x:1.18,y:5.84,w:2.0,h:.12,fontFace:'Aptos',fontSize:7,bold:true,color:C.cyan,charSpacing:1.0,margin:0});
      s.addText('Contenido original + casos de uso + evidencia seleccionada',{x:3.08,y:5.80,w:2.23,h:.18,fontFace:'Aptos',fontSize:7.6,color:C.white,fit:'shrink',margin:0});
      s.addShape(pptx.ShapeType.rect,{x:0,y:7.17,w:13.333,h:.33,fill:{color:C.cyan},line:{color:C.cyan}});
      return s;
    }

    for(var i=0;i<state.deck.length;i++){
      var item=state.deck[i];
      if(item.kind==='source'){await addOriginal(item.page);continue}
      if(item.kind==='vertical'){await addVertical(item);continue}
      if(item.kind==='cover'){await addCover();continue}
      if(item.kind==='agenda'){await addAgenda();continue}
      if(item.kind==='partner'){await addPartner(item);continue}
      if(item.kind==='vendor-story'){await addVendorStory(item);continue}
      if(item.kind==='vendor-proof'){await addVendorProof(item);continue}
      if(item.kind==='vendor-market'){await addVendorMarket(item);continue}
      if(item.kind==='next'){await addNext();continue}
      if(item.kind==='custom'){await addCustom(item);continue}
    }
    try{await pptx.writeFile({fileName:slug(c.partner||'westcon')+'-presentation-studio-fy27.pptx'})}catch(e){console.error(e);alert('No se pudo generar el PowerPoint. Revisa la consola del navegador.')}
  }

  init();
})();
