/* Westcon Meeting Intelligence v0.1.2 — static, GitHub Pages friendly */
(() => {
  const K = window.WESTCON_KNOWLEDGE || {};
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
  const storageKey='westconMeetingIntelligence.v01.meetings';
  const prefsKey='westconMeetingIntelligence.v01.prefs';

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
    renderRoleFields(id); renderResearch(); updateProgress();
  }

  function renderVendors(){
    const grid=$('#vendorGrid'); grid.innerHTML='';
    (K.vendors||[]).forEach((v,i)=>{
      const lab=document.createElement('label'); lab.className='vendor-option'; lab.dataset.search=(v.name+' '+v.area+' '+(v.tags||[]).join(' ')).toLowerCase();
      lab.innerHTML=`<input type="checkbox" value="${esc(v.name)}"><img src="${vendorLogo(v.name)}" alt=""><div><strong>${esc(v.name)}</strong><small>${esc(v.area)}</small></div>`;
      $('input',lab).addEventListener('change',e=>{lab.classList.toggle('selected',e.target.checked); updateProgress();}); grid.appendChild(lab);
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
    psm:['partner','alliances','certifications','news','verticals','careers','market','cases'],
    vsm:['partner','alliances','certifications','news','channel','verticals','market','cases'],
    sa:['partner','alliances','certifications','analyst','competition','technical','market','cases'],
    commercial:['partner','alliances','news','verticals','careers','market','cases']
  };
  function renderResearch(){
    const host=$('#researchGrid'); const previous=new Set($$('input:checked',host).map(x=>x.value)); const defaults=new Set(defaultsByRole[state.primaryRole]||['partner','alliances','news','market']); host.innerHTML='';
    Object.entries(researchItems).forEach(([id,x])=>{const l=document.createElement('label');l.className='research-item';const use=previous.size?previous.has(id):defaults.has(id);l.classList.toggle('checked',use);l.innerHTML=`<input type="checkbox" value="${id}" ${use?'checked':''}><div><strong>${x.title}</strong><span>${x.desc}</span></div>`;$('input',l).addEventListener('change',e=>l.classList.toggle('checked',e.target.checked));host.appendChild(l);});
  }

  function vendorOptions(selected=''){return '<option value="">Seleccionar</option>'+(K.vendors||[]).map(v=>`<option ${v.name===selected?'selected':''}>${esc(v.name)}</option>`).join('');}
  function renderRoleFields(role){
    const h=$('#roleFields'); h.classList.remove('empty-state');
    const title=$('#roleSectionTitle');
    if(role==='psm'){
      title.textContent='Negocio y desarrollo global del partner';
      h.innerHTML=`
        <div class="role-intro"><strong>PSM:</strong> lectura global de la cuenta. Facturación, evolución, mix, pipeline, whitespace y acciones para hacer crecer la relación Westcon–partner.</div>
        <div class="grid three">
          <label>Estado de la relación<select id="psmRelationship"><option>Estratégica</option><option selected>En desarrollo</option><option>Transaccional</option><option>A recuperar</option><option>Nueva</option></select></label>
          <label>Objetivo FY / cuenta (€)<input type="number" id="psmTarget" placeholder="0"></label>
          <label>Potencial estimado<select id="psmPotential"><option>Muy alto</option><option selected>Alto</option><option>Medio</option><option>Bajo</option></select></label>
        </div>
        <label>Lectura de la relación / contexto conocido<textarea id="psmContext" rows="3" placeholder="Qué funciona, fricciones, personas clave, cambios recientes, compromisos pendientes..."></textarea></label>
        <h3>Facturación y evolución por fabricante</h3>
        <div class="table-wrap"><table><thead><tr><th>Fabricante</th><th>FY25</th><th>FY26</th><th>FY27 YTD</th><th>Objetivo FY27</th><th>Pipeline</th><th></th></tr></thead><tbody id="businessRows"></tbody></table></div>
        <div class="table-actions"><button type="button" class="secondary" id="addBusinessRow">＋ Añadir fabricante</button></div>
        <div id="businessMetrics" class="metric-row"></div>
        <h3>Oportunidades conocidas</h3>${opportunityTable()}
        <label>Whitespace / fabricantes o capacidades a desarrollar<textarea id="psmWhitespace" rows="3" placeholder="Hipótesis internas, fabricantes sin negocio, áreas donde el partner podría crecer..."></textarea></label>
        <label>Acciones / compromisos previos<textarea id="psmActions" rows="3" placeholder="Acciones abiertas, responsables, bloqueos y temas que hay que cerrar en la reunión..."></textarea></label>`;
      bindBusinessTable(); bindOpportunityTable();
    } else if(role==='vsm'){
      title.textContent='Relación fabricante–Westcon–partner';
      h.innerHTML=`
        <div class="role-intro"><strong>VSM:</strong> desarrollar un fabricante concreto dentro del partner: negocio, certificaciones, programa de canal, incentivos, enablement, pipeline y plan conjunto.</div>
        <div class="grid three">
          <label>Fabricante foco<select id="vsmVendor">${vendorOptions()}</select></label>
          <label>Tier / nivel actual<input id="vsmTier" placeholder="Ej. Platinum / Gold / Registered..."></label>
          <label>Tier objetivo<input id="vsmTargetTier" placeholder="Nivel al que queremos llegar"></label>
          <label>Facturación FY27 YTD (€)<input type="number" id="vsmRevenue" placeholder="0"></label>
          <label>Objetivo FY27 (€)<input type="number" id="vsmTarget" placeholder="0"></label>
          <label>Estado relación<select id="vsmRelationship"><option>Estratégica</option><option selected>En desarrollo</option><option>Inicial</option><option>Bloqueada</option><option>A recuperar</option></select></label>
        </div>
        <div class="grid two">
          <label>Certificaciones actuales<textarea id="vsmCerts" rows="4" placeholder="Certificaciones técnicas/comerciales ya disponibles"></textarea></label>
          <label>Certificaciones en proceso / necesarias<textarea id="vsmCertsNext" rows="4" placeholder="Gaps para tier, especializaciones o negocio objetivo"></textarea></label>
          <label>Plan de canal / objetivos acordados<textarea id="vsmChannelPlan" rows="4" placeholder="Prioridades del plan de canal, focus solutions, verticales, objetivos..."></textarea></label>
          <label>Incentivos, rebates, MDF y campañas<textarea id="vsmIncentives" rows="4" placeholder="Programas aplicables, promociones, MDF disponible, campañas previstas..."></textarea></label>
        </div>
        <h3>Pipeline del fabricante</h3>${opportunityTable()}
        <label>Bloqueos y ayuda necesaria de Westcon / vendor<textarea id="vsmBlockers" rows="3" placeholder="Qué está frenando certificación, venta, pipeline o relación"></textarea></label>`;
      bindOpportunityTable();
    } else if(role==='sa'){
      title.textContent='Arquitectura, diferenciación y prueba técnica';
      h.innerHTML=`
        <div class="role-intro"><strong>Solution Architect:</strong> construir una narrativa técnicamente defendible: necesidad, arquitectura, alternativas, ventajas, posicionamiento de analistas y PoC/PoV.</div>
        <div class="grid two">
          <label>Fabricante foco<select id="saVendor">${vendorOptions()}</select></label>
          <label>Caso de uso / problema técnico<input id="saUseCase" placeholder="Ej. Zero Trust, modernización campus, OT visibility, API Security..."></label>
          <label>Arquitectura / stack actual conocido<textarea id="saCurrent" rows="4" placeholder="Tecnologías actuales del partner o de sus clientes, dependencias, restricciones..."></textarea></label>
          <label>Requisitos y criterios de diseño<textarea id="saRequirements" rows="4" placeholder="Escala, rendimiento, integración, seguridad, cloud, operación, compliance..."></textarea></label>
          <label>Alternativas / competidores a comparar<textarea id="saCompetitors" rows="4" placeholder="Fabricantes o aproximaciones alternativas"></textarea></label>
          <label>Diferenciadores que queremos demostrar<textarea id="saDifferentiators" rows="4" placeholder="Ventajas técnicas, operativas, económicas o de integración"></textarea></label>
          <label>Analistas / evidencias a investigar<textarea id="saAnalysts" rows="4" placeholder="Gartner, IDC, Forrester, Omdia, GigaOm, ISG, benchmarks..."></textarea></label>
          <label>Criterios de éxito de PoC / PoV<textarea id="saPoc" rows="4" placeholder="Qué debe medirse para demostrar valor"></textarea></label>
        </div>
        <label>Riesgos, objeciones o limitaciones conocidas<textarea id="saRisks" rows="3" placeholder="No ocultar limitaciones: compatibilidad, costes, madurez, lock-in, migración..."></textarea></label>`;
    } else { h.className='role-fields empty-state'; h.innerHTML='<p>Selecciona un perfil para adaptar esta sección.</p>'; }
    $$('#roleFields input, #roleFields select, #roleFields textarea').forEach(e=>e.addEventListener('input',updateProgress));
    setTimeout(updateProgress,0);
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
      schemaVersion:'0.1.1', id:state.currentId||crypto.randomUUID?.()||String(Date.now()), updatedAt:nowIso(), partner:getVal('partnerName'), country:getVal('country'), meetingType:getVal('meetingType'), duration:getVal('duration'), objective:getVal('objective'), desiredOutcome:getVal('desiredOutcome'), primaryRole:state.primaryRole, supportRoles:[...state.supportRoles],
      vendors:$$('#vendorGrid input:checked').map(x=>x.value), vertical:getVal('vertical'), technologies:getVal('technologies'), includeGeneral:checked('includeGeneral'), reserveVendorSlides:checked('reserveVendorSlides'), includeServices:checked('includeServices'), services:$$('#serviceChips input:checked').map(x=>x.value),
      roleData:roleData(), research:$$('#researchGrid input:checked').map(x=>x.value), researchHorizon:Number(getVal('researchHorizon')||90), knownSources:getVal('knownSources'),
      outputs:{depth:getVal('deckDepth'),language:getVal('language'),tone:getVal('tone'),pptx:checked('outPptx'),brief:checked('outBrief'),notes:checked('outNotes'),questions:checked('outQuestions'),pdf:checked('outPdf'),sources:checked('outSources')}
    };
  }

  function computeCompleteness(m=gatherMeeting()){
    let score=0,total=0; const req=(ok,w=1)=>{total+=w;if(ok)score+=w;}; req(!!m.partner,3);req(!!m.objective,3);req(!!m.primaryRole,3);req(!!m.desiredOutcome,1);req(m.vendors.length>0||!!m.technologies,2);req(m.research.length>=4,1);req(!!m.vertical,1);
    if(m.primaryRole==='psm'){req((m.roleData.business||[]).length>0,3);req((m.roleData.opportunities||[]).length>0,1);req(!!m.roleData.context,1);}
    if(m.primaryRole==='vsm'){req(!!m.roleData.vendor,3);req(!!m.roleData.certs||!!m.roleData.certsNext,2);req(!!m.roleData.channelPlan,2);}
    if(m.primaryRole==='sa'){req(!!m.roleData.vendor,2);req(!!m.roleData.useCase,3);req(!!m.roleData.requirements,2);req(!!m.roleData.competitors,1);}
    return Math.round(score/Math.max(total,1)*100);
  }
  function missingData(m=gatherMeeting()){
    const x=[]; if(!m.partner)x.push('partner');if(!m.objective)x.push('objetivo');if(!m.primaryRole)x.push('perfil');if(!m.vendors.length&&!m.technologies)x.push('fabricantes o tecnologías');
    if(m.primaryRole==='psm'&&!(m.roleData.business||[]).length)x.push('facturación por fabricante'); if(m.primaryRole==='vsm'&&!m.roleData.vendor)x.push('fabricante foco'); if(m.primaryRole==='sa'&&!m.roleData.useCase)x.push('caso de uso'); return x;
  }
  function updateProgress(){const m=gatherMeeting(),s=computeCompleteness(m),miss=missingData(m);$('#progressBar').style.width=s+'%';$('#progressText').textContent=s+'% completado';$('#gapText').textContent=miss.length?'Falta: '+miss.slice(0,3).join(', '):'Listo para construir el blueprint';$('#readyTitle').textContent=s>=70?'Ya puedes crear una primera narrativa':'Completa los datos clave';$('#readySubtitle').textContent=miss.length?'Prioridad: '+miss.join(', '):'La reunión tiene suficiente contexto para generar un blueprint útil.';}

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
  function domainHint(v){const n=(v||'').toLowerCase();const known={'palo alto networks':'paloaltonetworks.com','cisco':'cisco.com','crowdstrike':'crowdstrike.com','claroty':'claroty.com','fortanix':'fortanix.com','okta':'okta.com','zscaler':'zscaler.com','juniper networks':'juniper.net','extreme networks':'extremenetworks.com','efficientip':'efficientip.com','f5':'f5.com'};return known[n]||'google.com';}
  function recommendedSlides(m){
    const slides=[]; const add=(title,purpose,tag='Generada')=>slides.push({title,purpose,tag});
    add(`${m.partner || 'Partner'} · objetivo de la reunión`,m.objective||'Enmarcar objetivo, agenda y resultado esperado','Generada');
    if(m.includeGeneral){add('Westcon Comstor en 60 segundos','Credenciales, portfolio especializado y cómo ayudamos al partner','Reutilizable');add('Cómo hacemos crecer al partner','BLUEPRINT: diagnóstico, enablement, demanda, PoC, servicios y lifecycle','Reutilizable');}
    if(m.primaryRole==='psm'){
      add('Estado de la relación','Resumen ejecutivo de relación, prioridades e hitos','Generada');add('Negocio por fabricante','Facturación, evolución, objetivo y concentración del mix','Generada');add('Pipeline y forecast','Oportunidades, ponderación, bloqueos y ayuda necesaria','Generada');add('Whitespace detectado','Fabricantes, capacidades y verticales con potencial','Generada');add('Plan conjunto de crecimiento','3–5 acciones, responsables, fechas y apoyo Westcon','Generada');
    }
    if(m.primaryRole==='vsm'){
      const v=m.roleData.vendor||m.vendors[0]||'fabricante'; add(`Estado de la relación con ${v}`,'Negocio actual, tier, compromiso y objetivos','Generada');add('Certificaciones y readiness','Situación, gaps y plan para alcanzar el siguiente nivel','Generada');add('Programa de canal e incentivos','MDF, rebates, promociones y palancas comerciales aplicables','Investigada');add(`Pipeline ${v}`,'Oportunidades, fases, probabilidad y acciones de aceleración','Generada');add('Plan de desarrollo conjunto','Enablement, demanda, pipeline y métricas de seguimiento','Generada');
    }
    if(m.primaryRole==='sa'){
      const v=m.roleData.vendor||m.vendors[0]||'fabricante'; add('Problema y criterios de diseño',m.roleData.useCase||'Qué tiene que resolver la arquitectura','Generada');add('Arquitectura propuesta','Componentes, integración, operación y decisiones de diseño','Generada');add(`¿Por qué ${v}?`,'Diferenciadores relevantes para este caso, no marketing genérico','Generada');add('Alternativas y trade-offs','Comparación honesta con competidores y limitaciones','Investigada');add('Posicionamiento de mercado','Gartner, IDC, Forrester y otras fuentes con fecha y evidencia','Investigada');add('PoC / PoV medible','Criterios de éxito, alcance y siguiente paso técnico','Generada');
    }
    if((m.supportRoles||[]).includes('vsm') && m.primaryRole!=='vsm') add('Bloque VSM · desarrollo del fabricante','Tier, certificaciones, canal, incentivos y plan conjunto','Generada');
    if((m.supportRoles||[]).includes('sa') && m.primaryRole!=='sa') add('Bloque SA · profundización técnica','Arquitectura, trade-offs, analistas y PoC/PoV','Generada');
    if((m.supportRoles||[]).includes('psm') && m.primaryRole!=='psm') add('Bloque PSM · lectura de cuenta','Evolución, mix, whitespace y prioridades de crecimiento','Generada');
    if(m.reserveVendorSlides) add('Bloque de slides oficiales del fabricante','Espacio reservado para contenido oficial que aporte VSM/SA','A insertar');
    add('Preguntas que deben abrir conversación','Discovery orientado al rol, no preguntas genéricas','Generada');add('Siguientes pasos','Acciones concretas, responsables y fecha objetivo','Generada');
    const depth=m.outputs.depth; const target=depth==='short'?8:depth==='deep'?18:14; return slides.slice(0,target);
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
    if(m.primaryRole==='sa'&&!m.roleData.competitors)out.push({type:'warn',text:'Falta indicar alternativas/competidores. Para una narrativa técnica creíble conviene comparar trade-offs, no solo ventajas propias.'});
    if(m.knownSources)out.push({type:'good',text:'Hay fuentes conocidas aportadas por el usuario: deben tener prioridad sobre inferencias genéricas.'});
    return out;
  }

  function buildBlueprint(){
    const m=gatherMeeting(); const score=computeCompleteness(m); if(!m.partner||!m.objective||!m.primaryRole){alert('Completa al menos partner, objetivo y perfil.');return;}
    state.currentId=m.id;
    const slides=recommendedSlides(m), insights=[...derivedBusinessInsights(m),...genericInsights(m)], queries=researchQueries(m), questions=questionsFor(m);
    const host=$('#blueprint'); host.classList.remove('hidden');
    host.innerHTML=`
      <div class="blueprint-head"><div><span class="eyebrow">BLUEPRINT DE REUNIÓN</span><h2>${esc(m.partner)} · ${esc(roleById(m.primaryRole)?.name||'')}</h2><p>${esc(m.objective)}</p></div><div class="score-badge">Contexto ${score}%</div></div>
      <div class="kpi-strip">${blueprintKpis(m).map(x=>`<div class="kpi"><span>${esc(x.label)}</span><strong>${esc(x.value)}</strong></div>`).join('')}</div>
      <div class="blueprint-grid">
        <div class="card"><h3>Narrativa propuesta</h3><div class="slide-list">${slides.map((s,i)=>`<div class="slide-item"><div class="slide-num">${i+1}</div><div><strong>${esc(s.title)}</strong><p>${esc(s.purpose)}</p></div><span class="slide-tag">${esc(s.tag)}</span></div>`).join('')}</div></div>
        <div>
          <div class="card"><h3>Lecturas y alertas</h3><ul class="insight-list">${(insights.length?insights:[{type:'good',text:'La información básica es consistente. La siguiente capa debe validar hipótesis con fuentes públicas.'}]).map(x=>`<li class="${x.type||''}">${esc(x.text)}</li>`).join('')}</ul></div>
          <div class="card" style="margin-top:16px"><h3>Preguntas recomendadas</h3><ul class="question-list">${questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul></div>
          <div class="card" style="margin-top:16px"><h3>Cola de investigación</h3><ul class="research-list">${queries.map(q=>`<li><a target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(q)}">${esc(q)}</a></li>`).join('')||'<li>Selecciona áreas de research para generar queries.</li>'}</ul></div>
        </div>
      </div>
      <div class="card" style="margin-top:16px"><h3>Salida</h3><div class="callout magenta"><strong>Principio:</strong> la futura capa de IA deberá reutilizar primero contenido corporativo existente y generar solo lo que falte. Cada afirmación externa conservará fuente, URL, fecha y confianza.</div><div class="output-bar"><button class="primary" id="downloadPptxBtn">Descargar PowerPoint editable</button><button class="secondary" id="downloadBriefBtn">Descargar briefing</button><button class="secondary" id="printBtn">Imprimir / PDF</button><button class="ghost" id="saveBlueprintBtn">Guardar reunión</button></div></div>`;
    $('#downloadPptxBtn').addEventListener('click',()=>generatePptx(m,slides,insights,questions,queries)); $('#downloadBriefBtn').addEventListener('click',()=>downloadBriefing(m,slides,insights,questions,queries)); $('#printBtn').addEventListener('click',()=>window.print()); $('#saveBlueprintBtn').addEventListener('click',saveMeeting);
    host.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function blueprintKpis(m){
    const x=[{label:'Perfil',value:roleById(m.primaryRole)?.name||'—'},{label:'Fabricantes',value:String(m.vendors.length||1)},{label:'Duración',value:m.duration||'—'},{label:'Research',value:String(m.research.length)+' áreas'}];
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
  function downloadBriefing(m,slides=recommendedSlides(m),insights=[...derivedBusinessInsights(m),...genericInsights(m)],questions=questionsFor(m),queries=researchQueries(m)){
    const html=`<!doctype html><html lang="es"><meta charset="utf-8"><title>Briefing ${esc(m.partner)}</title><style>body{font-family:Arial,sans-serif;max-width:980px;margin:40px auto;color:#173142;line-height:1.45;padding:0 24px}h1{font-size:34px}h2{margin-top:30px;color:#082a3a}.meta{padding:15px;background:#eef7f8;border-left:5px solid #08a7b5}.slide{padding:10px 0;border-bottom:1px solid #ddd}.tag{font-size:10px;background:#eee;border-radius:99px;padding:3px 7px}.q{padding:10px;background:#f7f9fa;margin:7px 0}.src{font-size:12px;color:#647984}</style><body><h1>${esc(m.partner)} · ${esc(roleById(m.primaryRole)?.name||'')}</h1><div class="meta"><strong>Objetivo:</strong> ${esc(m.objective)}<br><strong>Resultado buscado:</strong> ${esc(m.desiredOutcome||'—')}<br><strong>Fabricantes:</strong> ${esc(m.vendors.join(', ')||'Por definir')}<br><strong>Vertical:</strong> ${esc(m.vertical||'—')}</div><h2>Lecturas previas</h2>${insights.map(x=>`<p>• ${esc(x.text)}</p>`).join('')}<h2>Narrativa</h2>${slides.map((s,i)=>`<div class="slide"><strong>${i+1}. ${esc(s.title)}</strong> <span class="tag">${esc(s.tag)}</span><br>${esc(s.purpose)}</div>`).join('')}<h2>Preguntas</h2>${questions.map(q=>`<div class="q">${esc(q)}</div>`).join('')}<h2>Research pendiente</h2>${queries.map(q=>`<p class="src">${esc(q)}</p>`).join('')}<h2>Datos estructurados</h2><pre>${esc(JSON.stringify(m.roleData,null,2))}</pre></body></html>`;
    downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),`${slug(m.partner)}-briefing.html`);
  }

  // ---------- PowerPoint ----------
  // v0.1.2: el PPTX reutiliza visualmente las slides corporativas/datasheets originales
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
  function selectedVendorNames(m){
    const out=[...(m.vendors||[])];
    const focus=m.roleData?.vendor;
    if(focus&&!out.includes(focus))out.unshift(focus);
    return [...new Set(out.filter(Boolean))];
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
    }
    return [...new Set(out)];
  }

  async function generatePptx(m,slides,insights,questions,queries){
    if(typeof window.PptxGenJS==='undefined'){alert('No se ha podido cargar el generador PowerPoint.');return;}
    const pptx=new window.PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Westcon Meeting Intelligence';pptx.subject=`Reunión con ${m.partner}`;pptx.title=`${m.partner} · ${roleById(m.primaryRole)?.name||''}`;pptx.company='Westcon Comstor';pptx.lang='es-ES';
    const C={navy:'1A2E44',navy2:'113A50',navy3:'082335',magenta:'E5007D',cyan:'12C7C0',amber:'FFAE00',purple:'6C5CA3',white:'FFFFFF',muted:'AEBECA',line:'24506A',green:'169F82',soft:'DDE6EB'};
    const roleAccent=m.primaryRole==='sa'?C.cyan:m.primaryRole==='vsm'?C.purple:C.magenta;
    let logoData=null;try{logoData=await assetData('assets/westcon-comstor.png')}catch{}
    const addFooter=(s,accent=roleAccent)=>{s.addShape(pptx.ShapeType.rect,{x:0,y:7.36,w:13.333,h:.14,fill:{color:accent},line:{color:accent}});s.addText('FY2027 — Westcon Comstor España',{x:.45,y:7.12,w:4.2,h:.16,fontFace:'Corbel',fontSize:7.5,color:C.muted,margin:0});s.addText('Contenido dinámico · validar datos externos y comerciales',{x:7.4,y:7.12,w:5.45,h:.16,fontFace:'Corbel',fontSize:7.5,color:C.muted,align:'right',margin:0});};
    const addBrand=(s,section,title,subtitle='',accent=roleAccent)=>{s.background={color:C.navy};if(logoData){s.addShape(pptx.ShapeType.roundRect,{x:10.92,y:.22,w:1.9,h:.55,rectRadius:.05,fill:{color:C.white},line:{color:C.white}});s.addImage({data:logoData,x:11.08,y:.32,w:1.55,h:.34});}s.addText(String(section||'WESTCON COMSTOR').toUpperCase(),{x:.48,y:.27,w:5.2,h:.23,fontFace:'Corbel',fontSize:10,bold:true,color:accent,charSpacing:1.2,margin:0});s.addText(title,{x:.48,y:.68,w:10.0,h:.62,fontFace:'Corbel',fontSize:27,bold:true,color:C.white,margin:0,fit:'shrink'});if(subtitle)s.addText(subtitle,{x:.5,y:1.36,w:11.8,h:.42,fontFace:'Corbel',fontSize:12,color:C.muted,margin:0,fit:'shrink'});addFooter(s,accent);};
    const addCard=(s,x,y,w,h,title,text,accent=roleAccent)=>{s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:.06,fill:{color:C.navy2,transparency:3},line:{color:accent,pt:1.1}});if(title)s.addText(title.toUpperCase(),{x:x+.18,y:y+.14,w:w-.36,h:.24,fontFace:'Corbel',fontSize:10,bold:true,color:accent,margin:0,fit:'shrink'});if(text)s.addText(String(text),{x:x+.18,y:y+(title?0.52:0.2),w:w-.36,h:h-(title?0.66:0.36),fontFace:'Corbel',fontSize:13,color:C.white,margin:.01,fit:'shrink',valign:'mid'});};
    const addKpi=(s,x,y,w,label,value,accent=roleAccent)=>{s.addShape(pptx.ShapeType.roundRect,{x,y,w,h:1.02,rectRadius:.05,fill:{color:C.navy2},line:{color:accent,pt:1}});s.addText(String(value||'—'),{x:x+.1,y:y+.16,w:w-.2,h:.37,fontFace:'Corbel',fontSize:19,bold:true,color:C.white,align:'center',margin:0,fit:'shrink'});s.addText(label,{x:x+.1,y:y+.62,w:w-.2,h:.2,fontFace:'Corbel',fontSize:8.5,color:C.muted,align:'center',margin:0,fit:'shrink'});};
    const addBullets=(s,items,x=.65,y=2.05,w=12,h=4.7,fs=15)=>{const runs=[];items.filter(Boolean).forEach(t=>runs.push({text:String(t),options:{bullet:{indent:14},breakLine:true}}));s.addText(runs,{x,y,w,h,fontFace:'Corbel',fontSize:fs,color:C.white,margin:.02,paraSpaceAfterPt:9,fit:'shrink'});};
    const addOriginal=async(kind,n,notes='')=>{const s=pptx.addSlide();try{s.addImage({data:await assetData(sourceAsset(kind,n)),x:0,y:0,w:13.333,h:7.5});}catch(e){addBrand(s,'CONTENIDO CORPORATIVO',`Slide ${n} no disponible`,String(e.message||e));}if(notes&&m.outputs.notes)try{s.addNotes(notes)}catch{}return s;};
    const addPlaceholder=(vendor)=>{const s=pptx.addSlide();addBrand(s,'FABRICANTE',`Slides oficiales de ${vendor}`,'Espacio reservado para incorporar contenido oficial específico de esta reunión.',C.purple);s.addShape(pptx.ShapeType.roundRect,{x:1.05,y:2.35,w:11.2,h:2.5,rectRadius:.08,fill:{color:C.navy2},line:{color:C.purple,pt:1.3,dash:'dash'}});s.addText('INSERTAR AQUÍ SLIDES OFICIALES DEL FABRICANTE',{x:1.4,y:3.2,w:10.5,h:.45,fontFace:'Corbel',fontSize:20,bold:true,color:C.muted,align:'center',margin:0});return s;};

    // Portada: usa el fondo corporativo original para mantener identidad 1:1.
    let s=pptx.addSlide();try{s.addImage({data:await assetData(sourceAsset('corporate',1)),x:0,y:0,w:13.333,h:7.5})}catch{s.background={color:C.navy};}
    s.addShape(pptx.ShapeType.rect,{x:.0,y:1.55,w:7.2,h:3.55,fill:{color:C.navy,transparency:1},line:{color:C.navy,transparency:100}});
    s.addText((m.partner||'PARTNER').toUpperCase(),{x:.68,y:2.03,w:6.0,h:.82,fontFace:'Corbel',fontSize:32,bold:true,color:C.white,margin:0,fit:'shrink'});
    s.addText(m.objective||'Reunión de trabajo',{x:.7,y:2.95,w:5.85,h:.68,fontFace:'Corbel',fontSize:17,color:C.white,margin:0,fit:'shrink'});
    s.addText(`${roleById(m.primaryRole)?.name||''}${m.meetingType?' · '+m.meetingType:''}${m.duration?' · '+m.duration:''}`,{x:.7,y:3.92,w:5.8,h:.28,fontFace:'Corbel',fontSize:10.5,bold:true,color:C.amber,margin:0});
    if(m.desiredOutcome)s.addText(`Objetivo de salida: ${m.desiredOutcome}`,{x:.7,y:4.38,w:5.8,h:.38,fontFace:'Corbel',fontSize:10.5,color:C.muted,margin:0,fit:'shrink'});
    if(m.outputs.notes)try{s.addNotes(`Objetivo: ${m.objective}\nResultado buscado: ${m.desiredOutcome||'por validar'}\nPreguntas sugeridas:\n- ${questions.join('\n- ')}`)}catch{}

    // Slides corporativas reales.
    if(m.includeGeneral){
      await addOriginal('corporate',2,'Quiénes somos — slide original FY27.');
      if(m.outputs.depth!=='short')await addOriginal('corporate',3,'Propuesta de valor — slide original FY27.');
      await addOriginal('corporate',5,'Portfolio de fabricantes — slide original FY27.');
      if(m.primaryRole==='psm'&&m.outputs.depth==='deep')await addOriginal('corporate',4,'Framework BLUEPRINT — slide original FY27.');
    }

    // Tesis de la reunión en formato corporativo, no una lista genérica blanca.
    s=pptx.addSlide();addBrand(s,'REUNIÓN CON PARTNER','Qué queremos conseguir',m.desiredOutcome||'Resultado que debemos validar y acordar en la reunión.');
    addCard(s,.55,2.05,3.85,1.55,'OBJETIVO',m.objective||'Por definir',roleAccent);
    addCard(s,4.72,2.05,3.85,1.55,'FOCO',m.vertical||m.technologies||'Relación y oportunidades',C.cyan);
    addCard(s,8.89,2.05,3.85,1.55,'FABRICANTES',selectedVendorNames(m).join(', ')||'A priorizar durante la reunión',C.amber);
    addCard(s,.55,3.95,5.95,1.75,'RESULTADO ESPERADO',m.desiredOutcome||'Acordar un siguiente paso concreto, con responsables y fecha.',C.magenta);
    addCard(s,6.82,3.95,5.92,1.75,'CONTEXTO',m.primaryRole==='psm'?(m.roleData.context||'Revisar relación global, evolución y oportunidades.'):m.primaryRole==='vsm'?(m.roleData.channelPlan||'Desarrollar el fabricante dentro del partner.'):(m.roleData.useCase||'Defender la solución y acordar una prueba de valor.'),C.green);

    if(m.primaryRole==='psm'){
      const b=(m.roleData.business||[]).filter(r=>r.vendor);const total27=b.reduce((a,r)=>a+Number(r.fy27||0),0);const totalTarget=b.reduce((a,r)=>a+Number(r.target||0),0);const pipe=b.reduce((a,r)=>a+Number(r.pipeline||0),0)+(m.roleData.opportunities||[]).reduce((a,r)=>a+Number(r.amount||0),0);
      s=pptx.addSlide();addBrand(s,'PSM · PARTNER BUSINESS REVIEW','Situación de la relación',m.roleData.context||'Lectura global de la cuenta y de las palancas para crecer.');
      addKpi(s,.65,2.0,2.85,'FY27 YTD',fmtMoney(total27),C.magenta);addKpi(s,3.77,2.0,2.85,'Objetivo FY27',fmtMoney(totalTarget),C.cyan);addKpi(s,6.89,2.0,2.85,'Pipeline',fmtMoney(pipe),C.amber);addKpi(s,10.01,2.0,2.65,'Potencial',m.roleData.potential||'—',C.green);
      addCard(s,.65,3.42,5.9,2.05,'LECTURAS CLAVE',[...insights.map(x=>x.text)].slice(0,4).join('\n• ')||'Todavía no hay suficiente dato para interpretar la evolución.',C.magenta);
      addCard(s,6.78,3.42,5.9,2.05,'WHITESPACE',m.roleData.whitespace||'Identificar fabricantes, servicios y capacidades sin negocio actual.',C.cyan);

      s=pptx.addSlide();addBrand(s,'PSM · EVOLUCIÓN','Negocio por fabricante','Facturación introducida por el PSM. No se mezcla con datos inferidos de fuentes públicas.');
      if(!b.length){addBullets(s,['No se han cargado datos de facturación.','Añade FY25, FY26, FY27 YTD, objetivo y pipeline para cada fabricante.']);}
      else{
        const rows=b.slice(0,m.outputs.depth==='deep'?8:6);const max=Math.max(1,...rows.flatMap(r=>[Number(r.fy25||0),Number(r.fy26||0),Number(r.fy27||0),Number(r.target||0)]));
        s.addText('Fabricante',{x:.58,y:1.92,w:2.05,h:.25,fontFace:'Corbel',fontSize:9,bold:true,color:C.muted,margin:0});s.addText('FY25',{x:2.66,y:1.92,w:1.9,h:.25,fontFace:'Corbel',fontSize:9,bold:true,color:C.muted,margin:0});s.addText('FY26',{x:4.68,y:1.92,w:1.9,h:.25,fontFace:'Corbel',fontSize:9,bold:true,color:C.muted,margin:0});s.addText('FY27 YTD',{x:6.70,y:1.92,w:1.9,h:.25,fontFace:'Corbel',fontSize:9,bold:true,color:C.muted,margin:0});s.addText('Objetivo',{x:8.72,y:1.92,w:1.9,h:.25,fontFace:'Corbel',fontSize:9,bold:true,color:C.muted,margin:0});s.addText('Pipeline',{x:10.74,y:1.92,w:1.9,h:.25,fontFace:'Corbel',fontSize:9,bold:true,color:C.muted,margin:0});
        rows.forEach((r,i)=>{const y=2.35+i*.63;s.addText(r.vendor,{x:.58,y,w:1.95,h:.3,fontFace:'Corbel',fontSize:10,bold:true,color:C.white,margin:0,fit:'shrink'});[[r.fy25,C.purple,2.66],[r.fy26,C.cyan,4.68],[r.fy27,C.magenta,6.70],[r.target,C.amber,8.72],[r.pipeline,C.green,10.74]].forEach(([val,col,x])=>{const n=Number(val||0);s.addShape(pptx.ShapeType.roundRect,{x,y:y+.02,w:1.7,h:.27,rectRadius:.03,fill:{color:C.navy2},line:{color:C.line,pt:.5}});if(n>0)s.addShape(pptx.ShapeType.roundRect,{x,y:y+.02,w:Math.max(.08,1.7*n/max),h:.27,rectRadius:.03,fill:{color:col},line:{color:col}});s.addText(fmtMoney(n),{x,y:y+.34,w:1.72,h:.18,fontFace:'Corbel',fontSize:7.2,color:C.muted,align:'center',margin:0,fit:'shrink'});});});
      }
      addOpportunitySlideBranded(pptx,m,C,addBrand,roleAccent);
      s=pptx.addSlide();addBrand(s,'PSM · PLAN DE CUENTA','Dónde crecer juntos','Convertir el análisis en una conversación concreta de crecimiento.');
      addCard(s,.6,2.0,3.85,2.25,'1 · DEFENDER Y EXPANDIR','Consolidar fabricantes con negocio, proteger renovaciones y ampliar líneas/servicios.',C.magenta);
      addCard(s,4.74,2.0,3.85,2.25,'2 · ACTIVAR WHITESPACE',m.roleData.whitespace||'Priorizar 2–3 fabricantes/capacidades con encaje real en el partner.',C.cyan);
      addCard(s,8.88,2.0,3.85,2.25,'3 · ACELERAR PIPELINE','Seleccionar oportunidades con ayuda requerida de Westcon o del fabricante.',C.amber);
      addCard(s,.6,4.6,12.13,1.15,'ACCIONES ABIERTAS',m.roleData.actions||'Acordar responsables, fechas y criterio de éxito para cada acción.',C.green);
    } else if(m.primaryRole==='vsm'){
      const v=m.roleData.vendor||selectedVendorNames(m)[0]||'Fabricante';
      s=pptx.addSlide();addBrand(s,`VSM · ${v}`,`Estado de la relación ${v} – Partner`,'Negocio, programa de canal y próximos hitos.');
      addKpi(s,.7,2.0,2.8,'FY27 YTD',fmtMoney(m.roleData.revenue),C.magenta);addKpi(s,3.78,2.0,2.8,'Objetivo',fmtMoney(m.roleData.target),C.amber);addKpi(s,6.86,2.0,2.8,'Tier actual',m.roleData.tier||'Por validar',C.purple);addKpi(s,9.94,2.0,2.7,'Tier objetivo',m.roleData.targetTier||'Por definir',C.cyan);
      addCard(s,.7,3.48,5.85,2.05,'PLAN DE CANAL',m.roleData.channelPlan||'Definir foco, verticales, enablement, generación de demanda y objetivos.',C.magenta);
      addCard(s,6.83,3.48,5.82,2.05,'ESTADO DE RELACIÓN',m.roleData.relationship||'Por definir',C.cyan);
      s=pptx.addSlide();addBrand(s,`VSM · ${v}`,'Certificaciones, incentivos y desarrollo','Qué necesita el partner para progresar con el fabricante.');
      addCard(s,.65,2.0,3.8,2.0,'CERTIFICACIONES ACTUALES',m.roleData.certs||'Por validar',C.green);addCard(s,4.77,2.0,3.8,2.0,'GAPS / EN PROCESO',m.roleData.certsNext||'Por identificar',C.amber);addCard(s,8.89,2.0,3.8,2.0,'INCENTIVOS / MDF',m.roleData.incentives||'Investigar programas vigentes y elegibilidad.',C.purple);
      addCard(s,.65,4.35,12.04,1.35,'BLOQUEOS A RESOLVER',m.roleData.blockers||'Validar bloqueos comerciales, técnicos, de certificación o de programa.',C.magenta);
      addOpportunitySlideBranded(pptx,m,C,addBrand,roleAccent);
    } else if(m.primaryRole==='sa'){
      const v=m.roleData.vendor||selectedVendorNames(m)[0]||'Solución';
      s=pptx.addSlide();addBrand(s,`SOLUTION ARCHITECT · ${v}`,'Problema y criterios de diseño',m.roleData.useCase||'Caso de uso por concretar.');
      addCard(s,.65,2.0,5.85,2.0,'SITUACIÓN ACTUAL',m.roleData.current||'Arquitectura actual por confirmar.',C.cyan);addCard(s,6.8,2.0,5.85,2.0,'REQUISITOS',m.roleData.requirements||'Definir requisitos funcionales, operativos y de seguridad.',C.magenta);addCard(s,.65,4.35,12.0,1.35,'RIESGOS / RESTRICCIONES',m.roleData.risks||'Identificar dependencias, limitaciones y criterios de exclusión.',C.amber);
      s=pptx.addSlide();addBrand(s,`SOLUTION ARCHITECT · ${v}`,`¿Por qué ${v}?`,'Defender decisiones técnicas con evidencia y trade-offs, no con claims genéricos.');
      addCard(s,.65,2.0,5.85,2.15,'DIFERENCIADORES',m.roleData.differentiators||'Investigar capacidades diferenciales verificables para este caso de uso.',C.green);addCard(s,6.8,2.0,5.85,2.15,'ALTERNATIVAS',m.roleData.competitors||'Identificar competidores y condiciones en las que cada alternativa encaja mejor.',C.purple);addCard(s,.65,4.5,12.0,1.25,'ANALISTAS / EVIDENCIA',m.roleData.analysts||'Gartner · IDC · Forrester · Omdia · GigaOm · ISG: incorporar solo información verificable y fechada.',C.cyan);
      s=pptx.addSlide();addBrand(s,`SOLUTION ARCHITECT · ${v}`,'PoC / PoV medible','La prueba debe responder a los criterios que decidirán la solución.');addCard(s,.85,2.1,11.65,2.05,'CRITERIOS DE ÉXITO',m.roleData.poc||'Definir alcance, baseline, métricas, datos necesarios, responsables y umbral de éxito.',C.magenta);addCard(s,.85,4.5,3.55,1.15,'BASELINE','Situación actual medible',C.cyan);addCard(s,4.88,4.5,3.55,1.15,'PRUEBA','Escenario representativo',C.amber);addCard(s,8.91,4.5,3.55,1.15,'DECISIÓN','Criterio objetivo de aceptación',C.green);
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
    const vendors=selectedVendorNames(m);const maxVendorSlides=m.outputs.depth==='short'?2:m.outputs.depth==='standard'?5:10;let vendorCount=0;
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
    addCard(s,.7,2.0,3.75,2.15,'WESTCON',m.primaryRole==='psm'?(m.roleData.actions||'Activar recursos, fabricante y servicios necesarios.'):(m.primaryRole==='vsm'?(m.roleData.blockers||'Resolver bloqueos y activar plan de canal.'):'Preparar diseño, demo/PoC y criterios de éxito.'),C.magenta);
    addCard(s,4.78,2.0,3.75,2.15,'PARTNER','Confirmar responsables, oportunidad/caso de uso prioritario y datos necesarios.',C.cyan);
    addCard(s,8.86,2.0,3.75,2.15,'FABRICANTE','Alinear recursos, programa, preventa o soporte especializado cuando aplique.',C.purple);
    addCard(s,.7,4.55,11.91,1.18,'RESULTADO QUE BUSCAMOS',m.desiredOutcome||'Un siguiente paso concreto, medible y con fecha.',C.amber);
    if(m.outputs.notes)try{s.addNotes(`Preguntas recomendadas:\n- ${questions.join('\n- ')}\n\nResearch pendiente (NO mostrar al partner):\n- ${queries.join('\n- ')}`)}catch{}
    if(m.outputs.depth!=='short')await addOriginal('corporate',84,'Cierre corporativo original FY27.');

    try{await pptx.writeFile({fileName:`${slug(m.partner)}-${m.primaryRole||'meeting'}-westcon-fy27.pptx`});}catch(e){console.error(e);alert('No se pudo generar el PowerPoint. Revisa la consola y vuelve a intentarlo.');}
  }

  function addOpportunitySlideBranded(pptx,m,C,addBrand,accent){
    const opp=(m.roleData.opportunities||[]).filter(o=>o.name||o.vendor||o.amount);const s=pptx.addSlide();addBrand(s,m.primaryRole==='vsm'?'VSM · PIPELINE':'PSM · PIPELINE','Pipeline y oportunidades','Priorizar dónde actuar, no solo listar oportunidades.',accent);
    if(!opp.length){s.addText('Todavía no se han cargado oportunidades.',{x:.8,y:2.35,w:11.7,h:.45,fontFace:'Corbel',fontSize:20,bold:true,color:C.white,align:'center',margin:0});s.addText('Utiliza la reunión para discovery y añade después oportunidad, fabricante, solución, importe, fase y probabilidad.',{x:1.25,y:3.0,w:10.8,h:.7,fontFace:'Corbel',fontSize:13,color:C.muted,align:'center',margin:0});return;}
    opp.slice(0,6).forEach((o,i)=>{const col=i%2,row=Math.floor(i/2),x=.62+col*6.08,y=1.95+row*1.55;s.addShape(pptx.ShapeType.roundRect,{x,y,w:5.78,h:1.28,rectRadius:.06,fill:{color:C.navy2},line:{color:i%3===0?C.magenta:i%3===1?C.cyan:C.amber,pt:1}});s.addText(o.name||o.solution||'Oportunidad',{x:x+.18,y:y+.14,w:3.8,h:.28,fontFace:'Corbel',fontSize:12,bold:true,color:C.white,margin:0,fit:'shrink'});s.addText(`${o.vendor||'Vendor por definir'} · ${o.stage||'Fase por definir'}`,{x:x+.18,y:y+.52,w:3.9,h:.22,fontFace:'Corbel',fontSize:9,color:C.muted,margin:0,fit:'shrink'});s.addText(fmtMoney(o.amount),{x:x+4.1,y:y+.18,w:1.45,h:.3,fontFace:'Corbel',fontSize:14,bold:true,color:C.amber,align:'right',margin:0,fit:'shrink'});s.addText(`${Number(o.prob||0)}%`,{x:x+4.25,y:y+.64,w:1.3,h:.24,fontFace:'Corbel',fontSize:11,bold:true,color:C.cyan,align:'right',margin:0});});
  }

  // ---------- Knowledge / panels ----------
  function renderKnowledge(){const sc=$('#sourceCards');sc.innerHTML=(K.sourceDecks||[]).map(s=>`<div class="card source-card"><span class="badge ${s.type==='verticals'?'cyan':'magenta'}">${esc(s.type)}</span><h3>${esc(s.name)}</h3><p>${esc(s.slides)} slides · fuente semilla de la base de conocimiento.</p></div>`).join('');$('#vendorCount').textContent=`${(K.vendors||[]).length} fabricantes`;$('#knowledgeVendors').innerHTML=(K.vendors||[]).map(v=>`<div class="knowledge-vendor"><img src="${vendorLogo(v.name)}" alt=""><div><strong>${esc(v.name)}</strong><small>${esc(v.area)}</small></div></div>`).join('');}
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
