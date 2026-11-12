#!/usr/bin/env python3
"""Structural quality gate for Westcon Presentation Builder v5.3."""
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
        errors.append(f"{name}: must expose exactly four client advantages")

logos=load("data/vendor-logo-map.json")
for name,path in {
    "Cloudflare":"assets/vendors/cloudflare.svg",
    "Sonar (SonarQube)":"assets/vendors/sonar.svg",
}.items():
    if logos.get(name)!=path:
        errors.append(f"{name}: logo mapping missing")
    if not (ROOT/path).exists():
        errors.append(f"missing required asset: {path}")

for p in ["favicon.svg","favicon.ico"]:
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
css=(ROOT/"builder.css").read_text(encoding="utf-8")

if "favicon.ico?v=53" not in index or "favicon.svg?v=53" not in index:
    errors.append("interface: versioned ICO/SVG favicon links missing")
if "FY27 · v5.3" not in index:
    errors.append("interface: v5.3 label missing")
if "data-role" in index or "PSM" in index or "VSM" in index:
    errors.append("interface: role language must remain absent")

for fn in [
    "vendorSlidesForArea","verticalAreaItems","areaBlockItems","presentationOrder",
    "sourceOverlayHtml","patchSourceSlide","addVendorSlide","addVerticalSlide","generatePptx"
]:
    if f"function {fn}" not in builder and f"async function {fn}" not in builder:
        errors.append(f"builder: missing {fn}")

for old in ["verticalPages","addVerticalContext","addVerticalCases","addVerticalAction","vendorStoryModel","ROLE_META"]:
    if old in builder:
        errors.append(f"builder: obsolete logic remains: {old}")

# Exact FY27 vendor-card clone invariants
for token in [
    "fontFace:'Corbel'","x:sc(.35),y:sc(.20)","x:sc(.25),y:sc(.62)",
    "x:sc(4.0),y:sc(.15)","x:sc(.20),y:sc(3.05)","OPPORTUNITY_LINES"
]:
    if token not in builder:
        errors.append(f"builder: FY27 vendor-card clone invariant missing: {token}")

# Source slide patching: portfolio + cyber taxonomy + networking taxonomy
for token in [
    "Number(page)===5","Number(page)===7","Number(page)===39",
    "Cloudflare","Sonar (SonarQube)","cyber-sase","cyber-apps"
]:
    if token not in builder:
        errors.append(f"builder: source slide patch missing: {token}")

# Narrative order and vertical placement
if "presentationOrder" not in builder or "verticalAreaItems(area)" not in builder:
    errors.append("builder: original-deck narrative ordering is missing")
if "return overviewItems(area).concat(vendorSlidesForArea(area)).concat(verticalAreaItems(area))" not in builder:
    errors.append("builder: verticals must close each solution block")

# Vertical playbook clone invariants
for token in [
    "PLAYBOOK SECTORIAL","ABRE CON","FABRICANTES CLAVE","SEÑALES DE OPORTUNIDAD",
    "QUICK WINS","POR QUÉ GANAMOS","SIGUIENTE PASO","await addLogo(s,names[j]"
]:
    if token not in builder:
        errors.append(f"builder: FY27 vertical playbook invariant missing: {token}")

if "vendorName(a).localeCompare" not in builder:
    errors.append("builder: vendor miniatures are not alphabetically ordered")
if "Juniper Networks" in builder:
    errors.append("builder: Juniper reference remains")

for css_token in [
    ".vendor-fy27",".vertical-fy27",".portfolio-new-card",".taxonomy-patch",
    "font-family:Corbel"
]:
    if css_token not in css:
        errors.append(f"css: missing visual invariant {css_token}")

print("WESTCON PRESENTATION BUILDER v5.3 · QUALITY GATE")
print(f"Active vendors: {len(vendors)}/37 · Corporate assets: {len(corp)}/84")
print(f"Vertical sectors/models: {len(vc)}/9 · {models}/27")
print("Cloudflare/Sonar: exact FY27-card geometry · Cybersecurity only · alphabetical order")
print("Portfolio/taxonomy: patched without replacing original layouts")
print("Verticals: FY27 sector-playbook geometry · one rich slide per sector/area")
for e in errors:
    print("ERROR ·",e)
if errors:
    sys.exit(1)
print("OK · v5.3 unified visual/narrative quality gate passed")
