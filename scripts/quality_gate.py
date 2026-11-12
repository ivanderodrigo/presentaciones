#!/usr/bin/env python3
"""Structural quality gate for Westcon Presentation Builder v5.1."""
from pathlib import Path
import json, sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]

def load(path):
    try:
        return json.loads((ROOT/path).read_text(encoding="utf-8"))
    except Exception as e:
        errors.append(f"{path}: invalid JSON: {e}")
        return {}

knowledge=load("data/knowledge.json")
vendors=knowledge.get("vendors",[])
vendor_names={v.get("name") for v in vendors}
if len(vendors)!=37:
    errors.append(f"knowledge: expected 37 active vendors, found {len(vendors)}")
for required in ["Cloudflare","Sonar (SonarQube)"]:
    if required not in vendor_names:
        errors.append(f"knowledge: missing {required}")
if "Juniper Networks" in vendor_names:
    errors.append("knowledge: Juniper Networks must not be in active portfolio")

vi=load("data/vendor-intelligence.json")
intel=vi.get("vendors",{})
if len(intel)!=37:
    errors.append(f"vendor intelligence: expected 37 active vendors, found {len(intel)}")
for required in ["Cloudflare","Sonar (SonarQube)"]:
    x=intel.get(required,{})
    if not x.get("valueProposition") or len(x.get("approvedAdvantages",[]))<4:
        errors.append(f"{required}: curated slide content incomplete")
if "Juniper Networks" in intel:
    errors.append("vendor intelligence: Juniper Networks must not be active")

logos=load("data/vendor-logo-map.json")
if logos.get("Cloudflare")!="assets/vendors/cloudflare.svg":
    errors.append("Cloudflare logo mapping missing")
if logos.get("Sonar (SonarQube)")!="assets/vendors/sonar.svg":
    errors.append("Sonar logo mapping missing")
for p in ["assets/vendors/cloudflare.svg","assets/vendors/sonar.svg","assets/app-icon.svg"]:
    if not (ROOT/p).exists():
        errors.append(f"missing required asset: {p}")

slides=load("data/slide-index.json").get("slides",[])
if len(slides)!=97:
    errors.append(f"slide index: expected 97 visible/indexed items, found {len(slides)}")
if any("Juniper Networks" in (s.get("vendors") or []) for s in slides):
    errors.append("slide index: Juniper slide must be excluded")
for sid in ["curated-cloudflare","curated-sonar"]:
    if not any(s.get("id")==sid for s in slides):
        errors.append(f"slide index: missing {sid}")

corp=list((ROOT/"assets/source-slides/corporate").glob("slide-*.png"))
vert=list((ROOT/"assets/source-slides/verticals").glob("slide-*.png"))
if len(corp)!=84:
    errors.append(f"corporate assets: expected 84, found {len(corp)}")
if len(vert)!=12:
    errors.append(f"vertical source assets: expected 12, found {len(vert)}")

vc=load("data/vertical-content.json").get("verticals",{})
if len(vc)!=9:
    errors.append(f"vertical content: expected 9 sectors, found {len(vc)}")
models=sum(len(x) for x in vc.values())
if models!=27:
    errors.append(f"vertical content: expected 27 sector/area models, found {models}")
for v in ["Sanidad","Educación","Transporte y logística","Hostelería y turismo","Software y servicios digitales"]:
    if v not in vc:
        errors.append(f"vertical content: missing {v}")
if "Juniper Networks" in json.dumps(vc,ensure_ascii=False):
    errors.append("vertical content: Juniper Networks reference remains")

required=[
    "index.html","builder.css","builder.js","vendor/pptxgen.bundle.js",
    "data/knowledge.js","data/vendor-intelligence.js","data/vendor-logo-map.js",
    "data/slide-index.js","data/vertical-content.js","scripts/research_intelligence.py",
    ".github/workflows/quality.yml",".github/workflows/update-intelligence.yml",".nojekyll"
]
for p in required:
    if not (ROOT/p).exists():
        errors.append(f"missing required file: {p}")

index=(ROOT/"index.html").read_text(encoding="utf-8")
builder=(ROOT/"builder.js").read_text(encoding="utf-8")
if 'rel="icon"' not in index or "assets/app-icon.svg" not in index:
    errors.append("interface: favicon is missing")
if "data/vendor-logo-map.js" not in index:
    errors.append("interface: vendor logo map is not loaded")
if "data-role" in index or "PSM" in index or "VSM" in index or "Solution Architect" in index:
    errors.append("interface: role language still present")

for text in ["searchSlides","themeBlocks","libraryGrid","deckList"]:
    if text not in index:
        errors.append(f"interface: missing {text}")

for fn in [
    "areaBlockItems","vendorSlidesForArea","verticalPages","verticalSectorPages",
    "addVendorSlide","addVerticalContext","addVerticalCases","addVerticalAction","generatePptx"
]:
    if f"function {fn}" not in builder:
        errors.append(f"builder: missing {fn}")

for old in ["vendorStoryModel","vendorProofModel","vendorMarketModel","ROLE_META"]:
    if old in builder:
        errors.append(f"builder: obsolete AI/role logic remains: {old}")

if "Juniper Networks" in builder:
    errors.append("builder: Juniper reference remains")
for required in ["Cloudflare","Sonar (SonarQube)"]:
    if required not in builder:
        errors.append(f"builder: missing curated {required} slide")

if "logoUrl(item.vendor)" not in builder or "await addLogo(s,name" not in builder:
    errors.append("builder: curated vendor slides do not use real logos")
if "areaBlockItems('cyber')" not in builder or "areaBlockItems('network')" not in builder or "areaBlockItems('cloud')" not in builder:
    errors.append("builder: complete solution blocks are missing")
if "9 slides:" not in builder:
    errors.append("builder: complete vertical block should expose 9 slides")
if not all(x in builder for x in ["phase==='context'","phase==='cases'","phase==='action'"]):
    errors.append("builder: vertical three-slide model incomplete")

research=(ROOT/"scripts/research_intelligence.py").read_text(encoding="utf-8")
if '"Cloudflare":"cloudflare.com"' not in research or '"Sonar (SonarQube)":"sonarsource.com"' not in research:
    errors.append("research engine: new vendor official domains missing")
if '"Juniper Networks":"juniper.net"' in research:
    errors.append("research engine: Juniper still active")

print("WESTCON PRESENTATION BUILDER v5.1 · QUALITY GATE")
print(f"Active vendors: {len(vendors)}/37 · Slide index: {len(slides)}/97")
print(f"Corporate assets: {len(corp)}/84 · Source vertical assets: {len(vert)}/12")
print(f"Vertical sectors: {len(vc)}/9 · Vertical models: {models}/27 · Generated vertical pages: {models*3}/81")
for w in warnings:
    print("WARN ·",w)
for e in errors:
    print("ERROR ·",e)
if errors:
    sys.exit(1)
print("OK · visual ad-hoc builder quality gate passed")
