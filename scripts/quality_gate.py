#!/usr/bin/env python3
from pathlib import Path
import json, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]
def load(p):
    try:return json.loads((ROOT/p).read_text(encoding='utf-8'))
    except Exception as e:errors.append(f'{p}: {e}');return {}
vi=load('data/vendor-intelligence.json').get('vendors',{})
slides=load('data/slide-index.json').get('slides',[])
verticals=load('data/vertical-content.json').get('verticals',{})
corp=list((ROOT/'assets/source-slides/corporate').glob('slide-*.png'))
vert=list((ROOT/'assets/source-slides/verticals').glob('slide-*.png'))
if len(vi)!=36:errors.append(f'expected 36 vendors, found {len(vi)}')
if len(slides)!=96:errors.append(f'expected 96 indexed slides, found {len(slides)}')
if len(corp)!=84:errors.append(f'expected 84 corporate assets, found {len(corp)}')
if len(vert)!=12:errors.append(f'expected 12 vertical assets, found {len(vert)}')
if sum(len(x) for x in verticals.values())!=12:errors.append('expected 12 structured vertical combinations')
required=['index.html','styles.css','app.js','CHATGPT.md','vendor/pptxgen.bundle.js','data/knowledge.js','data/vendor-intelligence.js','data/live-intelligence.js','data/slide-index.js','data/vertical-content.js','.github/workflows/update-intelligence.yml','.nojekyll']
for f in required:
    if not (ROOT/f).exists():errors.append('missing '+f)
app=(ROOT/'app.js').read_text(encoding='utf-8')
for marker in ['function suggestDeck','function renderLibrary','function renderDeck','async function generatePptx']:
    if marker not in app:errors.append('missing builder component: '+marker)
html=(ROOT/'index.html').read_text(encoding='utf-8')
for forbidden in ['Reuniones guardadas','Nueva reunión','Base de conocimiento']:
    if forbidden in html:errors.append('legacy meeting-manager UI remains: '+forbidden)
print('WESTCON PRESENTATION BUILDER v3 · QUALITY GATE')
print(f'Vendors {len(vi)}/36 · Slides {len(slides)}/96 · Corporate {len(corp)}/84 · Vertical {len(vert)}/12')
for w in warnings:print('WARN ·',w)
for e in errors:print('ERROR ·',e)
if errors:sys.exit(1)
print('OK · builder structure valid')
