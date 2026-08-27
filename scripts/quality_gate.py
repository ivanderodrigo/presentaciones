#!/usr/bin/env python3
"""Structural and partner-facing quality gate for Westcon Meeting Intelligence v2."""
from pathlib import Path
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[];warnings=[]

def load(name):
    try:return json.loads((ROOT/name).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{name}: invalid JSON: {e}');return {}

vi=load('data/vendor-intelligence.json');vendors=vi.get('vendors',{})
if len(vendors)!=36:errors.append(f'vendor intelligence: expected 36 vendors, found {len(vendors)}')
for name,x in vendors.items():
    if not x.get('valueProposition'):errors.append(f'{name}: missing valueProposition')
    if len(x.get('approvedAdvantages',[]))<3:errors.append(f'{name}: fewer than 3 approvedAdvantages')
    if len(x.get('decisionCriteria',[]))<3:warnings.append(f'{name}: weak decisionCriteria coverage')
    if len(x.get('proofThemes',[]))<3:warnings.append(f'{name}: weak proofThemes coverage')
    if not x.get('researchPlan'):warnings.append(f'{name}: missing researchPlan')

slides=load('data/slide-index.json').get('slides',[])
if len(slides)!=96:errors.append(f'slide index: expected 96 slides, found {len(slides)}')
corp=list((ROOT/'assets/source-slides/corporate').glob('slide-*.png'));vert=list((ROOT/'assets/source-slides/verticals').glob('slide-*.png'))
if len(corp)!=84:errors.append(f'corporate slide assets: expected 84, found {len(corp)}')
if len(vert)!=12:errors.append(f'vertical slide assets: expected 12, found {len(vert)}')

partner=load('data/partner-intelligence.json')
if 'partners' not in partner:errors.append('partner intelligence: missing partners object')

required=['index.html','styles.css','app.js','vendor/pptxgen.bundle.js','data/knowledge.js','data/vendor-intelligence.js','data/live-intelligence.js','data/partner-intelligence.js','data/slide-index.js','scripts/research_intelligence.py','scripts/research_partner.py','.github/workflows/update-intelligence.yml','.github/workflows/research-partner.yml','.nojekyll']
for f in required:
    if not (ROOT/f).exists():errors.append(f'missing required file: {f}')

app=(ROOT/'app.js').read_text(encoding='utf-8')
if 'function directorPlan' not in app:errors.append('Presentation Director missing')
if 'function partnerProfile' not in app:errors.append('Partner Intelligence synthesis missing')
if 'savePartnerOutcome' not in app:errors.append('Meeting memory missing')
gen=app[app.find('async function generatePptx'):app.find('// ---------- Knowledge / panels ----------')]
for phrase in ['CÓMO VENDER','PSM · PARTNER','PSM · EVOLUCIÓN','VSM · PIPELINE','SOLUTION ARCHITECT ·','WHITESPACE','SCORING INTERNO']:
    if phrase in gen.upper():errors.append(f'partner-facing generator contains prohibited visible/internal phrase: {phrase}')
# Internal playbooks and 'mensajes clave' contain presenter instructions and must not be inserted into partner-facing output.
if re.search(r"addOriginal\('corporate',\s*x\.(playbook|message)",gen):errors.append('partner-facing generator inserts internal playbook/message slides')

live=load('data/live-intelligence.json');coverage=sum(1 for x in live.get('vendors',{}).values() if x.get('evidence'))
if coverage<36:warnings.append(f'public evidence cache currently covers {coverage}/36 vendors; runtime research + scheduled refresh will fill gaps')

print('WESTCON MEETING INTELLIGENCE v2 · QUALITY GATE')
print(f'Vendor intelligence: {len(vendors)}/36 · Slide index: {len(slides)}/96')
print(f'Corporate assets: {len(corp)}/84 · Vertical assets: {len(vert)}/12')
print(f'Public evidence cache: {coverage}/36 vendors with evidence · Shared partner dossiers: {len(partner.get("partners",{}))}')
for w in warnings:print('WARN ·',w)
for e in errors:print('ERROR ·',e)
if errors:sys.exit(1)
print('OK · structural and partner-facing quality gate passed')
