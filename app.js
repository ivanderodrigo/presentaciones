/* Westcon Presentation Builder v3 */
(function(){
  "use strict";
  var K=window.WESTCON_KNOWLEDGE||{vendors:[],verticals:[]};
  var VI=window.WESTCON_VENDOR_INTELLIGENCE||{vendors:{}};
  var LIVE=window.WESTCON_LIVE_INTELLIGENCE||{vendors:{}};
  var PARTNERS=window.WESTCON_PARTNER_INTELLIGENCE||{partners:{}};
  var SLIDES=window.WESTCON_SLIDE_INDEX||{slides:[]};
  var VERTICAL=window.WESTCON_VERTICAL_CONTENT||{verticals:{}};
  var $=function(s,r){return (r||document).querySelector(s);};
  var $$=function(s,r){return Array.from((r||document).querySelectorAll(s));};
  var STORE="westcon.presentationBuilder.v3.draft";
  var state={deck:[],vendors:new Set(),filter:"all",drag:null};

  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function uid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+Math.random();}
  function slug(s){return String(s||"presentacion").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"presentacion";}
  function ctx(){return {partner:$("#partner").value.trim(),role:$("#role").value,objective:$("#objective").value.trim(),vertical:$("#vertical").value,vendors:Array.from(state.vendors)};}
  function save(){localStorage.setItem(STORE,JSON.stringify({context:ctx(),deck:state.deck}));}
  function load(){try{return JSON.parse(localStorage.getItem(STORE)||"null");}catch(e){return null;}}
  function vendorByName(name){return (K.vendors||[]).find(function(v){return v.name===name;})||{};}
  function vendorIntel(name){return (VI.vendors||{})[name]||{};}
  function liveEvidence(name){return (((LIVE||{}).vendors||{})[name]||{}).evidence||[];}
  function partnerKey(s){return String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
  function partnerIntel(name){var p=(PARTNERS||{}).partners||{};return p[partnerKey(name)]||p[name]||null;}
  function internalSlide(x){var b=[x.title,x.subtitle].concat(x.tags||[]).join(" ").toLowerCase();return /playbook|mensajes clave|abre con|preguntas que abren|uso del slide|para comerciales/.test(b);}
  function sourceSlides(){return (SLIDES.slides||[]).filter(function(x){return x.source==="corporate"&&!internalSlide(x);});}
  function sourceItem(x){return {kind:"source",sourceId:x.id,page:x.page,title:x.title||("Slide "+x.page),subtitle:x.subtitle||x.area||"",asset:x.asset||("assets/source-slides/corporate/slide-"+String(x.page).padStart(2,"0")+".png"),category:x.type==="vendor"?"vendor":x.type==="service"?"service":"corporate",vendors:x.vendors||[],area:x.area||"",tags:x.tags||[]};}
  function areaKeys(names){
    var out=[];
    names.forEach(function(n){
      var a=String(vendorByName(n).area||vendorIntel(n).category||"").toLowerCase();
      if(a.indexOf("ciber")>=0||a.indexOf("security")>=0)out.push("cyber");
      if(a.indexOf("network")>=0)out.push("network");
      if(a.indexOf("cloud")>=0||a.indexOf("automat")>=0||a.indexOf("uc")>=0)out.push("cloud");
    });
    return Array.from(new Set(out));
  }
  function generatedItems(){
    var c=ctx(),out=[
      {kind:"cover",title:"Portada personalizada",subtitle:"Partner, objetivo, fabricantes y vertical",category:"generated"},
      {kind:"agenda",title:"Objetivo y agenda",subtitle:"Enmarca la conversación",category:"generated"},
      {kind:"next",title:"Siguientes pasos",subtitle:"Plan de acción final",category:"generated"}
    ];
    if(c.partner)out.push({kind:"partner",title:c.partner+" · contexto",subtitle:"Síntesis del dossier público disponible",category:"generated"});
    if(c.vertical&&VERTICAL.verticals&&VERTICAL.verticals[c.vertical]){
      ["cyber","network","cloud"].forEach(function(a){
        var d=VERTICAL.verticals[c.vertical][a];
        if(d)out.push({kind:"vertical",vertical:c.vertical,area:a,title:c.vertical+" · "+d.areaLabel,subtitle:d.title,category:"vertical"});
      });
    }
    c.vendors.forEach(function(v){
      out.push({kind:"vendor-diff",vendor:v,title:v+" · diferenciación",subtitle:"Capacidades, criterios y prueba de valor",category:"generated"});
      if(liveEvidence(v).length)out.push({kind:"vendor-evidence",vendor:v,title:v+" · analistas y mercado",subtitle:liveEvidence(v).length+" evidencias públicas disponibles",category:"generated"});
    });
    out.push({kind:"custom-new",title:"Slide libre",subtitle:"Añade contenido propio",category:"generated"});
    return out;
  }
  function libraryItems(){return generatedItems().concat(sourceSlides().map(sourceItem));}
  function filterItem(x){
    if(state.filter==="all")return true;
    if(state.filter==="vertical")return x.kind==="vertical";
    if(state.filter==="generated")return ["cover","agenda","partner","next","vendor-diff","vendor-evidence","custom-new"].indexOf(x.kind)>=0;
    return x.category===state.filter;
  }

  function renderVerticals(){
    var s=$("#vertical"),current=s.value;
    s.innerHTML='<option value="">Sin vertical</option>';
    Object.keys(VERTICAL.verticals||{}).forEach(function(v){var o=document.createElement("option");o.value=o.textContent=v;s.appendChild(o);});
    if(current)s.value=current;
  }
  function renderVendors(){
    var host=$("#vendorChips");host.innerHTML="";
    (K.vendors||[]).forEach(function(v){
      var b=document.createElement("button");b.type="button";b.className="chip"+(state.vendors.has(v.name)?" active":"");b.textContent=v.name;
      b.addEventListener("click",function(){state.vendors.has(v.name)?state.vendors.delete(v.name):state.vendors.add(v.name);renderVendors();renderLibrary();save();});
      host.appendChild(b);
    });
  }
  function renderLibrary(){
    var q=$("#searchSlides").value.trim().toLowerCase(),host=$("#slideLibrary");host.innerHTML="";
    var c=ctx();
    var items=libraryItems().filter(filterItem).filter(function(x){
      var blob=[x.title,x.subtitle,x.area].concat(x.vendors||[],x.tags||[]).join(" ").toLowerCase();
      return !q||blob.indexOf(q)>=0;
    });
    items.sort(function(a,b){
      var aa=(a.vendors||[]).some(function(v){return c.vendors.indexOf(v)>=0;})?-5:0;
      var bb=(b.vendors||[]).some(function(v){return c.vendors.indexOf(v)>=0;})?-5:0;
      return aa-bb||String(a.title).localeCompare(String(b.title),"es");
    });
    $("#libraryCount").textContent=items.length;
    items.forEach(function(item){
      var card=document.createElement("article");card.className="library-card";
      var thumb=item.asset?'<div class="thumb"><img src="'+esc(item.asset)+'" alt=""></div>':'<div class="thumb generated"><b>'+esc(item.title)+'</b><span>'+esc(item.subtitle||"Contenido generado")+'</span></div>';
      card.innerHTML=thumb+'<div class="lib-body"><strong>'+esc(item.title)+'</strong><small>'+esc(item.subtitle||"")+'</small><button type="button">＋ Añadir</button></div>';
      $("button",card).addEventListener("click",function(){if(item.kind==="custom-new"){$("#customDialog").showModal();return;}addToDeck(item);});
      host.appendChild(card);
    });
  }
  function addToDeck(item){state.deck.push(Object.assign({},item,{uid:uid()}));renderDeck();save();}
  function removeAt(i){state.deck.splice(i,1);renderDeck();save();}
  function moveAt(i,d){var j=i+d;if(j<0||j>=state.deck.length)return;var x=state.deck.splice(i,1)[0];state.deck.splice(j,0,x);renderDeck();save();}
  function duplicateAt(i){state.deck.splice(i+1,0,Object.assign({},state.deck[i],{uid:uid()}));renderDeck();save();}
  function renderDeck(){
    var host=$("#deckList");host.innerHTML="";
    $("#deckEmpty").classList.toggle("hidden",state.deck.length>0);
    $("#deckCount").textContent=state.deck.length;$("#deckSummary").textContent=state.deck.length+" slide"+(state.deck.length===1?"":"s");
    state.deck.forEach(function(item,i){
      var row=document.createElement("div");row.className="deck-item";row.draggable=true;row.dataset.index=i;
      var thumb=item.asset?'<div class="deck-thumb"><img src="'+esc(item.asset)+'" alt=""></div>':'<div class="deck-thumb generated">'+esc(item.kind==="vertical"?"VERTICAL":item.kind==="vendor-evidence"?"EVIDENCIA":"GENERADA")+'</div>';
      row.innerHTML='<div class="deck-num">'+(i+1)+'</div>'+thumb+'<div class="deck-copy"><strong>'+esc(item.title)+'</strong><small>'+esc(item.subtitle||item.area||"")+'</small></div><div class="deck-actions"><button title="Subir">↑</button><button title="Bajar">↓</button><button title="Duplicar">⧉</button><button title="Eliminar">×</button></div>';
      var bs=$$("button",row);bs[0].onclick=function(){moveAt(i,-1);};bs[1].onclick=function(){moveAt(i,1);};bs[2].onclick=function(){duplicateAt(i);};bs[3].onclick=function(){removeAt(i);};
      row.addEventListener("dragstart",function(){state.drag=i;row.classList.add("dragging");});
      row.addEventListener("dragend",function(){row.classList.remove("dragging");state.drag=null;});
      row.addEventListener("dragover",function(e){e.preventDefault();});
      row.addEventListener("drop",function(e){e.preventDefault();if(state.drag===null||state.drag===i)return;var x=state.deck.splice(state.drag,1)[0];state.deck.splice(i,0,x);state.drag=null;renderDeck();save();});
      host.appendChild(row);
    });
  }
  function addBaseWestcon(){
    ["corp-02","corp-03","corp-05"].forEach(function(id){var x=(SLIDES.slides||[]).find(function(s){return s.id===id;});if(x&&!state.deck.some(function(d){return d.sourceId===id;}))addToDeck(sourceItem(x));});
  }
  function inferVendors(){
    if(state.vendors.size)return;
    var text=($("#objective").value||"").toLowerCase();
    (K.vendors||[]).forEach(function(v){if(text.indexOf(String(v.name).toLowerCase())>=0)state.vendors.add(v.name);});
    renderVendors();
  }
  function suggestDeck(){
    inferVendors();
    var c=ctx();state.deck=[];
    addToDeck({kind:"cover",title:"Portada personalizada",subtitle:c.partner||"Westcon Comstor",category:"generated"});
    var s2=(SLIDES.slides||[]).find(function(s){return s.id==="corp-02";});if(s2)addToDeck(sourceItem(s2));
    if(c.role!=="sa"){var s3=(SLIDES.slides||[]).find(function(s){return s.id==="corp-03";});if(s3)addToDeck(sourceItem(s3));}
    addToDeck({kind:"agenda",title:"Objetivo y agenda",subtitle:c.objective||"Foco de la sesión",category:"generated"});
    if(c.partner&&partnerIntel(c.partner))addToDeck({kind:"partner",title:c.partner+" · contexto",subtitle:"Señales públicas relevantes",category:"generated"});
    if(c.vertical&&VERTICAL.verticals&&VERTICAL.verticals[c.vertical]){
      var areas=areaKeys(c.vendors);if(!areas.length)areas=["cyber"];
      areas.slice(0,c.role==="psm"?2:1).forEach(function(a){var d=VERTICAL.verticals[c.vertical][a];if(d)addToDeck({kind:"vertical",vertical:c.vertical,area:a,title:c.vertical+" · "+d.areaLabel,subtitle:d.title,category:"vertical"});});
    }
    c.vendors.forEach(function(v){
      var p=vendorIntel(v),page=(p.sourceSlides||[])[0],x=(SLIDES.slides||[]).find(function(s){return s.source==="corporate"&&s.page===page;});
      if(x)addToDeck(sourceItem(x));
      addToDeck({kind:"vendor-diff",vendor:v,title:v+" · diferenciación",subtitle:"Capacidades, criterios y prueba de valor",category:"generated"});
      if(liveEvidence(v).length)addToDeck({kind:"vendor-evidence",vendor:v,title:v+" · analistas y mercado",subtitle:"Evidencia pública reciente",category:"generated"});
    });
    if(c.role==="sa")[73,74].forEach(function(page){var x=(SLIDES.slides||[]).find(function(s){return s.source==="corporate"&&s.page===page;});if(x)addToDeck(sourceItem(x));});
    addToDeck({kind:"next",title:"Siguientes pasos",subtitle:"Plan de acción",category:"generated"});
    $("#suggestionNote").textContent="Deck propuesto con "+state.deck.length+" slides. Puedes editarlo libremente.";
    save();
  }

  async function assetData(url){var r=await fetch(url);if(!r.ok)throw new Error(url);var b=await r.blob();return await new Promise(function(resolve,reject){var fr=new FileReader();fr.onload=function(){resolve(fr.result);};fr.onerror=reject;fr.readAsDataURL(b);});}
  function evidenceFor(v){
    var all=liveEvidence(v);
    var analysts=/gartner|forrester|idc|marketscape|omdia|gigaom|isg|canalys|kuppinger/i;
    return all.filter(function(e){return analysts.test([e.title,e.publisher,(e.analysts||[]).join(" ")].join(" "));}).concat(all.filter(function(e){return !analysts.test([e.title,e.publisher].join(" "));})).slice(0,4);
  }
  async function generatePptx(){
    if(!state.deck.length){alert("Añade al menos una slide.");return;}
    if(typeof window.PptxGenJS==="undefined"){alert("No se ha cargado el generador PowerPoint.");return;}
    var c=ctx(),pptx=new window.PptxGenJS();pptx.layout="LAYOUT_WIDE";pptx.author="Westcon Comstor";pptx.company="Westcon Comstor";pptx.subject=c.objective||"Presentación ad-hoc";pptx.title=(c.partner||"Westcon")+" · presentación";
    var C={navy:"09283A",navy2:"123D53",white:"FFFFFF",magenta:"E5007D",cyan:"12B8BB",amber:"F7AA00",purple:"6D5AA5",green:"169F82",muted:"A9C0CB",light:"E5ECEF",dark:"173448"};
    var logo=null,hero=null;try{logo=await assetData("assets/westcon-comstor.png");}catch(e){}try{hero=await assetData("assets/hero.jpeg");}catch(e){}
    function footer(s,color){s.addShape(pptx.ShapeType.rect,{x:0,y:7.35,w:13.333,h:.15,fill:{color:color||C.magenta},line:{color:color||C.magenta}});s.addText("FY2027 · Westcon Comstor España",{x:.45,y:7.11,w:4,h:.18,fontFace:"Corbel",fontSize:7.5,color:"AEBECA",margin:0});}
    function brand(s,kicker,title,sub,accent){s.background={color:C.navy};if(logo){s.addShape(pptx.ShapeType.roundRect,{x:10.95,y:.22,w:1.88,h:.56,fill:{color:C.white},line:{color:C.white}});s.addImage({data:logo,x:11.12,y:.36,w:1.54,h:.25});}s.addText(String(kicker||"WESTCON COMSTOR").toUpperCase(),{x:.48,y:.28,w:6,h:.22,fontFace:"Corbel",fontSize:10,bold:true,color:accent||C.cyan,charSpacing:1.2,margin:0});s.addText(title,{x:.48,y:.73,w:11.7,h:.58,fontFace:"Corbel",fontSize:27,bold:true,color:C.white,margin:0,fit:"shrink"});if(sub)s.addText(sub,{x:.5,y:1.38,w:11.7,h:.36,fontFace:"Corbel",fontSize:12,color:C.muted,margin:0,fit:"shrink"});footer(s,accent||C.magenta);}
    function card(s,x,y,w,h,title,text,accent){s.addShape(pptx.ShapeType.roundRect,{x:x,y:y,w:w,h:h,rectRadius:.05,fill:{color:C.navy2},line:{color:accent||C.cyan,pt:1}});s.addText(String(title||"").toUpperCase(),{x:x+.18,y:y+.15,w:w-.36,h:.23,fontFace:"Corbel",fontSize:9.5,bold:true,color:accent||C.cyan,margin:0,fit:"shrink"});s.addText(String(text||""),{x:x+.18,y:y+.53,w:w-.36,h:h-.67,fontFace:"Corbel",fontSize:12.5,color:C.white,margin:.01,fit:"shrink",valign:"mid"});}
    async function original(item){var s=pptx.addSlide();var data=await assetData(item.asset||("assets/source-slides/corporate/slide-"+String(item.page).padStart(2,"0")+".png"));s.addImage({data:data,x:0,y:0,w:13.333,h:7.5});}
    async function vertical(item){
      var d=VERTICAL.verticals&&VERTICAL.verticals[item.vertical]&&VERTICAL.verticals[item.vertical][item.area];if(!d)return;
      var accent=item.area==="cyber"?C.magenta:item.area==="network"?C.cyan:C.amber,s=pptx.addSlide();s.background={color:"F5F8FA"};
      s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:1.48,fill:{color:item.area==="cyber"?"4A174F":item.area==="network"?"075B64":"515023"},line:{color:"FFFFFF",transparency:100}});
      s.addText(d.areaLabel,{x:.58,y:.24,w:2.8,h:.18,fontFace:"Corbel",fontSize:9,bold:true,color:C.white,margin:0});
      s.addText(item.vertical.toUpperCase(),{x:.58,y:.62,w:4.8,h:.18,fontFace:"Corbel",fontSize:9.5,bold:true,color:C.white,charSpacing:1,margin:0});
      s.addText(d.title,{x:.58,y:.93,w:10.4,h:.36,fontFace:"Corbel",fontSize:21,bold:true,color:C.white,margin:0,fit:"shrink"});
      s.addText("POR QUÉ ACTUAR AHORA",{x:.58,y:1.68,w:2.4,h:.18,fontFace:"Corbel",fontSize:8.5,bold:true,color:accent,margin:0});
      (d.why||[]).slice(0,3).forEach(function(it,i){card(s,.58+i*4.13,1.92,3.84,.9,it[0],it[1],accent);});
      s.addShape(pptx.ShapeType.roundRect,{x:.58,y:2.98,w:12.17,h:.58,fill:{color:item.area==="cyber"?"FCE5F1":item.area==="network"?"DFF7F5":"FFF1CC"},line:{color:item.area==="cyber"?"F2B4D4":item.area==="network"?"B9EAE7":"F5D778"}});s.addText("EL RETO",{x:.8,y:3.12,w:.75,h:.15,fontFace:"Corbel",fontSize:7.5,bold:true,color:accent,margin:0});s.addText(d.challenge||"",{x:1.55,y:3.08,w:10.75,h:.22,fontFace:"Corbel",fontSize:10.5,bold:true,color:C.dark,margin:0,fit:"shrink"});
      s.addText("CASOS DE USO",{x:.58,y:3.78,w:2,h:.18,fontFace:"Corbel",fontSize:8.5,bold:true,color:accent,margin:0});
      (d.cases||[]).slice(0,4).forEach(function(it,i){var col=i%2,row=Math.floor(i/2);s.addShape(pptx.ShapeType.roundRect,{x:.58+col*4.15,y:4.03+row*.93,w:3.85,h:.76,fill:{color:C.white},line:{color:"D9E2E7"}});s.addText((i+1)+"  "+it[0],{x:.72+col*4.15,y:4.14+row*.93,w:3.55,h:.14,fontFace:"Corbel",fontSize:7.7,bold:true,color:C.dark,margin:0,fit:"shrink"});s.addText(it[1],{x:.72+col*4.15,y:4.36+row*.93,w:3.55,h:.28,fontFace:"Corbel",fontSize:7,color:"667783",margin:0,fit:"shrink"});});
      s.addText("IMPACTO ESPERADO",{x:9.05,y:3.78,w:2.2,h:.18,fontFace:"Corbel",fontSize:8.5,bold:true,color:accent,margin:0});
      (d.impacts||[]).slice(0,4).forEach(function(it,i){var y=4.08+i*.47,val=Math.max(0,Math.min(100,Number(it[1]||0)));s.addText(it[0],{x:9.05,y:y,w:2.1,h:.13,fontFace:"Corbel",fontSize:7.5,bold:true,color:C.dark,margin:0});s.addText(String(val),{x:12.05,y:y,w:.45,h:.13,fontFace:"Corbel",fontSize:7.5,bold:true,color:accent,align:"right",margin:0});s.addShape(pptx.ShapeType.rect,{x:9.05,y:y+.2,w:3.35,h:.07,fill:{color:"E3EAED"},line:{color:"E3EAED"}});s.addShape(pptx.ShapeType.rect,{x:9.05,y:y+.2,w:3.35*val/100,h:.07,fill:{color:accent},line:{color:accent}});});
      s.addText("CÓMO EMPEZAR",{x:.58,y:6.15,w:1.7,h:.16,fontFace:"Corbel",fontSize:8,bold:true,color:accent,margin:0});
      (d.start||[]).slice(0,3).forEach(function(t,i){s.addText((i+1)+". "+t,{x:2.05+i*2.75,y:6.11,w:2.5,h:.28,fontFace:"Corbel",fontSize:8,bold:true,color:C.dark,margin:0,fit:"shrink"});});
      s.addShape(pptx.ShapeType.roundRect,{x:.58,y:6.65,w:12.17,h:.36,fill:{color:accent},line:{color:accent}});s.addText("Próximo paso recomendado: "+(d.nextStep||""),{x:.75,y:6.74,w:11.8,h:.1,fontFace:"Corbel",fontSize:7.5,bold:true,color:C.white,align:"center",margin:0,fit:"shrink"});
      footer(s,accent);
    }

    for(var n=0;n<state.deck.length;n++){
      var item=state.deck[n];
      if(item.kind==="source"){await original(item);continue;}
      if(item.kind==="vertical"){await vertical(item);continue;}
      if(item.kind==="cover"){
        var s=pptx.addSlide();s.background={color:C.navy};if(hero){s.addImage({data:hero,x:7.2,y:0,w:6.133,h:6.88});s.addShape(pptx.ShapeType.rect,{x:7.2,y:0,w:6.133,h:6.88,fill:{color:C.navy,transparency:38},line:{color:C.navy,transparency:100}});}if(logo){s.addShape(pptx.ShapeType.roundRect,{x:.72,y:.18,w:3.4,h:.76,fill:{color:C.white},line:{color:C.white}});s.addImage({data:logo,x:1.47,y:.31,w:1.9,h:.42});}s.addText("WESTCON COMSTOR · FY2027",{x:.62,y:1.55,w:5.9,h:.22,fontFace:"Corbel",fontSize:10,bold:true,color:C.magenta,charSpacing:1.2,margin:0});s.addText((c.partner||"PRESENTACIÓN").toUpperCase(),{x:.62,y:1.95,w:5.95,h:.7,fontFace:"Corbel",fontSize:31,bold:true,color:C.white,margin:0,fit:"shrink"});s.addText(c.objective||"Presentación ad-hoc",{x:.62,y:2.85,w:5.7,h:.75,fontFace:"Corbel",fontSize:18,color:C.white,margin:0,fit:"shrink"});if(c.vendors.length)s.addText(c.vendors.join(" · "),{x:.62,y:3.82,w:5.7,h:.32,fontFace:"Corbel",fontSize:11,bold:true,color:C.cyan,margin:0,fit:"shrink"});if(c.vertical)s.addText(c.vertical,{x:.62,y:4.28,w:5.7,h:.28,fontFace:"Corbel",fontSize:10.5,bold:true,color:C.amber,margin:0});s.addShape(pptx.ShapeType.rect,{x:0,y:6.88,w:13.333,h:.62,fill:{color:"3599BC"},line:{color:"3599BC"}});continue;
      }
      if(item.kind==="agenda"){
        var a=pptx.addSlide();brand(a,"OBJETIVO","Una conversación con foco",c.objective||"Alinear prioridades y acordar próximos pasos.",C.magenta);card(a,.7,2.05,3.7,2.15,"1 · CONTEXTO",c.partner?"Punto de partida con "+c.partner+".":"Punto de partida y prioridades compartidas.",C.cyan);card(a,4.82,2.05,3.7,2.15,"2 · PROPUESTA",c.vendors.length?"Capacidades y casos de uso de "+c.vendors.join(", ")+".":"Capacidades relevantes del portfolio Westcon.",C.magenta);card(a,8.94,2.05,3.7,2.15,"3 · SIGUIENTE PASO","Concretar una acción, responsable y fecha.",C.amber);continue;
      }
      if(item.kind==="partner"){
        var p=pptx.addSlide(),pi=partnerIntel(c.partner),ev=(pi&&((pi.evidence||pi.signals)||[]))||[];brand(p,"PARTNER",(c.partner||"Partner")+" · contexto relevante","Solo señales públicas disponibles en la base compartida.",C.cyan);
        if(ev.length){ev.slice(0,6).forEach(function(e,i){var col=i%2,row=Math.floor(i/2);card(p,.6+col*6.1,1.95+row*1.55,5.8,1.28,e.publisher||e.kind||"SEÑAL PÚBLICA",e.title||e.description||String(e),i%2?C.purple:C.cyan);});}else card(p,.8,2.2,11.7,2.2,"SIN DOSSIER CACHEADO","Ejecuta “Research partner dossier” en GitHub Actions para enriquecer esta capa con señales públicas verificadas.",C.amber);continue;
      }
      if(item.kind==="vendor-diff"){
        var vd=vendorIntel(item.vendor),d=pptx.addSlide();brand(d,"DIFERENCIACIÓN · "+item.vendor,"Qué hace diferente esta propuesta",vd.tagline||vd.valueProposition||vd.category||"",C.purple);
        card(d,.55,1.95,3.85,3.95,"CAPACIDADES DIFERENCIALES",(vd.approvedAdvantages||[]).slice(0,5).map(function(x){return "• "+x;}).join("\n"),C.magenta);
        card(d,4.72,1.95,3.85,3.95,"CRITERIOS DE DECISIÓN",(vd.decisionCriteria||vd.buyingTriggers||[]).slice(0,5).map(function(x){return "• "+x;}).join("\n"),C.cyan);
        card(d,8.89,1.95,3.85,3.95,"CÓMO DEMOSTRARLO",(vd.proofThemes||[]).slice(0,5).map(function(x){return "• "+x;}).join("\n"),C.amber);continue;
      }
      if(item.kind==="vendor-evidence"){
        var ve=pptx.addSlide(),evidence=evidenceFor(item.vendor);brand(ve,"MERCADO · "+item.vendor,"Analistas y señales públicas","Evidencia atribuible disponible en la caché; no se infieren posiciones no declaradas.",C.cyan);
        if(evidence.length)evidence.forEach(function(e,i){var col=i%2,row=Math.floor(i/2),date=e.publishedAt?String(e.publishedAt).slice(0,10):"";card(ve,.55+col*6.25,1.95+row*2.05,5.95,1.75,(e.publisher||"FUENTE")+(date?" · "+date:""),e.title||"",i%2?C.purple:C.cyan);});else card(ve,.8,2.2,11.7,2.2,"SIN EVIDENCIA CACHEADA","Ejecuta “Update public market intelligence” en GitHub Actions para poblar esta capa.",C.amber);
        try{if(evidence.length&&ve.addNotes)ve.addNotes(evidence.map(function(e){return (e.title||"")+" | "+(e.url||"");}).join("\n"));}catch(e){}continue;
      }
      if(item.kind==="next"){
        var nx=pptx.addSlide();brand(nx,"SIGUIENTE PASO","De la conversación a la acción","Un cierre simple, medible y compartido.",C.magenta);card(nx,.7,2.05,3.7,2.15,"WESTCON","Activar especialistas, fabricante y servicios necesarios.",C.magenta);card(nx,4.82,2.05,3.7,2.15,"PARTNER","Confirmar caso de uso, responsables y datos necesarios.",C.cyan);card(nx,8.94,2.05,3.7,2.15,"FABRICANTE","Alinear recursos, preventa o programa cuando aplique.",C.purple);card(nx,.7,4.65,11.95,1.15,"RESULTADO","Siguiente paso concreto, responsable y fecha.",C.amber);continue;
      }
      if(item.kind==="custom"){
        var cu=pptx.addSlide();brand(cu,"CONTENIDO AD-HOC",item.title,"",C.magenta);var lines=String(item.body||"").split(/\n+/).filter(Boolean);if(lines.length>1)cu.addText(lines.map(function(t){return {text:t,options:{bullet:{indent:14},breakLine:true}};}),{x:.75,y:2.0,w:11.8,h:4.3,fontFace:"Corbel",fontSize:17,color:C.white,fit:"shrink",margin:.02,paraSpaceAfterPt:8});else cu.addText(item.body||"",{x:.8,y:2.15,w:11.7,h:3.8,fontFace:"Corbel",fontSize:20,color:C.white,fit:"shrink",margin:0,valign:"mid"});continue;
      }
    }
    try{await pptx.writeFile({fileName:slug(c.partner||"westcon")+"-presentacion-ad-hoc-fy27.pptx"});}catch(err){console.error(err);alert("No se pudo generar el PowerPoint. Revisa la consola del navegador.");}
  }

  function bind(){
    ["partner","role","objective","vertical"].forEach(function(id){$("#"+id).addEventListener("input",function(){renderLibrary();save();});});
    $("#searchSlides").addEventListener("input",renderLibrary);
    $$("#libraryTabs button").forEach(function(b){b.addEventListener("click",function(){state.filter=b.dataset.filter;$$("#libraryTabs button").forEach(function(x){x.classList.toggle("active",x===b);});renderLibrary();});});
    $("#suggestBtn").addEventListener("click",suggestDeck);$("#baseBtn").addEventListener("click",addBaseWestcon);$("#clearDeckBtn").addEventListener("click",function(){state.deck=[];renderDeck();save();});
    $("#resetBtn").addEventListener("click",function(){if(confirm("¿Vaciar el deck y el contexto actual?")){localStorage.removeItem(STORE);location.reload();}});
    $("#generateBtn").addEventListener("click",generatePptx);$("#addCustomBtn").addEventListener("click",function(){$("#customDialog").showModal();});
    $("#saveCustomBtn").addEventListener("click",function(){var t=$("#customTitle").value.trim();if(!t)return;addToDeck({kind:"custom",title:t,body:$("#customBody").value.trim(),subtitle:"Contenido propio",category:"generated"});$("#customTitle").value="";$("#customBody").value="";$("#customDialog").close();});
  }
  function init(){
    renderVerticals();bind();
    var d=load();if(d){var c=d.context||{};$("#partner").value=c.partner||"";$("#role").value=c.role||"";$("#objective").value=c.objective||"";$("#vertical").value=c.vertical||"";(c.vendors||[]).forEach(function(v){state.vendors.add(v);});state.deck=Array.isArray(d.deck)?d.deck:[];}
    renderVendors();renderLibrary();renderDeck();
  }
  init();
})();