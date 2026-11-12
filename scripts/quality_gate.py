#!/usr/bin/env python3
"""Structural and partner-facing quality gate for Westcon Presentation Studio v4."""
from pathlib import Path
import json, re, sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]

def load(name):
    try:
        return json.loads((ROOT/name).read_text(encoding='utf-8'))
    except Exception as e:
        errors.append(f'{name}: invalid JSON: {e}')
        return {}

vi=load('data/vendor-intelligence.json')
vendors=vi.get('vendors',{})
if len(vendors)!=36:
    errors.append(f'vendor intelligence: expected 36 vendors, found {len(vendors)}')
for name,x in vendors.items():
    if not x.get('valueProposition'):
        errors.append(f'{name}: missing valueProposition')
    if len(x.get('approvedAdvantages',[]))<3:
        errors.append(f'{name}: fewer than 3 approvedAdvantages')
    if len(x.get('decisionCriteria',[]))<3:
        warnings.append(f'{name}: weak decisionCriteria coverage')
    if len(x.get('proofThemes',[]))<3:
        warnings.append(f'{name}: weak proofThemes coverage')

slides=load('data/slide-index.json').get('slides',[])
if len(slides)!=96:
    errors.append(f'slide index: expected 96 slides, found {len(slides)}')

corp=list((ROOT/'assets/source-slides/corporate').glob('slide-*.png'))
vert=list((ROOT/'assets/source-slides/verticals').glob('slide-*.png'))
if len(corp)!=84:
    errors.append(f'corporate slide assets: expected 84, found {len(corp)}')
if len(vert)!=12:
    errors.append(f'vertical slide assets: expected 12, found {len(vert)}')

vertical_content=load('data/vertical-content.json').get('verticals',{})
vertical_count=sum(len(v) for v in vertical_content.values())
if vertical_count!=12:
    errors.append(f'vertical content: expected 12 combinations, found {vertical_count}')

partner=load('data/partner-intelligence.json')
if 'partners' not in partner:
    errors.append('partner intelligence: missing partners object')

required=[
    'index.html','builder.css','builder.js','vendor/pptxgen.bundle.js',
    'data/knowledge.js','data/vendor-intelligence.js','data/live-intelligence.js',
    'data/partner-intelligence.js','data/slide-index.js','data/vertical-content.js',
    'scripts/research_intelligence.py','scripts/research_partner.py',
    '.github/workflows/update-intelligence.yml','.github/workflows/research-partner.yml',
    '.github/workflows/quality.yml','.nojekyll'
]
for f in required:
    if not (ROOT/f).exists():
        errors.append(f'missing required file: {f}')

index=(ROOT/'index.html').read_text(encoding='utf-8')
if 'builder.js' not in index or 'builder.css' not in index:
    errors.append('index.html does not load Presentation Studio assets')

builder=(ROOT/'builder.js').read_text(encoding='utf-8')
for fn in ['vendorStoryModel','vendorProofModel','renderContextImpact','renderQuickBlocks','openPreview','proposeDeck','generatePptx']:
    if f'function {fn}' not in builder:
        errors.append(f'Presentation Studio missing {fn}')

if "density>=8" not in builder or "density>=9" not in builder:
    errors.append('generated-slide content density gates are missing')

if 'ROLE_META' not in builder or 'VERTICAL_META' not in builder:
    errors.append('role/vertical explanatory logic missing')

gen=builder[builder.find('async function generatePptx'):]
for phrase in ['CÓMO VENDER','WHITESPACE','SCORING INTERNO','RESEARCH PENDING','COLA DE BÚSQUEDAS']:
    if phrase in gen.upper():
        errors.append(f'partner-facing generator contains prohibited internal phrase: {phrase}')

if re.search(r"sourceByPage\((?:6[0-9]|70|71|72)\)", builder):
    warnings.append('review any hard-coded sector/playbook page added to a partner-facing deck')

live=load('data/live-intelligence.json')
coverage=sum(1 for x in live.get('vendors',{}).values() if x.get('evidence'))
if coverage<20:
    warnings.append(f'public evidence cache currently covers {coverage}/36 vendors; scheduled refresh can improve this')

print('WESTCON PRESENTATION STUDIO v4 · QUALITY GATE')
print(f'Vendor intelligence: {len(vendors)}/36 · Slide index: {len(slides)}/96')
print(f'Corporate assets: {len(corp)}/84 · Vertical assets: {len(vert)}/12 · Vertical models: {vertical_count}/12')
print(f'Public evidence cache: {coverage}/36 vendors · Shared partner dossiers: {len(partner.get("partners",{}))}')
for w in warnings:
    print('WARN ·',w)
for e in errors:
    print('ERROR ·',e)
if errors:
    sys.exit(1)
print('OK · structural and partner-facing quality gate passed')
