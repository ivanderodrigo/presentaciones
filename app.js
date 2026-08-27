/* Westcon Meeting Intelligence v1.0 FINAL — static, GitHub Pages friendly */
(() => {
  const K = window.WESTCON_KNOWLEDGE || {};
  const VI = window.WESTCON_VENDOR_INTELLIGENCE || {vendors:{},verticalSignals:{}};
  const LIVE = window.WESTCON_LIVE_INTELLIGENCE || {vendors:{},generatedAt:null};
  const state = { primaryRole: null, supportRoles: new Set(), currentId: null };
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const fmtMoney = n => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n||0));
  const slug = s => (s||'reunion').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60) || 'reunion';
  const nowIso = () => new Date().toISOString();
  const esc = s => String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const vendorLogo = name => {
    const map = window.WESTCON_VENDOR_LOGOS || {};
    if (map[name]) return map[name];
    const norm = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    return `assets/vendors/${norm}.png`;
  };
  const roleById = id => (K.roles||[]).find(r=>r.id===id);
  const getVal = id => $(id.startsWith('#')?id:'#'+id)?.value?.trim?.() ?? '';
  const setVal = (id,v) => { const e=$(id.startsWith('#')?id:'#'+id); if(e) e.value=v??''; };
  const checked = id => !!$(id.startsWith('#')?id:'#'+id)?.checked;
  const storageKey='westconMeetingIntelligence.v1.meetings';
  const prefsKey='westconMeetingIntelligence.v1.prefs';
  const runtimeIntel={partner:{evidence:[],updatedAt:null},vendors:{},lastRun:null,errors:[]};
  const runtimeCacheKey='westconMeetingIntelligence.v1.runtimeResearch';
  const ANALYST_DOMAINS=['gartner.com','forrester.com','idc.com','omdia.tech.informa.com','gigaom.com','isg-one.com','canalys.com','kuppingercole.com'];
  const TRUSTED_MEDIA=['crn.com','theregister.com','techtarget.com','computerweekly.com','sdxcentral.com','siliconangle.com','venturebeat.com','darkreading.com','securityweek.com','helpnetsecurity.com','networkworld.com','cio.com','techradar.com','infosecurity-magazine.com'];

  // ---------- Rendering ----------
  function renderRoles(){
    const host=$('#roleCards'); host.innerHTML='';
    (K.roles||[]).forEach(r=>{
      const b=document.createElement('button'); b.type='button'; b.className='role-card'; b.dataset.role=r.id; b.style.setProperty('--role-accent',r.accent);
      b.innerHTML=`<i></i><strong>${esc(r.name)}</strong><span>${esc(r.mission)}</span>`;
      b.addEventListener('click',()=>selectPrimaryRole(r.id)); host.appendChild(b);
    });
    const support=$('#supportRoles'); support.innerHTML='';
    (K.roles||[]).forEach(r=>{
      const lab=document.createElement('label'); lab.className='chip'; lab.dataset.role=r.id;
      lab.innerHTML=`<input type="checkbox" value="${r.id}"><span>${esc(r.name)}</span>`;
      $('input',lab).addEventListener('change',e=>{
        if(e.target.checked) state.supportRoles.add(r.id); else state.supportRoles.delete(r.id);
        lab.classList.toggle('active',e.target.checked); updateProgress();
      }); support.appendChild(lab);
    });
  }

  function selectPrimaryRole(id){
    state.primaryRole=id;
    $$('.role-card').forEach(b=>b.classList.toggle('selected',b.dataset.role===id));
    const r=roleById(id); $('#activeRoleBadge').textContent=r?.name||'Sin seleccionar';
    // primary role cannot also be support
    const chip=$(`#supportRoles .chip[data-role="${id}"]`); if(chip){ const inp=$('input',chip); inp.checked=false; inp.disabled=true; chip.classList.remove('active'); state.supportRoles.delete(id); }
    $$('#supportRoles .chip').filter(c=>c.dataset.role!==id).forEach(c=>$('input',c).disabled=false);
    renderRoleFields(id);
    const chosen=$$('#vendorGrid input:checked').map(x=>x.value);
    const focus=id==='vsm'?$('#vsmVendor'):id==='sa'?$('#saVendor'):null; if(focus&&chosen.length===1&&!focus.value)focus.value=chosen[0];
    renderResearch(); updateProgress();
  }

  function renderVendors(){
    const grid=$('#vendorGrid'); grid.innerHTML='';
    (K.vendors||[]).forEach((v,i)=>{
      const lab=document.createElement('label'); lab.className='vendor-option'; lab.dataset.search=(v.name+' '+v.area+' '+(v.tags||[]).join(' ')).toLowerCase();
      lab.innerHTML=`<input type="checkbox" value="${esc(v.name)}"><img src="${vendorLogo(v.name)}" alt=""><div><strong>${esc(v.name)}</strong><small>${esc(v.area)}</small></div>`;
      $('input',lab).addEventListener('change',e=>{lab.classList.toggle('selected',e.target.checked); if(e.target.checked){const focusId=state.primaryRole==='vsm'?'#vsmVendor':state.primaryRole==='sa'?'#saVendor':null;const focus=focusId?$(focusId):null;if(focus&&!focus.value)focus.value=e.target.value;} updateProgress();}); grid.appendChild(lab);
    });
    $('#vendorSearch').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase(); $$('.vendor-option',grid).forEach(x=>x.style.display=!q||x.dataset.search.includes(q)?'flex':'none');});
  }

  function renderServices(){
    const host=$('#serviceChips'); host.innerHTML='';
    (K.westconServices||[]).forEach(s=>{const l=document.createElement('label');l.className='chip';l.innerHTML=`<input type="checkbox" value="${esc(s)}"><span>${esc(s)}</span>`;$('input',l).addEventListener('change',e=>l.classList.toggle('active',e.target.checked));host.appendChild(l);});
  }
  function renderVerticals(){
    const sel=$('#vertical'); sel.innerHTML='<option value="">Sin vertical concreta</option>'+(K.verticals||[]).map(v=>`<option>${esc(v)}</option>`).join('');
  }

  const researchItems={
    partner:{title:'Perfil del partner',desc:'Portfolio, especialización, tamaño, sedes y estrategia.'},
    alliances:{title:'Fabricantes y alianzas',desc:'Vendors actuales, partner tiers y tecnologías promovidas.'},
    certifications:{title:'Certificaciones',desc:'Certificaciones, badges, especializaciones y skills visibles.'},
    news:{title:'Noticias y movimientos',desc:'Noticias, adquisiciones, contratos, eventos y cambios relevantes.'},
    verticals:{title:'Verticales y referencias',desc:'Sectores, clientes públicos y casos de éxito del partner.'},
    careers:{title:'Talento y ofertas',desc:'Vacantes como señal de inversión, capacidades y estrategia.'},
    channel:{title:'Programa de canal',desc:'Tier, requisitos, certificaciones, rebates, MDF e incentivos públicos.'},
    analyst:{title:'Analistas',desc:'Gartner, IDC, Forrester, Omdia, Canalys, GigaOm e ISG.'},
    competition:{title:'Competencia',desc:'Alternativas tecnológicas y vendors que compiten en el caso.'},
    technical:{title:'Arquitectura y documentación',desc:'Guías oficiales, integraciones, referencias y diseño recomendado.'},
    market:{title:'Tendencias de mercado',desc:'Cambios regulatorios, demanda, crecimiento y prioridades del sector.'},
    cases:{title:'Casos públicos',desc:'Casos de éxito verificables del fabricante y del ecosistema.'}
  };
  const defaultsByRole={
    psm:['partner','alliances','certifications','news','verticals','careers','market','analyst','competition','cases'],
    vsm:['partner','alliances','certifications','news','channel','verticals','market','analyst','competition','cases'],
    sa:['partner','alliances','certifications','analyst','competition','technical','market','cases'],
    commercial:['partner','alliances','news','verticals','careers','market','cases']
  };
  function renderResearch(){
    const host=$('#researchGrid'); if(!host)return;
    const cards=[
      ['PARTNER','Portfolio, fabricantes, certificaciones, especialización, estrategia, noticias, proyectos y señales de inversión.'],
      ['FABRICANTES','Ventajas competitivas, casos públicos, documentación, programas de canal, novedades y evidencia oficial.'],
      ['MERCADO','Competidores, tendencias, verticales, regulación, movimientos de canal y medios especializados.'],
      ['ANALISTAS','Gartner, Forrester, IDC, Omdia, GigaOm, ISG, Canalys y otras fuentes públicas verificables.']
    ];
    host.innerHTML=cards.map(([t,d],i)=>`<div class="research-summary-card"><i>${i+1}</i><div><strong>${t}</strong><span>${d}</span></div></div>`).join('');
  }

  function vendorOptions(selected=''){return '<option value="">Seleccionar</option>'+(K.vendors||[]).map(v=>`<option ${v.name===selected?'selected':''}>${esc(v.name)}</option>`).join('');}
  function renderRoleFields(role){
    const h=$('#roleFields'); h.classList.remove('empty-state');
    const title=$('#roleSectionTitle');
    if(role==='psm'){
      title.textContent='PSM · lo que solo tú conoces';
      h.innerHTML=`
        <div class="role-intro"><strong>PSM:</strong> basta con el contexto que no puede encontrar Internet. La facturación, pipeline y compromisos son opcionales y enriquecen la business review.</div>
        <label>Contexto de la relación (opcional)<textarea id="psmContext" rows="3" placeholder="Personas clave, fricciones, prioridades, compromisos anteriores o algo que deba saber antes de preparar la reunión..."></textarea></label>
        <details class="details-block compact-details"><summary>Añadir datos de negocio y pipeline</summary>
          <div class="grid three"><label>Estado de la relación<select id="psmRelationship"><option>Estratégica</option><option selected>En desarrollo</option><option>Transaccional</option><option>A recuperar</option><option>Nueva</option></select></label><label>Objetivo FY / cuenta (€)<input type="number" id="psmTarget" placeholder="0"></label><label>Potencial estimado<select id="psmPotential"><option>Muy alto</option><option selected>Alto</option><option>Medio</option><option>Bajo</option></select></label></div>
          <h3>Facturación y evolución por fabricante</h3><div class="table-wrap"><table><thead><tr><th>Fabricante</th><th>FY25</th><th>FY26</th><th>FY27 YTD</th><th>Objetivo FY27</th><th>Pipeline</th><th></th></tr></thead><tbody id="businessRows"></tbody></table></div><div class="table-actions"><button type="button" class="secondary" id="addBusinessRow">＋ Añadir fabricante</button></div><div id="businessMetrics" class="metric-row"></div>
          <h3>Oportunidades conocidas</h3>${opportunityTable()}
          <label>Áreas de crecimiento que ya sospechas<textarea id="psmWhitespace" rows="3" placeholder="Fabricantes, servicios o capacidades que crees que deberíamos explorar..."></textarea></label>
          <label>Acciones / compromisos previos<textarea id="psmActions" rows="3" placeholder="Acciones abiertas, responsables y temas pendientes..."></textarea></label>
        </details>`;
      bindBusinessTable(); bindOpportunityTable();
    } else if(role==='vsm'){
      title.textContent='VSM · fabricante y relación';
      h.innerHTML=`
        <div class="role-intro"><strong>VSM:</strong> selecciona el fabricante foco. Lo demás es opcional: la aplicación investiga posicionamiento, noticias, canal y evidencias públicas automáticamente.</div>
        <label>Fabricante foco<select id="vsmVendor">${vendorOptions()}</select></label>
        <details class="details-block compact-details"><summary>Añadir estado comercial, certificaciones e incentivos</summary>
          <div class="grid three"><label>Tier / nivel actual<input id="vsmTier" placeholder="Ej. Platinum / Gold / Registered..."></label><label>Tier objetivo<input id="vsmTargetTier" placeholder="Nivel al que queremos llegar"></label><label>Estado relación<select id="vsmRelationship"><option>Estratégica</option><option selected>En desarrollo</option><option>Inicial</option><option>Bloqueada</option><option>A recuperar</option></select></label><label>Facturación FY27 YTD (€)<input type="number" id="vsmRevenue" placeholder="0"></label><label>Objetivo FY27 (€)<input type="number" id="vsmTarget" placeholder="0"></label></div>
          <div class="grid two"><label>Certificaciones actuales<textarea id="vsmCerts" rows="3" placeholder="Solo si las conoces"></textarea></label><label>Certificaciones en proceso / necesarias<textarea id="vsmCertsNext" rows="3" placeholder="Solo si las conoces"></textarea></label><label>Plan de canal / objetivos acordados<textarea id="vsmChannelPlan" rows="3" placeholder="Prioridades ya acordadas con el vendor o el partner"></textarea></label><label>Incentivos, rebates, MDF y campañas<textarea id="vsmIncentives" rows="3" placeholder="Información interna que quieras incorporar"></textarea></label></div>
          <h3>Pipeline del fabricante</h3>${opportunityTable()}<label>Bloqueos y ayuda necesaria<textarea id="vsmBlockers" rows="3" placeholder="Qué está frenando certificación, venta, pipeline o relación"></textarea></label>
        </details>`;
      bindOpportunityTable();
    } else if(role==='sa'){
      title.textContent='Solution Architect · caso de uso';
      h.innerHTML=`
        <div class="role-intro"><strong>Solution Architect:</strong> selecciona el fabricante y, si puedes, describe el caso de uso. La aplicación prepara el resto: arquitectura narrativa, diferenciación, evidencia de mercado y criterios de PoC/PoV.</div>
        <div class="grid two"><label>Fabricante foco<select id="saVendor">${vendorOptions()}</select></label><label>Caso de uso / problema técnico<input id="saUseCase" placeholder="Ej. Zero Trust, modernización campus, OT visibility, API Security..."></label></div>
        <details class="details-block compact-details"><summary>Añadir contexto técnico conocido</summary><div class="grid two"><label>Arquitectura / stack actual<textarea id="saCurrent" rows="3" placeholder="Tecnologías actuales, dependencias, restricciones..."></textarea></label><label>Requisitos y criterios de diseño<textarea id="saRequirements" rows="3" placeholder="Escala, rendimiento, integración, seguridad, cloud, operación..."></textarea></label><label>Alternativas que sabes que se están valorando<textarea id="saCompetitors" rows="3" placeholder="Opcional; no se mostrará necesariamente al partner"></textarea></label><label>Diferenciadores que quieres enfatizar<textarea id="saDifferentiators" rows="3" placeholder="Opcional; el motor también los investiga"></textarea></label><label>Evidencia concreta que ya tengas<textarea id="saAnalysts" rows="3" placeholder="Informe, benchmark, caso público o dato que quieras forzar"></textarea></label><label>Criterios de éxito de PoC / PoV<textarea id="saPoc" rows="3" placeholder="Qué debe medirse para demostrar valor"></textarea></label></div><label>Riesgos, objeciones o limitaciones conocidas<textarea id="saRisks" rows="3" placeholder="Compatibilidad, costes, madurez, migración..."></textarea></label></details>`;
    } else { h.className='role-fields empty-state'; h.innerHTML='<p>Selecciona PSM, VSM o Solution Architect.</p>'; }
    $$('#roleFields input, #roleFields select, #roleFields textarea').forEach(e=>e.addEventListener('input',updateProgress)); setTimeout(updateProgress,0);
  }

  function opportunityTable(){return `<div class="table-wrap"><table><thead><tr><th>Cuenta / oportunidad</th><th>Fabricante</th><th>Solución</th><th>Importe</th><th>Fase</th><th>%</th><th></th></tr></thead><tbody id="opportunityRows"></tbody></table></div><div class="table-actions"><button type="button" class="secondary" id="addOpportunityRow">＋ Añadir oportunidad</button></div><div id="oppMetrics" class="metric-row"></div>`;}

  function addBusinessRow(data={}){
    const t=$('#businessRowTemplate'); if(!t||!$('#businessRows')) return; const row=t.content.firstElementChild.cloneNode(true); $('.row-vendor',row).innerHTML=vendorOptions(data.vendor||'');
    [['.fy25','fy25'],['.fy26','fy26'],['.fy27','fy27'],['.target','target'],['.pipeline','pipeline']].forEach(([s,k])=>$('.'+s.replace('.',''),row).value=data[k]??'');
    $('.remove-row',row).addEventListener('click',()=>{row.remove();updateBusinessMetrics();}); $$('input,select',row).forEach(e=>e.addEventListener('input',updateBusinessMetrics)); $('#businessRows').appendChild(row); updateBusinessMetrics();
  }
  function bindBusinessTable(){ $('#addBusinessRow')?.addEventListener('click',()=>addBusinessRow()); addBusinessRow(); }
  function updateBusinessMetrics(){
    const rows=getBusinessRows(); const fy26=rows.reduce((a,r)=>a+r.fy26,0), fy27=rows.reduce((a,r)=>a+r.fy27,0), target=rows.reduce((a,r)=>a+r.target,0), pipeline=rows.reduce((a,r)=>a+r.pipeline,0); const growth=fy26?((fy27-fy26)/fy26*100):0; const h=$('#businessMetrics'); if(!h)return; h.innerHTML=`<div class="metric-box"><span>FY26 total</span><strong>${fmtMoney(fy26)}</strong></div><div class="metric-box"><span>FY27 YTD</span><strong>${fmtMoney(fy27)}</strong></div><div class="metric-box"><span>Evolución*</span><strong>${growth>=0?'+':''}${growth.toFixed(1)}%</strong></div><div class="metric-box"><span>Pipeline</span><strong>${fmtMoney(pipeline)}</strong></div>`; }
  function getBusinessRows(){ return $$('#businessRows tr').map(r=>({vendor:$('.row-vendor',r).value,fy25:Number($('.fy25',r).value||0),fy26:Number($('.fy26',r).value||0),fy27:Number($('.fy27',r).value||0),target:Number($('.target',r).value||0),pipeline:Number($('.pipeline',r).value||0)})).filter(r=>r.vendor||r.fy25||r.fy26||r.fy27||r.target||r.pipeline); }

  function addOpportunityRow(data={}){
    const t=$('#opportunityRowTemplate'); if(!t||!$('#opportunityRows')) return; const row=t.content.firstElementChild.cloneNode(true); $('.opp-vendor',row).innerHTML=vendorOptions(data.vendor||'');
    $('.opp-name',row).value=data.name||''; $('.opp-solution',row).value=data.solution||''; $('.opp-amount',row).value=data.amount??''; $('.opp-stage',row).value=data.stage||'Discovery'; $('.opp-prob',row).value=data.prob??50;
    $('.remove-row',row).addEventListener('click',()=>{row.remove();updateOppMetrics();}); $$('input,select',row).forEach(e=>e.addEventListener('input',updateOppMetrics)); $('#opportunityRows').appendChild(row); updateOppMetrics();
  }
  function bindOpportunityTable(){ $('#addOpportunityRow')?.addEventListener('click',()=>addOpportunityRow()); addOpportunityRow(); }
  function getOpportunityRows(){return $$('#opportunityRows tr').map(r=>({name:$('.opp-name',r).value.trim(),vendor:$('.opp-vendor',r).value,solution:$('.opp-solution',r).value.trim(),amount:Number($('.opp-amount',r).value||0),stage:$('.opp-stage',r).value,prob:Number($('.opp-prob',r).value||0)})).filter(r=>r.name||r.vendor||r.solution||r.amount);}
  function updateOppMetrics(){const rows=getOpportunityRows(),total=rows.reduce((a,r)=>a+r.amount,0),weighted=rows.reduce((a,r)=>a+r.amount*(r.prob/100),0),commit=rows.filter(r=>r.stage==='Commit').reduce((a,r)=>a+r.amount,0);const h=$('#oppMetrics'); if(!h)return; h.innerHTML=`<div class="metric-box"><span>Oportunidades</span><strong>${rows.length}</strong></div><div class="metric-box"><span>Pipeline</span><strong>${fmtMoney(total)}</strong></div><div class="metric-box"><span>Ponderado</span><strong>${fmtMoney(weighted)}</strong></div><div class="metric-box"><span>Commit</span><strong>${fmtMoney(commit)}</strong></div>`;}

  function roleData(){
    if(state.primaryRole==='psm') return {relationship:getVal('psmRelationship'),target:Number(getVal('psmTarget')||0),potential:getVal('psmPotential'),context:getVal('psmContext'),business:getBusinessRows(),opportunities:getOpportunityRows(),whitespace:getVal('psmWhitespace'),actions:getVal('psmActions')};
    if(state.primaryRole==='vsm') return {vendor:getVal('vsmVendor'),tier:getVal('vsmTier'),targetTier:getVal('vsmTargetTier'),revenue:Number(getVal('vsmRevenue')||0),target:Number(getVal('vsmTarget')||0),relationship:getVal('vsmRelationship'),certs:getVal('vsmCerts'),certsNext:getVal('vsmCertsNext'),channelPlan:getVal('vsmChannelPlan'),incentives:getVal('vsmIncentives'),opportunities:getOpportunityRows(),blockers:getVal('vsmBlockers')};
    if(state.primaryRole==='sa') return {vendor:getVal('saVendor'),useCase:getVal('saUseCase'),current:getVal('saCurrent'),requirements:getVal('saRequirements'),competitors:getVal('saCompetitors'),differentiators:getVal('saDifferentiators'),analysts:getVal('saAnalysts'),poc:getVal('saPoc'),risks:getVal('saRisks')};
    return {};
  }

  function gatherMeeting(){
    return {
      schemaVersion:'1.0.0', id:state.currentId||crypto.randomUUID?.()||String(Date.now()), updatedAt:nowIso(), partner:getVal('partnerName'), country:getVal('country'), meetingType:getVal('meetingType'), duration:getVal('duration'), objective:getVal('objective'), desiredOutcome:getVal('desiredOutcome'), primaryRole:state.primaryRole, supportRoles:[...state.supportRoles],
      vendors:$$('#vendorGrid input:checked').map(x=>x.value), vertical:getVal('vertical'), technologies:getVal('technologies'), includeGeneral:checked('includeGeneral'), reserveVendorSlides:checked('reserveVendorSlides'), includeServices:checked('includeServices'), services:$$('#serviceChips input:checked').map(x=>x.value),
      roleData:roleData(), research:(defaultsByRole[state.primaryRole]||Object.keys(researchItems)), researchHorizon:Number(getVal('researchHorizon')||90), knownSources:getVal('knownSources'),
      outputs:{depth:getVal('deckDepth'),language:getVal('language'),tone:getVal('tone'),pptx:checked('outPptx'),brief:checked('outBrief'),notes:checked('outNotes'),questions:checked('outQuestions'),pdf:checked('outPdf'),sources:checked('outSources')}
    };
  }

  function computeCompleteness(m=gatherMeeting()){
    let score=0,total=0; const req=(ok,w=1)=>{total+=w;if(ok)score+=w;};
    req(!!m.partner,4);req(!!m.primaryRole,4);req(!!m.objective,3);
    if(m.primaryRole==='psm')req(true,3);
    if(m.primaryRole==='vsm')req(!!m.roleData.vendor||m.vendors.length>0,3);
    if(m.primaryRole==='sa'){req(!!m.roleData.vendor||m.vendors.length>0,3);req(!!m.roleData.useCase||!!m.objective||!!m.technologies,2);}
    return Math.round(score/Math.max(total,1)*100);
  }
  function missingData(m=gatherMeeting()){
    const x=[];if(!m.partner)x.push('partner');if(!m.primaryRole)x.push('perfil');if(!m.objective)x.push('objetivo');if((m.primaryRole==='vsm'||m.primaryRole==='sa')&&!m.vendors.length&&!m.roleData?.vendor)x.push('fabricante');return x;
  }
  function updateProgress(){const m=gatherMeeting(),s=computeCompleteness(m),miss=missingData(m);$('#progressBar').style.width=s+'%';$('#progressText').textContent=s+'% completado';$('#gapText').textContent=miss.length?'Falta: '+miss.slice(0,3).join(', '):'Listo para investigar';$('#readyTitle').textContent=s>=70?'Listo para investigar y preparar':'Completa los datos esenciales';$('#readySubtitle').textContent=miss.length?'Falta: '+miss.join(', '):'El resto lo hará automáticamente la aplicación.';}

  // ---------- Blueprint intelligence ----------
  function derivedBusinessInsights(m){
    const out=[]; const b=m.roleData.business||[];
    if(b.length){
      const valid=b.filter(r=>r.fy26||r.fy27); const growths=valid.map(r=>({vendor:r.vendor,g:r.fy26?((r.fy27-r.fy26)/r.fy26*100):null,fy27:r.fy27,pipeline:r.pipeline}));
      const positives=growths.filter(x=>x.g!==null).sort((a,b)=>b.g-a.g); const negatives=[...positives].sort((a,b)=>a.g-b.g);
      if(positives[0]?.g>0) out.push({type:'good',text:`${positives[0].vendor} es el mayor crecimiento registrado (${positives[0].g.toFixed(1)}% frente al dato FY26 introducido).`});
      if(negatives[0]?.g<0) out.push({type:'warn',text:`${negatives[0].vendor} presenta la mayor caída (${negatives[0].g.toFixed(1)}%); conviene validar causa y plan de recuperación.`});
      const total=b.reduce((a,r)=>a+r.fy27,0); if(total>0){const top=[...b].sort((a,b)=>b.fy27-a.fy27)[0];const share=top.fy27/total*100;if(share>60)out.push({type:'warn',text:`Concentración elevada: ${top.vendor} representa aproximadamente ${share.toFixed(0)}% del FY27 YTD cargado.`});}
      const pipe=b.reduce((a,r)=>a+r.pipeline,0); if(pipe>0)out.push({type:'good',text:`Pipeline agregado declarado: ${fmtMoney(pipe)}. La reunión debería cerrar responsables y próximos hitos por oportunidad.`});
    }
    return out;
  }
  function researchQueries(m){
    const partner=m.partner||'[partner]'; const focus=m.roleData.vendor||m.vendors[0]||''; const qs=[];
    if(m.research.includes('partner')) qs.push(`"${partner}" portfolio technology strategy`);
    if(m.research.includes('alliances')) qs.push(`"${partner}" partners vendors alliances certifications`);
    if(m.research.includes('certifications')) qs.push(`"${partner}" ${focus} certification partner tier`);
    if(m.research.includes('news')) qs.push(`"${partner}" news ${new Date().getFullYear()}`);
    if(m.research.includes('careers')) qs.push(`"${partner}" jobs cybersecurity networking cloud`);
    if(m.research.includes('channel')&&focus) qs.push(`"${focus}" partner program incentives certifications channel`);
    if(m.research.includes('analyst')&&focus){['Gartner','IDC MarketScape','Forrester Wave','Omdia'].forEach(a=>qs.push(`"${focus}" ${a} ${new Date().getFullYear()}`));}
    if(m.research.includes('competition')&&focus) qs.push(`"${focus}" competitors alternatives comparison enterprise`);
    if(m.research.includes('technical')&&focus) qs.push(`site:${domainHint(focus)} architecture reference design integration ${m.roleData.useCase||m.technologies||''}`);
    if(m.research.includes('cases')&&focus) qs.push(`"${focus}" customer case study ${m.vertical||''}`);
    return qs.slice(0,12);
  }
  const OFFICIAL_DOMAINS={'Anomali':'anomali.com','AttackIQ':'attackiq.com','Certes Networks':'certesnetworks.com','Cisco':'cisco.com','Claroty':'claroty.com','CrowdStrike':'crowdstrike.com','F5':'f5.com','FireMon':'firemon.com','Fortanix':'fortanix.com','Ivanti':'ivanti.com','LevelBlue':'levelblue.com','Menlo Security':'menlosecurity.com','NETSCOUT':'netscout.com','Noname / Akamai API Security':'akamai.com','Okta':'okta.com','Palo Alto Networks':'paloaltonetworks.com','Ping Identity':'pingidentity.com','Proofpoint':'proofpoint.com','Vectra AI':'vectra.ai','XM Cyber':'xmcyber.com','Zscaler':'zscaler.com','1Password':'1password.com','Ciena':'ciena.com','EfficientIP':'efficientip.com','Ericsson':'ericsson.com','Extreme Networks':'extremenetworks.com','Juniper Networks':'juniper.net','Nokia':'nokia.com','Ruckus Networks':'ruckusnetworks.com','Weblib':'weblib.fr','AudioCodes':'audiocodes.com','Avaya':'avaya.com','AWS':'aws.amazon.com','Microsoft':'microsoft.com','Penguin Solutions':'penguinsolutions.com','UiPath':'uipath.com'};
  function domainHint(v){return OFFICIAL_DOMAINS[v]||'google.com';}
  function gdeltTimespan(days){if(days<=30)return '1m';if(days<=120)return '3m';return '1y';}
  async function gdeltQuery(query,days=90,max=60){const url='https://api.gdeltproject.org/api/v2/doc/doc?query='+encodeURIComponent(query)+'&mode=artlist&format=json&sort=datedesc&maxrecords='+Math.min(100,max)+'&timespan='+gdeltTimespan(days);const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),9000);try{const r=await fetch(url,{signal:ctrl.signal,headers:{Accept:'application/json'}});if(!r.ok)throw new Error('GDELT '+r.status);const j=await r.json();const rows=j.articles||j.items||[];return rows.map(a=>({title:a.title||a.name||'',url:a.url||a.link||'',publisher:a.domain||a.source||'',publishedAt:a.seendate||a.date||a.publishedAt||'',language:a.language||'',sourcecountry:a.sourcecountry||'',query})).filter(x=>x.title&&x.url);}finally{clearTimeout(timer);}}
  function evidenceDomain(e){try{return new URL(e.url).hostname.replace(/^www\./,'').toLowerCase()}catch{return String(e.publisher||'').toLowerCase().replace(/^www\./,'')}}
  function evidenceAuthority(e,vendor=''){const d=evidenceDomain(e),t=String(e.title||'').toLowerCase();let score=45,kind='media';if(ANALYST_DOMAINS.some(x=>d===x||d.endsWith('.'+x))){score=98;kind='analyst-direct';}else if(vendor&&OFFICIAL_DOMAINS[vendor]&&(d===OFFICIAL_DOMAINS[vendor]||d.endsWith('.'+OFFICIAL_DOMAINS[vendor]))){score=90;kind='vendor-official';}else if(TRUSTED_MEDIA.some(x=>d===x||d.endsWith('.'+x))){score=78;kind='trusted-media';}if(/gartner|forrester|marketscape|idc |omdia|gigaom|isg |canalys|kuppinger/.test(t))score+=8;if(/leader|leaders|magic quadrant|wave|marketscape|market leader|strong performer|challenger|visionary/.test(t))score+=5;return {score:Math.min(100,score),kind};}
  function normalizeRuntimeEvidence(items,vendor=''){const seen=new Set(),out=[];for(const e of items||[]){const k=(e.url||'')+'|'+(e.title||'');if(!e.url||seen.has(k))continue;seen.add(k);const a=evidenceAuthority(e,vendor),title=String(e.title||'').trim(),analysts=['Gartner','Forrester','IDC','Omdia','GigaOm','ISG','Canalys','KuppingerCole'].filter(x=>title.toLowerCase().includes(x.toLowerCase()));out.push({...e,analysts,confidence:a.score>=90?'high':a.score>=72?'medium':'low',authorityScore:a.score,kind:a.kind});}return out.sort((a,b)=>(b.authorityScore||0)-(a.authorityScore||0)||String(b.publishedAt||'').localeCompare(String(a.publishedAt||'')));}
  async function mapLimit(tasks,limit=5){const results=[];let idx=0;async function worker(){while(idx<tasks.length){const i=idx++;try{results[i]=await tasks[i]();}catch(e){results[i]=[];runtimeIntel.errors.push(String(e?.message||e));}}}await Promise.all(Array.from({length:Math.min(limit,tasks.length)},worker));return results;}
  function loadRuntimeCache(){try{const x=JSON.parse(localStorage.getItem(runtimeCacheKey)||'null');if(x&&Date.now()-new Date(x.savedAt||0).getTime()<12*3600*1000)return x;}catch{}return null;}
  function saveRuntimeCache(payload){try{localStorage.setItem(runtimeCacheKey,JSON.stringify({...payload,savedAt:new Date().toISOString()}));}catch{}}
  async function runtimeDeepResearch(m){
    const key=[m.partner,m.primaryRole,m.researchHorizon,m.objective,m.technologies,m.roleData?.useCase,...selectedVendorNames(m).slice(0,6)].join('|').toLowerCase(),cache=loadRuntimeCache();
    if(cache?.key===key){runtimeIntel.partner=cache.partner||runtimeIntel.partner;runtimeIntel.vendors=cache.vendors||runtimeIntel.vendors;runtimeIntel.lastRun=cache.savedAt;return runtimeIntel;}
    const tasks=[],meta=[],days=m.researchHorizon||90,partner=m.partner,vendorNames=prioritizedVendorNames(m).slice(0,m.outputs.depth==='deep'?5:3);
    const push=(type,name,q)=>{meta.push({type,name,q});tasks.push(()=>gdeltQuery(q,days,80));};
    push('partner','partner',`"${partner}" (strategy OR partnership OR certification OR acquisition OR investment OR cybersecurity OR networking OR cloud OR AI)`);
    push('partner','partner',`"${partner}" (customer OR project OR contract OR award OR expansion OR hiring OR careers)`);
    if(vendorNames.length)push('partner','partner',`"${partner}" (${vendorNames.map(x=>'"'+x+'"').join(' OR ')})`);
    for(const name of vendorNames){
      const dom=domainHint(name);
      push('vendor',name,`"${name}" (Gartner OR Forrester OR "IDC MarketScape" OR Omdia OR GigaOm OR ISG OR Canalys OR KuppingerCole)`);
      push('vendor',name,`"${name}" (domainis:gartner.com OR domainis:forrester.com OR domainis:idc.com OR domainis:canalys.com OR domainis:gigaom.com OR domainis:isg-one.com)`);
      push('vendor',name,`"${name}" (customer OR "case study" OR deployment OR award OR innovation OR launch OR acquisition OR partnership)`);
      push('vendor',name,`"${name}" domainis:${dom} (report OR analyst OR customer OR partner OR award OR architecture OR launch)`);
      push('vendor',name,`"${name}" "${partner}"`);
      if(m.primaryRole==='vsm')push('vendor',name,`"${name}" ("partner program" OR certification OR specialization OR channel OR incentive OR MDF)`);
      if(m.primaryRole==='sa')push('vendor',name,`"${name}" (${m.roleData.useCase||m.technologies||'architecture'} OR integration OR benchmark OR performance OR reference design OR deployment)`);
    }
    const groups=await mapLimit(tasks,5),partnerEv=[],vendorEv={};
    groups.forEach((rows,i)=>{const x=meta[i];if(x.type==='partner')partnerEv.push(...rows);else vendorEv[x.name]=(vendorEv[x.name]||[]).concat(rows);});
    runtimeIntel.partner={evidence:normalizeRuntimeEvidence(partnerEv).slice(0,20),updatedAt:new Date().toISOString()};
    for(const [name,rows] of Object.entries(vendorEv))runtimeIntel.vendors[name]={evidence:normalizeRuntimeEvidence(rows,name).slice(0,30),updatedAt:new Date().toISOString(),status:'runtime'};
    runtimeIntel.lastRun=new Date().toISOString();saveRuntimeCache({key,partner:runtimeIntel.partner,vendors:runtimeIntel.vendors});return runtimeIntel;
  }
  function vendorIntel(name){return VI?.vendors?.[name]||null;}
  function liveVendorIntel(name){const base=LIVE?.vendors?.[name]||{evidence:[],status:'not-refreshed'},rt=runtimeIntel.vendors?.[name]||{evidence:[]};return {...base,evidence:normalizeRuntimeEvidence([...(rt.evidence||[]),...(base.evidence||[])],name),runtimeUpdatedAt:rt.updatedAt};}
  function intelligenceFreshness(){const d=runtimeIntel.lastRun||LIVE?.generatedAt;if(!d)return 'Se actualizará al preparar la reunión';try{return `Actualizado ${new Date(d).toLocaleString('es-ES')}`;}catch{return String(d);}}
  function vendorVerticalAngle(name,vertical){
    const p=vendorIntel(name); if(!p) return [];
    const tokens=(VI?.verticalSignals?.[vertical]||[]).map(x=>String(x).toLowerCase());
    const source=[...(p.buyingTriggers||[]),...(p.approvedAdvantages||[])];
    const scored=source.map(text=>({text,score:tokens.reduce((n,t)=>n+(String(text).toLowerCase().includes(t)?2:0),0)})).sort((a,b)=>b.score-a.score);
    return scored.slice(0,3).map(x=>x.text);
  }
  function analystEvidenceFor(name){return (liveVendorIntel(name).evidence||[]).filter(x=>x?.title&&((x.analysts||[]).length||/gartner|forrester|idc|marketscape|omdia|gigaom|isg|canalys|kuppinger/i.test(x.title))&&(x.authorityScore===undefined||x.authorityScore>=68)).slice(0,8);}
  function marketEvidenceFor(name){return (liveVendorIntel(name).evidence||[]).filter(x=>x?.title&&(x.authorityScore===undefined||x.authorityScore>=72)).slice(0,12);}
  function partnerEvidenceFor(){return (runtimeIntel.partner?.evidence||[]).filter(x=>x?.title&&(x.authorityScore===undefined||x.authorityScore>=60)).slice(0,8);}
  function vendorSalesInsights(m){
    const out=[];
    for(const name of selectedVendorNames(m).slice(0,6)){
      const p=vendorIntel(name); if(!p) continue;
      out.push({type:'good',text:`${name}: ${p.tagline||p.category}. Señales de compra: ${(p.buyingTriggers||[]).slice(0,2).join(' · ')}`});
      const ev=analystEvidenceFor(name); if(ev.length) out.push({type:'good',text:`${name}: ${ev.length} señales públicas de analistas disponibles (${[...new Set(ev.flatMap(x=>x.analysts||[]))].join(', ')||'fuentes públicas'}).`});
    }
    return out;
  }
  function vendorFit(m,name){
    const p=vendorIntel(name); if(!p)return {score:10,reasons:['Seleccionado por el usuario']};
    let score=20; const reasons=[]; const focus=m.roleData?.vendor;
    if(focus===name){score+=25;reasons.push('fabricante foco del rol');}
    const text=[m.objective,m.desiredOutcome,m.technologies,m.roleData?.useCase,m.roleData?.requirements,m.roleData?.current,m.roleData?.whitespace].filter(Boolean).join(' ').toLowerCase();
    const terms=[...(p.category||'').split(/[\s/,+()-]+/),...(p.buyingTriggers||[]).flatMap(x=>String(x).split(/\s+/))].map(x=>x.toLowerCase()).filter(x=>x.length>4);
    const hits=[...new Set(terms.filter(t=>text.includes(t)))].slice(0,5); if(hits.length){score+=Math.min(20,hits.length*4);reasons.push('encaje con objetivo/tecnología');}
    if(m.vertical&&m.vertical!=='Otros'&&vendorVerticalAngle(name,m.vertical).length){score+=15;reasons.push(`encaje ${m.vertical}`);}
    if(m.primaryRole==='psm'){
      const r=(m.roleData.business||[]).find(x=>x.vendor===name); if(r?.fy27){score+=8;reasons.push('negocio FY27 existente');} if(r?.pipeline){score+=12;reasons.push('pipeline declarado');}
    }
    if(analystEvidenceFor(name).length){score+=5;reasons.push('evidencia pública reciente');}
    return {score:Math.min(100,score),reasons:reasons.length?reasons:['selección explícita del usuario']};
  }
  function prioritizedVendorNames(m){
    return selectedVendorNames(m).map((name,i)=>({name,i,...vendorFit(m,name)})).sort((a,b)=>b.score-a.score||a.i-b.i).map(x=>x.name);
  }
  function recommendedSlides(m){
    const slides=[];const add=(title,purpose,tag='Generada')=>slides.push({title,purpose,tag});
    add(`${m.partner||'Partner'} · objetivo y agenda`,m.objective||'Enmarcar la conversación y el resultado esperado','Generada');
    if(m.includeGeneral){add('Westcon Comstor','Credenciales y especialización relevantes para la conversación','Corporativa');add('Portfolio y capacidades','Solo las áreas que ayudan a desarrollar esta reunión','Corporativa');}
    if(m.primaryRole==='psm'){if((m.roleData.business||[]).length)add('Evolución de negocio conjunto','Facturación, evolución, mix y objetivos introducidos por el PSM','Generada');if((m.roleData.opportunities||[]).length)add('Oportunidades en curso','Pipeline compartido, estado y próximos hitos','Generada');add('Áreas de crecimiento conjunto','Capacidades, fabricantes, servicios y verticales con mayor encaje','Generada');}
    if(m.primaryRole==='vsm'){const v=m.roleData.vendor||m.vendors[0]||'fabricante';if(m.roleData.revenue||m.roleData.target||m.roleData.tier)add(`Evolución de la relación con ${v}`,'Negocio, nivel de relación y objetivos compartidos','Generada');if(m.roleData.certs||m.roleData.certsNext)add('Desarrollo de capacidades','Certificaciones y readiness para ampliar negocio','Generada');if(m.roleData.incentives||m.roleData.channelPlan)add('Palancas de crecimiento','Programa de canal, enablement, campañas e incentivos aplicables','Generada');}
    if(m.primaryRole==='sa'){const v=m.roleData.vendor||m.vendors[0]||'solución';add('Necesidad y criterios de diseño',m.roleData.useCase||m.objective||'Caso de uso y criterios que debe cumplir la solución','Generada');add(`Por qué ${v}`,'Arquitectura, capacidades diferenciales y criterios de éxito','Generada');if(m.roleData.poc||m.outputs.depth!=='short')add('Prueba de valor','Qué debemos validar y cómo medirlo','Generada');}
    if(m.primaryRole!=='sa'&&(m.supportRoles||[]).includes('sa'))add('Encaje técnico y prueba de valor','Arquitectura de referencia y criterios técnicos para el fabricante prioritario','Generada');
    if(m.vertical)add(`${m.vertical} · casos de uso relevantes`,'Aplicaciones del portfolio seleccionadas para este vertical','Generada');
    for(const v of prioritizedVendorNames(m).slice(0,m.outputs.depth==='deep'?6:4)){const p=vendorIntel(v);add(`Por qué ${v}`,p?.tagline||'Propuesta de valor y encaje para esta conversación','Generada');if(m.outputs.depth!=='short')add(`${v} · diferenciación`,'Capacidades diferenciales, criterios de decisión y cómo demostrar valor','Generada');if(analystEvidenceFor(v).length)add(`${v} · evidencia de analistas`,'Posicionamiento público sustentado por fuentes fechadas','Enriquecida');if(marketEvidenceFor(v).some(x=>!analystEvidenceFor(v).some(a=>a.url===x.url)))add(`${v} · mercado y referencias`,'Noticias, casos públicos y señales recientes con fuente y fecha','Enriquecida');add(`${v} · contenido corporativo FY27`,'Ficha corporativa existente cuando aporte valor','Corporativa');}
    if(m.includeServices)add('Cómo puede ayudar Westcon','Preventa, PoC, enablement, demanda, servicios, FLEX y lifecycle según el caso','Corporativa');add('Próximos pasos','Acciones concretas, responsables y fecha objetivo','Generada');const target=m.outputs.depth==='short'?10:m.outputs.depth==='deep'?26:16;return slides.slice(0,target);
  }
  function questionsFor(m){
    const q=[];
    if(m.primaryRole==='psm') q.push('¿Qué fabricantes queréis hacer crecer de verdad este FY y cuáles están perdiendo prioridad?','¿Dónde se está quedando pipeline parado y qué ayuda concreta necesitáis de Westcon?','¿Qué capacidad o certificación os impide abordar hoy oportunidades que sí veis en el mercado?','¿Qué tres acciones deberían estar cerradas antes de nuestra próxima revisión?');
    if(m.primaryRole==='vsm') q.push('¿Qué tendría que ocurrir para que este fabricante pase a ser estratégico para vosotros?','¿Qué certificación o requisito del programa de canal está frenando el siguiente nivel?','¿Qué incentivos o MDF tendrían impacto real en pipeline y no solo actividad?','¿Qué cuentas o verticales justifican un plan conjunto de 90 días?');
    if(m.primaryRole==='sa') q.push('¿Qué requisito técnico es realmente no negociable en esta arquitectura?','¿Qué tecnología actual queréis conservar y cuál estaríais dispuestos a sustituir?','¿Contra qué alternativa debemos demostrar valor para que el PoC sea concluyente?','¿Qué KPI técnico u operativo haría que el diseño fuese aprobado?');
    return q;
  }
  function genericInsights(m){
    const out=[]; if(m.vendors.length===0)out.push({type:'warn',text:'No hay fabricante seleccionado: la IA deberá partir de tecnología/objetivo y proponer los vendors más relevantes.'});
    if(m.vendors.length>6)out.push({type:'warn',text:`Hay ${m.vendors.length} fabricantes seleccionados. Conviene priorizar 3–6 para evitar una reunión de catálogo.`});
    if(m.primaryRole==='vsm'&&m.roleData.target&&m.roleData.revenue){const att=m.roleData.revenue/m.roleData.target*100;out.push({type:att>=60?'good':'warn',text:`Avance declarado hacia objetivo FY: ${att.toFixed(0)}%. Usar la reunión para explicar la distancia y acordar palancas concretas.`});}
    if(m.primaryRole==='sa'&&!m.roleData.competitors)out.push({type:'good',text:'Las alternativas y trade-offs se investigarán automáticamente; solo hace falta indicarlos si ya conoces algún condicionante concreto.'});
    if(m.knownSources)out.push({type:'good',text:'Hay fuentes conocidas aportadas por el usuario: deben tener prioridad sobre inferencias genéricas.'});
    return out;
  }

  async function buildBlueprint(){
    const m=gatherMeeting(),score=computeCompleteness(m);if(!m.partner||!m.objective||!m.primaryRole){alert('Completa partner, objetivo y perfil.');return;}state.currentId=m.id;const btn=$('#buildBlueprintBtn'),old=btn.textContent;btn.disabled=true;btn.textContent='Investigando partner y fabricantes…';$('#readySubtitle').textContent='Consultando señales públicas, analistas, noticias y contexto de mercado. Si una fuente falla, el motor continúa con las demás.';try{await runtimeDeepResearch(m);}catch(e){console.warn('runtime research fallback',e);}finally{btn.disabled=false;btn.textContent=old;}
    const slides=recommendedSlides(m),insights=[...derivedBusinessInsights(m),...genericInsights(m),...vendorSalesInsights(m)],queries=researchQueries(m),questions=questionsFor(m),partnerEv=partnerEvidenceFor(),vendorEv=prioritizedVendorNames(m).flatMap(v=>analystEvidenceFor(v).map(e=>({...e,vendor:v}))).slice(0,8);const host=$('#blueprint');host.classList.remove('hidden');host.innerHTML=`<div class="blueprint-head"><div><span class="eyebrow">PRESENTACIÓN PREPARADA</span><h2>${esc(m.partner)}</h2><p>${esc(m.objective)}</p></div><div class="score-badge">Contexto ${score}%</div></div><div class="kpi-strip">${blueprintKpis(m).map(x=>`<div class="kpi"><span>${esc(x.label)}</span><strong>${esc(x.value)}</strong></div>`).join('')}</div><div class="blueprint-grid"><div class="card"><h3>Narrativa final propuesta</h3><div class="slide-list">${slides.map((s,i)=>`<div class="slide-item"><div class="slide-num">${i+1}</div><div><strong>${esc(s.title)}</strong><p>${esc(s.purpose)}</p></div><span class="slide-tag">${esc(s.tag)}</span></div>`).join('')}</div></div><div><div class="card"><h3>Inteligencia utilizada</h3><ul class="insight-list">${(insights.length?insights:[{type:'good',text:'El motor ha preparado la narrativa con el corpus FY27 y la evidencia pública disponible.'}]).slice(0,7).map(x=>`<li class="${x.type||''}">${esc(x.text)}</li>`).join('')}</ul></div><div class="card" style="margin-top:16px"><h3>Señales públicas recientes</h3><ul class="research-list">${[...partnerEv.slice(0,3),...vendorEv.slice(0,4)].map(e=>`<li>${e.vendor?'<strong>'+esc(e.vendor)+'</strong> · ':''}${esc(e.title)}<br><small>${esc(e.publisher||evidenceDomain(e))}${e.publishedAt?' · '+esc(String(e.publishedAt).slice(0,10)):''}</small></li>`).join('')||'<li>Sin señal pública de suficiente confianza en esta ejecución. La presentación seguirá usando el corpus corporativo y la inteligencia cacheada.</li>'}</ul></div><div class="card" style="margin-top:16px"><h3>Preguntas para el presentador</h3><ul class="question-list">${questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul></div></div></div><div class="card" style="margin-top:16px"><h3>Generar</h3><div class="callout magenta"><strong>La presentación es partner-facing:</strong> no muestra scoring interno, “cómo vender”, research pendiente ni hipótesis de trabajo. Esos elementos solo se usan para decidir qué contar y quedan, cuando aportan valor, en briefing/notas.</div><div class="output-bar"><button class="primary" id="downloadPptxBtn">Descargar PowerPoint</button><button class="secondary" id="downloadBriefBtn">Descargar briefing interno</button><button class="secondary" id="printBtn">Imprimir / PDF</button><button class="ghost" id="saveBlueprintBtn">Guardar reunión</button></div></div>`;$('#downloadPptxBtn').addEventListener('click',()=>generatePptx(m,slides,insights,questions,queries));$('#downloadBriefBtn').addEventListener('click',()=>downloadBriefing(m,slides,insights,questions,queries));$('#printBtn').addEventListener('click',()=>window.print());$('#saveBlueprintBtn').addEventListener('click',saveMeeting);host.scrollIntoView({behavior:'smooth',block:'start'});$('#readySubtitle').textContent=`Investigación completada · ${partnerEv.length} señales del partner · ${vendorEv.length} señales de fabricantes/analistas.`;
  }
  function blueprintKpis(m){
    const x=[{label:'Perfil',value:roleById(m.primaryRole)?.name||'—'},{label:'Fabricantes',value:String(m.vendors.length||1)},{label:'Duración',value:m.duration||'—'},{label:'Inteligencia',value:intelligenceFreshness().replace('Actualizado ','')}];
    if(m.primaryRole==='psm'){const b=m.roleData.business||[];x[1]={label:'Negocio FY27',value:fmtMoney(b.reduce((a,r)=>a+r.fy27,0))};x[2]={label:'Pipeline',value:fmtMoney(b.reduce((a,r)=>a+r.pipeline,0)+(m.roleData.opportunities||[]).reduce((a,r)=>a+r.amount,0))};}
    if(m.primaryRole==='vsm'){x[1]={label:'Vendor foco',value:m.roleData.vendor||m.vendors[0]||'—'};x[2]={label:'FY27 YTD',value:fmtMoney(m.roleData.revenue)};}
    if(m.primaryRole==='sa'){x[1]={label:'Vendor foco',value:m.roleData.vendor||m.vendors[0]||'—'};x[2]={label:'Caso de uso',value:(m.roleData.useCase||'Por definir').slice(0,22)};}
    return x;
  }

  // ---------- Persistence ----------
  function loadSaved(){try{return JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{return[]}}
  function saveMeeting(){const m=gatherMeeting();if(!m.partner){alert('Añade el nombre del partner antes de guardar.');return;}state.currentId=m.id;const all=loadSaved();const idx=all.findIndex(x=>x.id===m.id);if(idx>=0)all[idx]=m;else all.unshift(m);localStorage.setItem(storageKey,JSON.stringify(all.slice(0,100)));renderSaved();alert('Reunión guardada en este navegador.');}
  function renderSaved(){const all=loadSaved();$('#savedCount').textContent=all.length;const h=$('#savedMeetings');if(!all.length){h.innerHTML='<div class="card empty">Todavía no hay reuniones guardadas en este navegador.</div>';return;}h.innerHTML=all.map(m=>`<div class="card saved-item"><div class="saved-meta"><strong>${esc(m.partner)} · ${esc(roleById(m.primaryRole)?.name||m.primaryRole||'')}</strong><span>${esc(m.objective||'Sin objetivo')} · ${new Date(m.updatedAt).toLocaleString('es-ES')}</span></div><div class="saved-actions"><button class="secondary load-meeting" data-id="${m.id}">Abrir</button><button class="ghost export-meeting" data-id="${m.id}">JSON</button><button class="icon-btn delete-meeting" data-id="${m.id}">×</button></div></div>`).join('');
    $$('.load-meeting',h).forEach(b=>b.onclick=()=>loadMeeting(all.find(x=>x.id===b.dataset.id)));$$('.export-meeting',h).forEach(b=>b.onclick=()=>downloadJson(all.find(x=>x.id===b.dataset.id)));$$('.delete-meeting',h).forEach(b=>b.onclick=()=>{const next=loadSaved().filter(x=>x.id!==b.dataset.id);localStorage.setItem(storageKey,JSON.stringify(next));renderSaved();});}
  function loadMeeting(m){
    if(m?.primaryRole==='commercial'){m={...m,primaryRole:'psm',supportRoles:(m.supportRoles||[]).filter(r=>r!=='commercial'),roleData:{context:m.roleData?.messages||'',whitespace:m.roleData?.whitespace||'',business:[],opportunities:m.roleData?.opportunities||[],actions:m.roleData?.campaigns||''}};}if(!m)return;newMeeting(false);state.currentId=m.id;setVal('partnerName',m.partner);setVal('country',m.country);setVal('meetingType',m.meetingType);setVal('duration',m.duration);setVal('objective',m.objective);setVal('desiredOutcome',m.desiredOutcome);selectPrimaryRole(m.primaryRole);state.supportRoles=new Set(m.supportRoles||[]);$$('#supportRoles input').forEach(i=>{i.checked=state.supportRoles.has(i.value);i.closest('.chip').classList.toggle('active',i.checked)});$$('#vendorGrid input').forEach(i=>{i.checked=(m.vendors||[]).includes(i.value);i.closest('.vendor-option').classList.toggle('selected',i.checked)});setVal('vertical',m.vertical);setVal('technologies',m.technologies);$('#includeGeneral').checked=m.includeGeneral!==false;$('#reserveVendorSlides').checked=!!m.reserveVendorSlides;$('#includeServices').checked=m.includeServices!==false;$$('#serviceChips input').forEach(i=>{i.checked=(m.services||[]).includes(i.value);i.closest('.chip').classList.toggle('active',i.checked)});renderResearch();$$('#researchGrid input').forEach(i=>{i.checked=(m.research||[]).includes(i.value);i.closest('.research-item').classList.toggle('checked',i.checked)});setVal('researchHorizon',m.researchHorizon);setVal('knownSources',m.knownSources);restoreRoleData(m);setVal('deckDepth',m.outputs?.depth);setVal('language',m.outputs?.language);setVal('tone',m.outputs?.tone);['pptx','brief','notes','questions','pdf','sources'].forEach(k=>{const e=$('#out'+k[0].toUpperCase()+k.slice(1));if(e)e.checked=m.outputs?.[k]!==false});showPanel('builder');updateProgress();}
  function restoreRoleData(m){const d=m.roleData||{};if(m.primaryRole==='psm'){setVal('psmRelationship',d.relationship);setVal('psmTarget',d.target);setVal('psmPotential',d.potential);setVal('psmContext',d.context);$('#businessRows').innerHTML='';(d.business?.length?d.business:[{}]).forEach(addBusinessRow);$('#opportunityRows').innerHTML='';(d.opportunities?.length?d.opportunities:[{}]).forEach(addOpportunityRow);setVal('psmWhitespace',d.whitespace);setVal('psmActions',d.actions);}if(m.primaryRole==='vsm'){['vendor','tier','targetTier','revenue','target','relationship','certs','certsNext','channelPlan','incentives','blockers'].forEach(k=>setVal('vsm'+k[0].toUpperCase()+k.slice(1),d[k]));$('#opportunityRows').innerHTML='';(d.opportunities?.length?d.opportunities:[{}]).forEach(addOpportunityRow);}if(m.primaryRole==='sa'){['vendor','useCase','current','requirements','competitors','differentiators','analysts','poc','risks'].forEach(k=>setVal('sa'+k[0].toUpperCase()+k.slice(1),d[k]));}}

  function newMeeting(confirmReset=true){if(confirmReset&&getVal('partnerName')&&!confirm('¿Crear una reunión nueva? Se limpiará el formulario no guardado.'))return;state.primaryRole=null;state.supportRoles=new Set();state.currentId=null;$('#meetingForm').reset();$$('.role-card').forEach(x=>x.classList.remove('selected'));$$('#supportRoles input').forEach(x=>{x.checked=false;x.disabled=false;x.closest('.chip').classList.remove('active')});$$('#vendorGrid input').forEach(x=>{x.checked=false;x.closest('.vendor-option').classList.remove('selected')});$$('#serviceChips input').forEach(x=>{x.checked=false;x.closest('.chip').classList.remove('active')});$('#activeRoleBadge').textContent='Sin seleccionar';$('#roleFields').className='role-fields empty-state';$('#roleFields').innerHTML='<p>Selecciona PSM, VSM o Solution Architect para adaptar esta sección.</p>';$('#blueprint').classList.add('hidden');renderResearch();updateProgress();showPanel('builder');}

  function downloadJson(obj=gatherMeeting()){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});downloadBlob(blob,`${slug(obj.partner)}-${obj.primaryRole||'meeting'}.json`)}
  function downloadBlob(blob,filename){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},400);}
  function importJson(file){const r=new FileReader();r.onload=()=>{try{loadMeeting(JSON.parse(r.result))}catch{alert('El archivo no contiene una reunión válida.')}};r.readAsText(file);}

  // ---------- Briefing ----------
  function downloadBriefing(m,slides=recommendedSlides(m),insights=[...derivedBusinessInsights(m),...genericInsights(m),...vendorSalesInsights(m)],questions=questionsFor(m),queries=researchQueries(m)){
    const html=`<!doctype html><html lang="es"><meta charset="utf-8"><title>Briefing ${esc(m.partner)}</title><style>body{font-family:Arial,sans-serif;max-width:980px;margin:40px auto;color:#173142;line-height:1.45;padding:0 24px}h1{font-size:34px}h2{margin-top:30px;color:#082a3a}.meta{padding:15px;background:#eef7f8;border-left:5px solid #08a7b5}.slide{padding:10px 0;border-bottom:1px solid #ddd}.tag{font-size:10px;background:#eee;border-radius:99px;padding:3px 7px}.q{padding:10px;background:#f7f9fa;margin:7px 0}.src{font-size:12px;color:#647984}</style><body><h1>${esc(m.partner)} · ${esc(roleById(m.primaryRole)?.name||'')}</h1><div class="meta"><strong>Objetivo:</strong> ${esc(m.objective)}<br><strong>Resultado buscado:</strong> ${esc(m.desiredOutcome||'—')}<br><strong>Fabricantes:</strong> ${esc(m.vendors.join(', ')||'Por definir')}<br><strong>Vertical:</strong> ${esc(m.vertical||'—')}</div><h2>Lecturas previas</h2>${insights.map(x=>`<p>• ${esc(x.text)}</p>`).join('')}<h2>Narrativa</h2>${slides.map((s,i)=>`<div class="slide"><strong>${i+1}. ${esc(s.title)}</strong> <span class="tag">${esc(s.tag)}</span><br>${esc(s.purpose)}</div>`).join('')}<h2>Preguntas</h2>${questions.map(q=>`<div class="q">${esc(q)}</div>`).join('')}<h2>Consultas y líneas de investigación</h2>${queries.map(q=>`<p class="src">${esc(q)}</p>`).join('')}<h2>Datos estructurados</h2><pre>${esc(JSON.stringify(m.roleData,null,2))}</pre></body></html>`;
    downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),`${slug(m.partner)}-briefing.html`);
  }

  // ---------- PowerPoint ----------
  // v1.0: el PPTX reutiliza visualmente las slides corporativas/datasheets originales
  // y genera las slides variables con la misma gramática visual Westcon FY27.
  const _assetCache=new Map();
  async function assetData(url){
    if(_assetCache.has(url)) return _assetCache.get(url);
    const p=fetch(url).then(r=>{if(!r.ok)throw new Error(`No se pudo cargar ${url}`);return r.blob()}).then(blob=>new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(blob);}));
    _assetCache.set(url,p);return p;
  }
  const sourceAsset=(kind,n)=>`assets/source-slides/${kind}/slide-${String(n).padStart(2,'0')}.png`;
  const vendorSourceSlides={
    'Anomali':[8],'AttackIQ':[9],'Certes Networks':[10],'Cisco':[11,41],'Claroty':[12],'CrowdStrike':[13],'F5':[14],
    'FireMon':[15],'Fortanix':[16],'Ivanti':[17],'LevelBlue':[18],'Menlo Security':[19],'NETSCOUT':[20],
    'Noname / Akamai API Security':[21],'Okta':[22],'Palo Alto Networks':[23],'Ping Identity':[24],'Proofpoint':[25],
    'Vectra AI':[26],'XM Cyber':[27],'Zscaler':[28],'1Password':[29],'Ciena':[40],'EfficientIP':[42],'Ericsson':[43],
    'Extreme Networks':[44],'Juniper Networks':[45],'Nokia':[46],'Ruckus Networks':[47],'Weblib':[48],
    'AudioCodes':[59],'Avaya':[60],'AWS':[61],'Microsoft':[62],'Penguin Solutions':[63],'UiPath':[64]
  };
  const verticalSourceMap={
    'Banca y seguros':{cyber:{playbook:30,message:31,datasheet:1},network:{playbook:49,message:50,datasheet:5},cloud:{playbook:65,message:66,datasheet:9}},
    'Administración pública':{cyber:{playbook:32,message:33,datasheet:2},network:{playbook:51,message:52,datasheet:6},cloud:{playbook:67,message:68,datasheet:10}},
    'Industria y utilities':{cyber:{playbook:34,message:35,datasheet:3},network:{playbook:53,message:54,datasheet:7},cloud:{playbook:69,message:70,datasheet:11}},
    'Retail':{cyber:{playbook:36,message:37,datasheet:4},network:{playbook:55,message:56,datasheet:8},cloud:{playbook:71,message:72,datasheet:12}}
  };
  function inferredVendors(m,limit=4){
    const text=[m.objective,m.desiredOutcome,m.technologies,m.vertical,...((m.roleData?.business||[]).map(x=>x.vendor))].filter(Boolean).join(' ').toLowerCase();
    if(!text)return [];
    return (K.vendors||[]).map((v,i)=>{const terms=[v.name,v.area,...(v.tags||[])].flatMap(x=>String(x).toLowerCase().split(/[\s/,+()_-]+/)).filter(x=>x.length>3);const hits=[...new Set(terms.filter(t=>text.includes(t)))];return {name:v.name,score:hits.length,i};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,limit).map(x=>x.name);
  }
  function selectedVendorNames(m){
    const out=[...(m.vendors||[])];
    const focus=m.roleData?.vendor;
    if(focus&&!out.includes(focus))out.unshift(focus);
    if(m.primaryRole==='psm')for(const r of (m.roleData?.business||[])){if(r.vendor&&!out.includes(r.vendor))out.push(r.vendor);}
    const dedup=[...new Set(out.filter(Boolean))];
    return dedup.length?dedup:inferredVendors(m);
  }
  function vendorAreasForMeeting(m){
    const a=new Set();
    selectedVendorNames(m).forEach(name=>{
      const v=(K.vendors||[]).find(x=>x.name===name);const area=(v?.area||'').toLowerCase();
      if(area.includes('ciber'))a.add('cyber');if(area.includes('network'))a.add('network');if(area.includes('cloud')||area.includes('automat'))a.add('cloud');
    });
    const t=(m.technologies||'').toLowerCase();
    if(/security|ciber|zero trust|sase|xdr|iam|soc|api|ot|siem|edr|firewall/.test(t))a.add('cyber');
    if(/network|wifi|wi-fi|switch|routing|wan|5g|dns|ddi|ipam|optical|campus/.test(t))a.add('network');
    if(/cloud|azure|aws|automat|rpa|uc|contact center|collaboration|edge|ia|ai/.test(t))a.add('cloud');
    if(!a.size&&m.vertical&&m.vertical!=='Otros') ['cyber','network','cloud'].forEach(x=>a.add(x));
    return [...a];
  }
  function serviceSourceSlides(m){
    const chosen=m.services||[];const out=[];const has=q=>chosen.some(s=>s.toLowerCase().includes(q));
    if(has('preventa')||has('rfi')||has('poc'))out.push(73);
    if(has('demo')||has('3d'))out.push(74);
    if(has('skill')||has('academy')||has('lms'))out.push(75);
    if(has('benchmark'))out.push(76);
    if(has('lifecycle')||has('customer success')||has('renov'))out.push(77);
    if(has('gds')||has('staging')||has('soporte'))out.push(78,79);
    if(has('flex'))out.push(80);
    if(has('intelligent demand')||has('campaña')||has('webinar'))out.push(81);
    if(!out.length&&m.includeServices){
      if(m.primaryRole==='psm')out.push(78,81,80);
      else if(m.primaryRole==='vsm')out.push(75,81,78);
      else out.push(73,74,76);
      if((m.supportRoles||[]).includes('sa'))out.push(73,74);
      if((m.supportRoles||[]).includes('vsm'))out.push(75,81);
    }
    return [...new Set(out)];
  }

  async function generatePptx(m,slides,insights,questions,queries){
    if(typeof window.PptxGenJS==='undefined'){alert('No se ha podido cargar el generador PowerPoint.');return;}
    const pptx=new window.PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Westcon Meeting Intelligence';pptx.subject=`Reunión con ${m.partner}`;pptx.title=`${m.partner} · ${roleById(m.primaryRole)?.name||''}`;pptx.company='Westcon Comstor';pptx.lang='es-ES';
    const C={navy:'1A2E44',navy2:'113A50',navy3:'082335',magenta:'E5007D',cyan:'12C7C0',amber:'FFAE00',purple:'6C5CA3',white:'FFFFFF',muted:'AEBECA',line:'24506A',green:'169F82',soft:'DDE6EB'};
    const roleAccent=m.primaryRole==='sa'?C.cyan:m.primaryRole==='vsm'?C.purple:C.magenta;
    let logoData=null;try{logoData=await assetData('assets/westcon-comstor.png')}catch{}
    const addFooter=(s,accent=roleAccent)=>{s.addShape(pptx.ShapeType.rect,{x:0,y:7.36,w:13.333,h:.14,fill:{color:accent},line:{color:accent}});s.addText('FY2027 — Westcon Comstor España',{x:.45,y:7.12,w:4.2,h:.16,fontFace:'Corbel',fontSize:7.5,color:C.muted,margin:0});s.addText(m.partner||'Partner',{x:8.0,y:7.12,w:4.85,h:.16,fontFace:'Corbel',fontSize:7.5,color:C.muted,align:'right',margin:0,fit:'shrink'});};
    const addBrand=(s,section,title,subtitle='',accent=roleAccent)=>{s.background={color:C.navy};if(logoData){s.addShape(pptx.ShapeType.roundRect,{x:10.92,y:.22,w:1.9,h:.55,rectRadius:.05,fill:{color:C.white},line:{color:C.white}});s.addImage({data:logoData,x:11.08,y:.365,w:1.55,h:.255});}s.addText(String(section||'WESTCON COMSTOR').toUpperCase(),{x:.48,y:.27,w:5.2,h:.23,fontFace:'Corbel',fontSize:10,bold:true,color:accent,charSpacing:1.2,margin:0});s.addText(title,{x:.48,y:.68,w:10.0,h:.62,fontFace:'Corbel',fontSize:27,bold:true,color:C.white,margin:0,fit:'shrink'});if(subtitle)s.addText(subtitle,{x:.5,y:1.36,w:11.8,h:.42,fontFace:'Corbel',fontSize:12,color:C.muted,margin:0,fit:'shrink'});addFooter(s,accent);};
    const addCard=(s,x,y,w,h,title,text,accent=roleAccent)=>{s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:.06,fill:{color:C.navy2,transparency:3},line:{color:accent,pt:1.1}});if(title)s.addText(title.toUpperCase(),{x:x+.18,y:y+.14,w:w-.36,h:.24,fontFace:'Corbel',fontSize:10,bold:true,color:accent,margin:0,fit:'shrink'});if(text)s.addText(String(text),{x:x+.18,y:y+(title?0.52:0.2),w:w-.36,h:h-(title?0.66:0.36),fontFace:'Corbel',fontSize:13,color:C.white,margin:.01,fit:'shrink',valign:'mid'});};
    const addKpi=(s,x,y,w,label,value,accent=roleAccent)=>{s.addShape(pptx.ShapeType.roundRect,{x,y,w,h:1.02,rectRadius:.05,fill:{color:C.navy2},line:{color:accent,pt:1}});s.addText(String(value||'—'),{x:x+.1,y:y+.16,w:w-.2,h:.37,fontFace:'Corbel',fontSize:19,bold:true,color:C.white,align:'center',margin:0,fit:'shrink'});s.addText(label,{x:x+.1,y:y+.62,w:w-.2,h:.2,fontFace:'Corbel',fontSize:8.5,color:C.muted,align:'center',margin:0,fit:'shrink'});};
    const addBullets=(s,items,x=.65,y=2.05,w=12,h=4.7,fs=15)=>{const runs=[];items.filter(Boolean).forEach(t=>runs.push({text:String(t),options:{bullet:{indent:14},breakLine:true}}));s.addText(runs,{x,y,w,h,fontFace:'Corbel',fontSize:fs,color:C.white,margin:.02,paraSpaceAfterPt:9,fit:'shrink'});};
    const addOriginal=async(kind,n,notes='')=>{const s=pptx.addSlide();try{s.addImage({data:await assetData(sourceAsset(kind,n)),x:0,y:0,w:13.333,h:7.5});}catch(e){addBrand(s,'CONTENIDO CORPORATIVO',`Slide ${n} no disponible`,String(e.message||e));}if(notes&&m.outputs.notes)try{s.addNotes(notes)}catch{}return s;};
    const addPlaceholder=(vendor)=>{const s=pptx.addSlide();addBrand(s,'FABRICANTE',`Slides oficiales de ${vendor}`,'Espacio reservado para incorporar contenido oficial específico de esta reunión.',C.purple);s.addShape(pptx.ShapeType.roundRect,{x:1.05,y:2.35,w:11.2,h:2.5,rectRadius:.08,fill:{color:C.navy2},line:{color:C.purple,pt:1.3,dash:'dash'}});s.addText('INSERTAR AQUÍ SLIDES OFICIALES DEL FABRICANTE',{x:1.4,y:3.2,w:10.5,h:.45,fontFace:'Corbel',fontSize:20,bold:true,color:C.muted,align:'center',margin:0});return s;};
    const addSourceLine=(s,text)=>s.addText(text,{x:.62,y:6.82,w:12.05,h:.2,fontFace:'Corbel',fontSize:7.2,color:C.muted,margin:0,fit:'shrink'});
    const addVendorSalesSlide=(name)=>{
      const p=vendorIntel(name);if(!p)return null;const sl=pptx.addSlide();addBrand(sl,`SOLUCIÓN · ${name}`,`Por qué ${name}`,p.tagline||p.category,C.magenta);addCard(sl,.55,1.92,5.95,1.52,'PROPUESTA DE VALOR',p.valueProposition||'Propuesta de valor por completar.',C.magenta);addCard(sl,6.82,1.92,5.95,1.52,'DÓNDE APORTA MÁS',(p.buyingTriggers||[]).slice(0,4).map(x=>'• '+x).join('\n')||'Casos de uso a priorizar según el contexto del partner.',C.cyan);const adv=(p.approvedAdvantages||[]).slice(0,4);adv.forEach((x,i)=>{const col=i%2,row=Math.floor(i/2),xx=.55+col*6.27,yy=3.78+row*1.2;addCard(sl,xx,yy,5.95,1.0,`DIFERENCIAL ${i+1}`,x,i%2?C.amber:C.green);});addSourceLine(sl,`Westcon Comstor España FY2027 · ${p.category||''}`);if(m.outputs.notes)try{sl.addNotes(`Contexto interno. Señales de oportunidad: ${(p.buyingTriggers||[]).join('; ')}. Alternativas a considerar internamente: ${(p.competitors||[]).join('; ')}.`)}catch{}return sl;
    };
    const addVendorCompetitiveSlide=(name)=>{
      const p=vendorIntel(name);if(!p)return null;const sl=pptx.addSlide();addBrand(sl,`DIFERENCIACIÓN · ${name}`,'Qué hace diferente esta propuesta','Capacidades y criterios que conviene validar en el contexto real del partner.',C.purple);addCard(sl,.55,1.95,3.85,3.95,'CAPACIDADES DIFERENCIALES',(p.approvedAdvantages||[]).slice(0,5).map(x=>'• '+x).join('\n'),C.magenta);addCard(sl,4.72,1.95,3.85,3.95,'CRITERIOS DE DECISIÓN',(p.buyingTriggers||[]).slice(0,5).map(x=>'• '+x).join('\n'),C.cyan);addCard(sl,8.89,1.95,3.85,3.95,'CÓMO DEMOSTRARLO',['PoC/PoV con KPI del caso de uso','Integración con el stack actual','Operación, automatización y lifecycle','Escalabilidad y coste total','Referencias y evidencia pública aplicables'].map(x=>'• '+x).join('\n'),C.amber);addSourceLine(sl,'Westcon Comstor FY2027 · criterios adaptados al contexto de la reunión.');if(m.outputs.notes)try{sl.addNotes(`Alternativas/competidores para preparar la conversación, no mostrados por defecto: ${(p.competitors||[]).join('; ')}.`)}catch{}return sl;
    };
    const addVendorAnalystSlide=(name)=>{
      const p=vendorIntel(name);if(!p)return null;const evidence=analystEvidenceFor(name).slice(0,4);if(!evidence.length)return null;
      const sl=pptx.addSlide();addBrand(sl,`ANALISTAS · ${name}`,'Validación externa y posicionamiento público','Solo evidencia pública, fechada y atribuible; no se infieren posiciones que la fuente no declare.',C.cyan);
      evidence.forEach((e,i)=>{const col=i%2,row=Math.floor(i/2),xx=.55+col*6.25,yy=1.95+row*2.08,label=(e.analysts||[]).join(' / ')||'Analista',date=e.publishedAt?String(e.publishedAt).slice(0,10):'fecha pública no disponible';addCard(sl,xx,yy,5.95,1.75,`${label} · ${date}`,`${e.title}\n${e.publisher||evidenceDomain(e)}`,i%2?C.purple:C.cyan);});
      addSourceLine(sl,'Fuentes públicas · URLs completas y contexto adicional en notas del presentador.');
      if(m.outputs.notes)try{sl.addNotes('Evidencias públicas para '+name+':\n'+evidence.map(e=>`- ${e.title} | ${e.publisher||evidenceDomain(e)} | ${e.publishedAt||''} | ${e.url}`).join('\n'))}catch{}
      return sl;
    };
    const addVendorMomentumSlide=(name)=>{
      const p=vendorIntel(name);if(!p)return null;
      const analystUrls=new Set(analystEvidenceFor(name).map(x=>x.url));
      const evidence=marketEvidenceFor(name).filter(x=>!analystUrls.has(x.url)).slice(0,4);
      if(!evidence.length)return null;
      const sl=pptx.addSlide();addBrand(sl,`MERCADO · ${name}`,'Momentum, innovación y referencias públicas','Señales recientes que ayudan a contextualizar la propuesta más allá de la ficha de producto.',C.amber);
      evidence.forEach((e,i)=>{const col=i%2,row=Math.floor(i/2),xx=.55+col*6.25,yy=1.95+row*2.08,date=e.publishedAt?String(e.publishedAt).slice(0,10):'fecha no disponible',label=e.kind==='vendor-official'?'FUENTE OFICIAL':e.kind==='trusted-media'?'MEDIO ESPECIALIZADO':'SEÑAL DE MERCADO';addCard(sl,xx,yy,5.95,1.75,`${label} · ${date}`,`${e.title}\n${e.publisher||evidenceDomain(e)}`,i%2?C.purple:C.amber);});
      addSourceLine(sl,'Fuentes públicas · URLs completas en notas del presentador.');
      if(m.outputs.notes)try{sl.addNotes('Señales públicas para '+name+':\n'+evidence.map(e=>`- ${e.title} | ${e.publisher||evidenceDomain(e)} | ${e.publishedAt||''} | ${e.url}`).join('\n'))}catch{}
      return sl;
    };
    const addVerticalOpportunitySlide=(vertical,names)=>{
      if(!vertical||!names.length)return null; const sl=pptx.addSlide();
      addBrand(sl,'CASOS DE USO',`${vertical} · prioridades y oportunidades`,'Casos de uso seleccionados a partir del portfolio FY27 y el contexto de esta reunión.',C.amber);
      names.slice(0,4).forEach((name,i)=>{const col=i%2,row=Math.floor(i/2),xx=.55+col*6.25,yy=1.95+row*2.15;const p=vendorIntel(name);const angle=vendorVerticalAngle(name,vertical);addCard(sl,xx,yy,5.95,1.85,name,`${p?.category||''}\n${(angle.length?angle:(p?.buyingTriggers||[]).slice(0,3)).map(x=>'• '+x).join('\n')}`,i%2?C.cyan:C.magenta);});
      addSourceLine(sl,'Westcon Comstor FY2027 · playbooks y datasheets sectoriales.');
      return sl;
    };
    let s=pptx.addSlide();s.background={color:C.navy};
    let heroData=null;try{heroData=await assetData('assets/hero.jpeg')}catch{}
    if(heroData){s.addImage({data:heroData,x:7.15,y:0,w:6.183,h:6.88});s.addShape(pptx.ShapeType.rect,{x:7.15,y:0,w:6.183,h:6.88,fill:{color:C.navy3,transparency:32},line:{color:C.navy3,transparency:100}});}
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:5.6,h:1.08,fill:{color:'A72A80'},line:{color:'A72A80'}});
    if(logoData){s.addShape(pptx.ShapeType.roundRect,{x:.72,y:.16,w:3.82,h:.76,rectRadius:.08,fill:{color:C.white},line:{color:C.white}});s.addImage({data:logoData,x:1.05,y:.305,w:3.15,h:.52});}
    s.addText('WESTCON COMSTOR · FY2027',{x:.6,y:1.54,w:5.95,h:.25,fontFace:'Corbel',fontSize:10,bold:true,color:roleAccent,charSpacing:1.3,margin:0});
    s.addText((m.partner||'PARTNER').toUpperCase(),{x:.6,y:1.92,w:5.95,h:.7,fontFace:'Corbel',fontSize:31,bold:true,color:C.white,margin:0,fit:'shrink'});
    s.addText(m.objective||'Reunión de trabajo',{x:.62,y:2.82,w:5.75,h:.68,fontFace:'Corbel',fontSize:18,color:C.white,margin:0,fit:'shrink'});
    const vendorLine=prioritizedVendorNames(m).slice(0,4).join(' · ');
    if(vendorLine)s.addText(vendorLine,{x:.62,y:3.67,w:5.75,h:.31,fontFace:'Corbel',fontSize:11,bold:true,color:C.cyan,margin:0,fit:'shrink'});
    const coverContext=[m.vertical&&m.vertical!=='Otros'?m.vertical:'Reunión de trabajo',m.duration].filter(Boolean).join(' · ');
    s.addText(coverContext,{x:.62,y:4.22,w:5.75,h:.28,fontFace:'Corbel',fontSize:10.5,bold:true,color:C.amber,margin:0,fit:'shrink'});
    s.addText(new Date().toLocaleDateString('es-ES',{month:'long',year:'numeric'}).toUpperCase(),{x:.62,y:5.82,w:3.8,h:.3,fontFace:'Corbel',fontSize:13,bold:true,color:C.amber,margin:0});
    s.addShape(pptx.ShapeType.rect,{x:0,y:6.88,w:13.333,h:.62,fill:{color:'3599BC'},line:{color:'3599BC'}});
    if(m.outputs.notes)try{s.addNotes(`Objetivo: ${m.objective}\nResultado buscado: ${m.desiredOutcome||'por validar'}\nFabricantes: ${vendorLine||'por priorizar'}\nPreguntas sugeridas:\n- ${questions.join('\n- ')}`)}catch{}

    // Slides corporativas reales.
    if(m.includeGeneral){
      await addOriginal('corporate',2,'Quiénes somos — slide original FY27.');
      if(m.outputs.depth!=='short')await addOriginal('corporate',3,'Propuesta de valor — slide original FY27.');
      await addOriginal('corporate',5,'Portfolio de fabricantes — slide original FY27.');
      if(m.primaryRole==='psm'&&m.outputs.depth==='deep')await addOriginal('corporate',4,'Framework BLUEPRINT — slide original FY27.');
    }

    // Agenda partner-facing. La información interna solo orienta la selección y las notas.
    s=pptx.addSlide();addBrand(s,'AGENDA','Objetivo y foco de la sesión','Una conversación orientada a oportunidades concretas y próximos pasos.');
    addCard(s,.55,2.05,3.85,1.55,'OBJETIVO',m.objective||'Alinear prioridades y oportunidades',roleAccent);
    addCard(s,4.72,2.05,3.85,1.55,'ÁMBITO',m.vertical||m.technologies||'Tecnología, negocio y desarrollo conjunto',C.cyan);
    addCard(s,8.89,2.05,3.85,1.55,'FABRICANTES',selectedVendorNames(m).join(', ')||'Portfolio relevante',C.amber);
    addCard(s,.55,3.95,5.95,1.75,'TEMAS PRINCIPALES',m.primaryRole==='sa'?(m.roleData.useCase||'Arquitectura, criterios de diseño y prueba de valor'):m.primaryRole==='vsm'?'Desarrollo de capacidades, oportunidades y plan conjunto':'Evolución del negocio, oportunidades y plan conjunto',C.magenta);
    addCard(s,6.82,3.95,5.92,1.75,'SIGUIENTE PASO',m.desiredOutcome||'Acordar acciones concretas, responsables y fecha.',C.green);

    if(m.primaryRole==='psm'){
      const b=(m.roleData.business||[]).filter(r=>r.vendor);const opp=(m.roleData.opportunities||[]).filter(o=>o.name||o.vendor||o.amount);
      const total27=b.reduce((a,r)=>a+Number(r.fy27||0),0),totalTarget=b.reduce((a,r)=>a+Number(r.target||0),0),pipe=b.reduce((a,r)=>a+Number(r.pipeline||0),0)+opp.reduce((a,r)=>a+Number(r.amount||0),0);
      if(b.length){
        s=pptx.addSlide();addBrand(s,'EVOLUCIÓN CONJUNTA','Negocio por fabricante','Una lectura compartida para decidir dónde acelerar y dónde abrir nuevas oportunidades.');
        addKpi(s,.72,1.92,3.55,'FY27 YTD',fmtMoney(total27),C.magenta);addKpi(s,4.89,1.92,3.55,'Objetivo FY27',fmtMoney(totalTarget),C.cyan);addKpi(s,9.06,1.92,3.55,'Pipeline',fmtMoney(pipe),C.amber);
        const rows=b.slice(0,m.outputs.depth==='deep'?7:5);const max=Math.max(1,...rows.flatMap(r=>[Number(r.fy26||0),Number(r.fy27||0),Number(r.target||0),Number(r.pipeline||0)]));
        rows.forEach((r,i)=>{const y=3.25+i*.58;s.addText(r.vendor,{x:.72,y,w:2.15,h:.26,fontFace:'Corbel',fontSize:10.2,bold:true,color:C.white,margin:0,fit:'shrink'});[[r.fy26,C.purple,3.05,'FY26'],[r.fy27,C.magenta,5.25,'FY27'],[r.target,C.cyan,7.45,'OBJ'],[r.pipeline,C.amber,9.65,'PIPE']].forEach(([val,col,x,label])=>{const n=Number(val||0);s.addText(label,{x,y:y-.02,w:.55,h:.18,fontFace:'Corbel',fontSize:6.5,color:C.muted,margin:0});s.addShape(pptx.ShapeType.roundRect,{x:x+.53,y:y+.01,w:1.65,h:.2,rectRadius:.02,fill:{color:C.navy2},line:{color:C.line,pt:.4}});if(n>0)s.addShape(pptx.ShapeType.roundRect,{x:x+.53,y:y+.01,w:Math.max(.06,1.65*n/max),h:.2,rectRadius:.02,fill:{color:col},line:{color:col}});s.addText(fmtMoney(n),{x:x+.53,y:y+.26,w:1.65,h:.16,fontFace:'Corbel',fontSize:6.8,color:C.muted,align:'center',margin:0,fit:'shrink'});});});
      }
      if(opp.length)addOpportunitySlideBranded(pptx,m,C,addBrand,roleAccent);
      s=pptx.addSlide();addBrand(s,'CRECIMIENTO CONJUNTO','Oportunidades que merece la pena explorar','Priorizadas por encaje tecnológico, vertical, portfolio y contexto público del partner.');
      const psmNames=prioritizedVendorNames(m).slice(0,4);psmNames.forEach((name,i)=>{const p=vendorIntel(name),col=i%2,row=Math.floor(i/2),xx=.58+col*6.2,yy=1.95+row*2.08;addCard(s,xx,yy,5.9,1.78,name,`${p?.category||''}\n${(vendorVerticalAngle(name,m.vertical).length?vendorVerticalAngle(name,m.vertical):(p?.buyingTriggers||[])).slice(0,3).map(x=>'• '+x).join('\n')}`,i%2?C.cyan:C.magenta);});
      if(!psmNames.length)addCard(s,.72,2.1,11.8,2.4,'FOCO','Seleccionar un fabricante o una tecnología permitirá construir oportunidades concretas.',C.cyan);
      addSourceLine(s,'Westcon Comstor FY2027 · selección apoyada por información pública actualizada.');
    } else if(m.primaryRole==='vsm'){
      const v=m.roleData.vendor||selectedVendorNames(m)[0]||'Fabricante',hasCommercial=Number(m.roleData.revenue||0)||Number(m.roleData.target||0)||m.roleData.tier||m.roleData.targetTier;
      if(hasCommercial){s=pptx.addSlide();addBrand(s,`DESARROLLO CONJUNTO · ${v}`,'Evolución y objetivos','Una visión compartida para hacer crecer la relación con el fabricante.');addKpi(s,.8,2.0,2.7,'FY27 YTD',fmtMoney(m.roleData.revenue),C.magenta);addKpi(s,3.86,2.0,2.7,'Objetivo',fmtMoney(m.roleData.target),C.amber);addKpi(s,6.92,2.0,2.7,'Nivel actual',m.roleData.tier||'—',C.purple);addKpi(s,9.98,2.0,2.55,'Próximo nivel',m.roleData.targetTier||'—',C.cyan);addCard(s,.8,3.55,11.73,1.7,'PLAN CONJUNTO',m.roleData.channelPlan||'Alinear capacidades, generación de demanda, oportunidades y recursos del fabricante.',C.green);}
      if(m.roleData.certs||m.roleData.certsNext||m.roleData.incentives){s=pptx.addSlide();addBrand(s,`CAPACIDADES · ${v}`,'Preparados para crecer','Certificaciones, especializaciones y palancas disponibles para ampliar el negocio.');addCard(s,.65,2.0,3.8,2.05,'CAPACIDADES ACTUALES',m.roleData.certs||'Capacidades por revisar conjuntamente',C.green);addCard(s,4.77,2.0,3.8,2.05,'PRÓXIMOS HITOS',m.roleData.certsNext||'Definir certificaciones y especializaciones prioritarias',C.amber);addCard(s,8.89,2.0,3.8,2.05,'PROGRAMAS E INCENTIVOS',m.roleData.incentives||'Revisar programas aplicables y su impacto en el plan',C.purple);}
      if((m.roleData.opportunities||[]).some(o=>o.name||o.vendor||o.amount))addOpportunitySlideBranded(pptx,m,C,addBrand,roleAccent);
    } else if(m.primaryRole==='sa'){
      const v=m.roleData.vendor||selectedVendorNames(m)[0]||'Solución',p=vendorIntel(v);
      s=pptx.addSlide();addBrand(s,`ARQUITECTURA · ${v}`,'Necesidad y criterios de diseño',m.roleData.useCase||m.objective||'Caso de uso y criterios que debe resolver la solución.');
      addCard(s,.65,2.0,5.85,2.0,'PUNTO DE PARTIDA',m.roleData.current||'Partimos del entorno y las dependencias actuales para evitar rediseños innecesarios.',C.cyan);addCard(s,6.8,2.0,5.85,2.0,'CRITERIOS CLAVE',m.roleData.requirements||((p?.buyingTriggers||[]).slice(0,4).map(x=>'• '+x).join('\n')||'Rendimiento, seguridad, operación, integración y escalabilidad.'),C.magenta);addCard(s,.65,4.35,12.0,1.35,'CONDICIONES DE ÉXITO',m.roleData.poc||'Validar la solución con métricas representativas del caso de uso y del entorno real.',C.amber);
      if(m.outputs.depth!=='short'||m.roleData.poc){s=pptx.addSlide();addBrand(s,`PRUEBA DE VALOR · ${v}`,'De la arquitectura a una decisión medible','Una PoC/PoV centrada en los criterios que realmente decidirán la solución.');addCard(s,.85,2.05,3.55,2.25,'1 · BASELINE','Acordar la situación actual y las métricas de partida.',C.cyan);addCard(s,4.88,2.05,3.55,2.25,'2 · ESCENARIO','Probar un caso representativo, integrado con el entorno real.',C.amber);addCard(s,8.91,2.05,3.55,2.25,'3 · DECISIÓN','Definir umbrales de éxito antes de comenzar la prueba.',C.green);addCard(s,.85,4.7,11.61,1.15,'CRITERIOS PROPUESTOS',m.roleData.poc||'Rendimiento · experiencia · seguridad · operación · integración · escalabilidad · coste total',C.magenta);}
      if(m.outputs.notes&&m.roleData.competitors)try{s.addNotes(`Alternativas indicadas para preparar la sesión, no mostradas al partner por defecto: ${m.roleData.competitors}`)}catch{}
    }

    if(m.primaryRole!=='sa'&&(m.supportRoles||[]).includes('sa')){
      const v=prioritizedVendorNames(m)[0],p=v?vendorIntel(v):null;
      if(v&&p){s=pptx.addSlide();addBrand(s,`ARQUITECTURA · ${v}`,'Encaje técnico y prueba de valor','Un puente entre la oportunidad de negocio y los criterios técnicos que permitirán validarla.');addCard(s,.65,2.0,5.85,2.0,'CAPACIDADES CLAVE',(p.approvedAdvantages||[]).slice(0,4).map(x=>'• '+x).join('\n'),C.cyan);addCard(s,6.8,2.0,5.85,2.0,'CRITERIOS A VALIDAR',(p.buyingTriggers||[]).slice(0,4).map(x=>'• '+x).join('\n'),C.magenta);addCard(s,.65,4.35,12.0,1.35,'PRÓXIMO HITO TÉCNICO','Definir una demo, workshop o PoC/PoV con baseline, escenario representativo y umbral de éxito.',C.amber);}
    }

    // Capa dinámica de inteligencia comercial/técnica para todos los fabricantes seleccionados.
    const intelVendors=prioritizedVendorNames(m); const intelLimit=m.outputs.depth==='short'?2:m.outputs.depth==='deep'?6:4;
    if(m.vertical)addVerticalOpportunitySlide(m.vertical,intelVendors);
    for(const name of intelVendors.slice(0,intelLimit)){
      addVendorSalesSlide(name);
      if(m.outputs.depth!=='short')addVendorCompetitiveSlide(name);
      addVendorAnalystSlide(name);
      if(m.outputs.depth==='deep'||intelVendors.length<=2)addVendorMomentumSlide(name);
    }

    // Reutilización de playbooks y datasheets FY27 según vertical y área.
    const areas=vendorAreasForMeeting(m);const vmap=verticalSourceMap[m.vertical];
    if(vmap){
      const areaLimit=m.outputs.depth==='short'?1:m.outputs.depth==='standard'?2:3;
      for(const area of areas.slice(0,areaLimit)){
        const x=vmap[area];if(!x)continue;
        if(m.outputs.depth==='deep')await addOriginal('corporate',x.playbook,`Playbook sectorial ${m.vertical} · ${area}.`);
        await addOriginal('verticals',x.datasheet,`Datasheet vertical FY27 · ${m.vertical} · ${area}.`);
        if(m.outputs.depth==='deep')await addOriginal('corporate',x.message,`Mensajes clave sectoriales ${m.vertical} · ${area}.`);
      }
    }

    // Fichas originales de los fabricantes seleccionados.
    const vendors=prioritizedVendorNames(m);const maxVendorSlides=m.outputs.depth==='short'?2:m.outputs.depth==='standard'?5:10;let vendorCount=0;
    for(const vendor of vendors){
      const nums=vendorSourceSlides[vendor]||[];
      for(const n of nums){if(vendorCount>=maxVendorSlides)break;await addOriginal('corporate',n,`Ficha corporativa FY27 de ${vendor}.`);vendorCount++;}
      if(m.reserveVendorSlides)addPlaceholder(vendor);
      if(vendorCount>=maxVendorSlides)break;
    }

    // Servicios: reutiliza las slides originales que encajan con el perfil/selección.
    if(m.includeServices){const ss=serviceSourceSlides(m);const lim=m.outputs.depth==='short'?1:m.outputs.depth==='standard'?2:4;for(const n of ss.slice(0,lim))await addOriginal('corporate',n,'Capacidad/servicio Westcon Comstor FY27.');}

    // Cierre con plan concreto, no research interno visible al partner.
    s=pptx.addSlide();addBrand(s,'SIGUIENTE PASO','Plan de acción acordado','Salir de la reunión con pocas acciones, responsables y fecha.');
    addCard(s,.7,2.0,3.75,2.15,'WESTCON','Activar los recursos, especialistas, fabricante y servicios necesarios para el siguiente hito.',C.magenta);
    addCard(s,4.78,2.0,3.75,2.15,'PARTNER','Confirmar responsables, oportunidad/caso de uso prioritario y datos necesarios.',C.cyan);
    addCard(s,8.86,2.0,3.75,2.15,'FABRICANTE','Alinear recursos, programa, preventa o soporte especializado cuando aplique.',C.purple);
    addCard(s,.7,4.55,11.91,1.18,'RESULTADO QUE BUSCAMOS',m.desiredOutcome||'Un siguiente paso concreto, medible y con fecha.',C.amber);
    if(m.outputs.notes)try{s.addNotes(`Preguntas recomendadas:\n- ${questions.join('\n- ')}\n\nFuentes y líneas de investigación utilizadas para preparar la reunión:\n- ${queries.join('\n- ')}`)}catch{}
    if(m.outputs.depth!=='short')await addOriginal('corporate',84,'Cierre corporativo original FY27.');

    try{await pptx.writeFile({fileName:`${slug(m.partner)}-${m.primaryRole||'meeting'}-westcon-fy27.pptx`});}catch(e){console.error(e);alert('No se pudo generar el PowerPoint. Revisa la consola y vuelve a intentarlo.');}
  }

  function addOpportunitySlideBranded(pptx,m,C,addBrand,accent){
    const opp=(m.roleData.opportunities||[]).filter(o=>o.name||o.vendor||o.amount);const s=pptx.addSlide();addBrand(s,'OPORTUNIDADES EN CURSO','Pipeline y próximos hitos','Una visión compartida de las oportunidades que queremos acelerar.',accent);
    if(!opp.length){s.addText('Todavía no se han cargado oportunidades.',{x:.8,y:2.35,w:11.7,h:.45,fontFace:'Corbel',fontSize:20,bold:true,color:C.white,align:'center',margin:0});s.addText('Utiliza la reunión para discovery y añade después oportunidad, fabricante, solución, importe, fase y probabilidad.',{x:1.25,y:3.0,w:10.8,h:.7,fontFace:'Corbel',fontSize:13,color:C.muted,align:'center',margin:0});return;}
    opp.slice(0,6).forEach((o,i)=>{const col=i%2,row=Math.floor(i/2),x=.62+col*6.08,y=1.95+row*1.55;s.addShape(pptx.ShapeType.roundRect,{x,y,w:5.78,h:1.28,rectRadius:.06,fill:{color:C.navy2},line:{color:i%3===0?C.magenta:i%3===1?C.cyan:C.amber,pt:1}});s.addText(o.name||o.solution||'Oportunidad',{x:x+.18,y:y+.14,w:3.8,h:.28,fontFace:'Corbel',fontSize:12,bold:true,color:C.white,margin:0,fit:'shrink'});s.addText(`${o.vendor||'Vendor por definir'} · ${o.stage||'Fase por definir'}`,{x:x+.18,y:y+.52,w:3.9,h:.22,fontFace:'Corbel',fontSize:9,color:C.muted,margin:0,fit:'shrink'});s.addText(fmtMoney(o.amount),{x:x+4.1,y:y+.18,w:1.45,h:.3,fontFace:'Corbel',fontSize:14,bold:true,color:C.amber,align:'right',margin:0,fit:'shrink'});s.addText(`${Number(o.prob||0)}%`,{x:x+4.25,y:y+.64,w:1.3,h:.24,fontFace:'Corbel',fontSize:11,bold:true,color:C.cyan,align:'right',margin:0});});
  }

  // ---------- Knowledge / panels ----------
  function renderKnowledge(){const sc=$('#sourceCards');sc.innerHTML=(K.sourceDecks||[]).map(s=>`<div class="card source-card"><span class="badge ${s.type==='verticals'?'cyan':'magenta'}">${esc(s.type)}</span><h3>${esc(s.name)}</h3><p>${esc(s.slides)} slides · fuente semilla de la base de conocimiento.</p></div>`).join('');const st=$('#intelligenceStatus');if(st){const n=Object.keys(VI?.vendors||{}).length, liveN=Object.values(LIVE?.vendors||{}).filter(x=>(x.evidence||[]).length).length;st.innerHTML=`<div class="section-title"><div><h2>Motor de inteligencia</h2><p>${n} fichas de inteligencia de fabricante · ${liveN} fabricantes con evidencia pública ya cacheada.</p></div><span class="section-hint">${esc(intelligenceFreshness())}</span></div><div class="callout cyan"><strong>Capas activas:</strong> contenido corporativo FY27 · casos verticales · ventajas competitivas · contexto competitivo · analistas · noticias y medios · casos públicos · documentación técnica · priorización automática por reunión.</div>`;}$('#vendorCount').textContent=`${(K.vendors||[]).length} fabricantes`;$('#knowledgeVendors').innerHTML=(K.vendors||[]).map(v=>`<div class="knowledge-vendor"><img src="${vendorLogo(v.name)}" alt=""><div><strong>${esc(v.name)}</strong><small>${esc(v.area)}</small></div></div>`).join('');}
  function showPanel(id){$$('.panel').forEach(p=>p.classList.toggle('active',p.id===id));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.panel===id));window.scrollTo({top:0,behavior:'smooth'});}

  function wireGlobal(){
    $$('.nav-item').forEach(b=>b.addEventListener('click',()=>showPanel(b.dataset.panel)));$('#newMeetingBtn').addEventListener('click',()=>newMeeting(true));$('#saveBtn').addEventListener('click',saveMeeting);$('#exportBtn').addEventListener('click',()=>downloadJson());$('#buildBlueprintBtn').addEventListener('click',buildBlueprint);
    $$('#meetingForm input, #meetingForm select, #meetingForm textarea').forEach(e=>e.addEventListener('input',updateProgress));
    // Add import JSON control next to export
    const imp=document.createElement('button');imp.type='button';imp.className='secondary';imp.textContent='Importar JSON';const fi=document.createElement('input');fi.type='file';fi.accept='.json,application/json';fi.hidden=true;imp.addEventListener('click',()=>fi.click());fi.addEventListener('change',()=>fi.files[0]&&importJson(fi.files[0]));$('#exportBtn').after(imp,fi);
  }

  function init(){renderRoles();renderVendors();renderServices();renderVerticals();renderResearch();renderKnowledge();renderSaved();wireGlobal();updateProgress();}
  document.addEventListener('DOMContentLoaded',init);
})();
