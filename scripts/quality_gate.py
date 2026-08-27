#!/usr/bin/env python3
"""Structural quality gate for the GitHub Pages build."""
from pathlib import Path
import json, re, sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]

def need(cond,msg):
    (errors if not cond else []).append(msg) if not cond else None

def load(name):
    try:return json.loads((ROOT/name).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{name}: invalid JSON: {e}');return {}

vi=load('data/vendor-intelligence.json')
vendors=vi.get('vendors',{})
if len(vendors)!=36:errors.append(f'vendor intelligence: expected 36 vendors, found {len(vendors)}')
for name,x in vendors.items():
    if not x.get('valueProposition'): errors.append(f'{name}: missing valueProposition')
    if len(x.get('approvedAdvantages',[]))<3: errors.append(f'{name}: fewer than 3 approvedAdvantages')
    if len(x.get('buyingTriggers',[]))<2: warnings.append(f'{name}: weak buyingTriggers coverage')
    if not x.get('sourceSlides'): warnings.append(f'{name}: no sourceSlides mapping')

corp=list((ROOT/'assets/source-slides/corporate').glob('slide-*.png'))
vert=list((ROOT/'assets/source-slides/verticals').glob('slide-*.png'))
if len(corp)!=84: errors.append(f'corporate slide assets: expected 84, found {len(corp)}')
if len(vert)!=12: errors.append(f'vertical slide assets: expected 12, found {len(vert)}')

for f in ['index.html','styles.css','app.js','vendor/pptxgen.bundle.js','data/knowledge.js','data/vendor-intelligence.js','data/live-intelligence.js','.nojekyll']:
    if not (ROOT/f).exists():errors.append(f'missing required file: {f}')

app=(ROOT/'app.js').read_text(encoding='utf-8')
gen=app[app.find('async function generatePptx'):app.find('// ---------- Knowledge / panels ----------')]
for phrase in ['CÓMO VENDER','PSM · PARTNER','PSM · EVOLUCIÓN','VSM · PIPELINE','SOLUTION ARCHITECT ·','WHITESPACE','SCORING INTERNO']:
    if phrase in gen.upper():errors.append(f'partner-facing generator contains prohibited visible/internal phrase: {phrase}')

live=load('data/live-intelligence.json')
coverage=sum(1 for x in live.get('vendors',{}).values() if x.get('evidence'))
if coverage<36:warnings.append(f'public evidence cache currently covers {coverage}/36 vendors; runtime research + scheduled refresh will fill gaps')

print('WESTCON MEETING INTELLIGENCE · QUALITY GATE')
print(f'Vendor intelligence: {len(vendors)}/36')
print(f'Corporate assets: {len(corp)}/84 · Vertical assets: {len(vert)}/12')
print(f'Public evidence cache: {coverage}/36 vendors with evidence')
for w in warnings: print('WARN ·',w)
for e in errors: print('ERROR ·',e)
if errors:sys.exit(1)
print('OK · structural quality gate passed')
