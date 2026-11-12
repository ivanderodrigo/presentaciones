#!/usr/bin/env python3
"""Structural quality gate for Westcon Presentation Builder v5.2."""
from pathlib import Path
import json, sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]

def load(path):
    try:
        return json.loads((ROOT/path).read_text(encoding="utf-8"))
    except Exception as e:
        errors.append(f"{path}: invalid JSON: {e}")
        return {}

knowledge=load("data/knowledge.json")
vendors=knowledge.get("vendors",[])
vendor_by={v.get("name"):v for v in vendors}
if len(vendors)!=37:
    errors.append(f"knowledge: expected 37 active vendors, found {len(vendors)}")
for name in ["Cloudflare","Sonar (SonarQube)"]:
    if name not in vendor_by:
        errors.append(f"knowledge: missing {name}")
    elif vendor_by[name].get("area")!="Ciberseguridad":
        errors.append(f"knowledge: {name} must belong to Ciberseguridad only")
if "Juniper Networks" in vendor_by:
    errors.append("knowledge: Juniper Networks must not be active")

vi=load("data/vendor-intelligence.json").get("vendors",{})
for name in ["Cloudflare","Sonar (SonarQube)"]:
    x=vi.get(name,{})
    if not x.get("valueProposition"):
        errors.append(f"{name}: missing value proposition")
    if len(x.get("approvedAdvantages",[]))!=4:
        errors.append(f"{name}: must expose exactly four client advantages like FY27 vendor cards")

logos=load("data/vendor-logo-map.json")
if logos.get("Cloudflare")!="assets/vendors/cloudflare.svg":
    errors.append("Cloudflare logo mapping missing")
if logos.get("Sonar (SonarQube)")!="assets/vendors/sonar.svg":
    errors.append("Sonar logo mapping missing")
for p in ["assets/vendors/cloudflare.svg","assets/vendors/sonar.svg","favicon.svg","favicon.ico"]:
    if not (ROOT/p).exists():
        errors.append(f"missing required asset: {p}")

slides=load("data/slide-index.json").get("slides",[])
for sid in ["curated-cloudflare","curated-sonar"]:
    found=next((s for s in slides if s.get("id")==sid),None)
    if not found:
        errors.append(f"slide index: missing {sid}")
    elif found.get("area")!="Ciberseguridad":
        errors.append(f"slide index: {sid} must be in Ciberseguridad")
if any("Juniper Networks" in (s.get("vendors") or []) for s in slides):
    errors.append("slide index: Juniper must not be visible")

corp=list((ROOT/"assets/source-slides/corporate").glob("slide-*.png"))
if len(corp)!=84:
    errors.append(f"corporate assets: expected 84, found {len(corp)}")

vc=load("data/vertical-content.json").get("verticals",{})
models=sum(len(x) for x in vc.values())
if len(vc)!=9 or models!=27:
    errors.append(f"vertical content: expected 9 sectors/27 models, found {len(vc)}/{models}")
if "Juniper Networks" in json.dumps(vc,ensure_ascii=False):
    errors.append("vertical content: Juniper reference remains")

index=(ROOT/"index.html").read_text(encoding="utf-8")
builder=(ROOT/"builder.js").read_text(encoding="utf-8")

if "favicon.ico?v=52" not in index or "favicon.svg?v=52" not in index:
    errors.append("interface: versioned ICO/SVG favicon links missing")
if "FY27 · v5.2" not in index:
    errors.append("interface: v5.2 label missing")
if "data-role" in index or "PSM" in index or "VSM" in index:
    errors.append("interface: role language must remain absent")

for fn in ["vendorSlidesForArea","areaBlockItems","verticalItem","verticalSectorItems","addVendorSlide","addVerticalSlide","generatePptx"]:
    if f"function {fn}" not in builder:
        errors.append(f"builder: missing {fn}")
for old in ["verticalPages","verticalPage(","addVerticalContext","addVerticalCases","addVerticalAction","vendorStoryModel","ROLE_META"]:
    if old in builder:
        errors.append(f"builder: obsolete multi-slide/AI logic remains: {old}")

if "OPPORTUNITY_LINES" not in builder or builder.count("['") < 5:
    errors.append("builder: standard five-line partner opportunity block missing")
if "localeCompare(vendorName(b)" not in builder:
    errors.append("builder: vendor miniatures are not sorted alphabetically")
if "Object.keys(CURATED).forEach(function(name){if(area==='cyber')" not in builder:
    errors.append("builder: curated vendors are not confined to Cybersecurity blocks")
if "CÓMO EMPEZAR" not in builder or "IMPACTO ESPERADO" not in builder or "SEÑALES DE OPORTUNIDAD" not in builder:
    errors.append("builder: rich vertical content structure incomplete")
if "await addLogo(s,names[j]" not in builder:
    errors.append("builder: vertical use cases do not render vendor logos")
if "Juniper Networks" in builder:
    errors.append("builder: Juniper reference remains")

print("WESTCON PRESENTATION BUILDER v5.2 · QUALITY GATE")
print(f"Active vendors: {len(vendors)}/37 · Corporate assets: {len(corp)}/84")
print(f"Vertical sectors/models: {len(vc)}/9 · {models}/27")
print("Cloudflare/Sonar: Cybersecurity only · logos required · FY27 vendor-card structure")
for e in errors:
    print("ERROR ·",e)
if errors:
    sys.exit(1)
print("OK · unified visual builder quality gate passed")
