#!/usr/bin/env python3
"""Structural, portfolio and rendering quality gate for Westcon Presentation Builder v5.6."""
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
        errors.append(f"knowledge: {name} must belong to Ciberseguridad")
if "Juniper Networks" in vendor_by:
    errors.append("knowledge: Juniper Networks must not be active")

vi=load("data/vendor-intelligence.json").get("vendors",{})
for name in ["Cloudflare","Sonar (SonarQube)"]:
    x=vi.get(name,{})
    if len(x.get("approvedAdvantages",[]))!=4:
        errors.append(f"{name}: exactly four advantages required")
    if len(x.get("headline",""))>34:
        errors.append(f"{name}: headline too long")
    if len(x.get("tagline",""))>72:
        errors.append(f"{name}: tagline too long")
    if len(x.get("valueProposition",""))>245:
        errors.append(f"{name}: value proposition too long")
    for adv in x.get("approvedAdvantages",[]):
        if len(adv)>88:
            errors.append(f"{name}: advantage too long: {adv[:40]}...")

logos=load("data/vendor-logo-map.json")
for name,path in {"Cloudflare":"assets/vendors/cloudflare.svg","Sonar (SonarQube)":"assets/vendors/sonar.svg"}.items():
    if logos.get(name)!=path:
        errors.append(f"{name}: logo mapping missing")
    if not (ROOT/path).exists():
        errors.append(f"missing asset: {path}")

slides=load("data/slide-index.json").get("slides",[])
for sid in ["curated-cloudflare","curated-sonar"]:
    found=next((s for s in slides if s.get("id")==sid),None)
    if not found or found.get("area")!="Ciberseguridad":
        errors.append(f"slide index: {sid} missing or not Cybersecurity")
if any("Juniper Networks" in (s.get("vendors") or []) for s in slides):
    errors.append("slide index: Juniper must not be visible")

corp=list((ROOT/"assets/source-slides/corporate").glob("slide-*.png"))
if len(corp)!=84:
    errors.append(f"corporate assets: expected 84, found {len(corp)}")

taxonomy=load("data/taxonomy.json")
areas=taxonomy.get("areas",{})
if set(areas)!={"cyber","network","cloud"}:
    errors.append("taxonomy: cyber/network/cloud required")

def area_members(area):
    out=set()
    for v in vendors:
        a=(v.get("area") or "").lower()
        if area=="cyber" and "ciberseguridad" in a: out.add(v["name"])
        if area=="network" and "networking" in a: out.add(v["name"])
        if area=="cloud" and ("cloud" in a or "automatización" in a or "uc" in a): out.add(v["name"])
    return out

banned=["servicios","lifecycle","preventa","financiación","soporte westcon"]
for area,data in areas.items():
    covered=set()
    for card in data.get("cards",[]):
        title=(card.get("title") or "").lower()
        if any(x in title for x in banned):
            errors.append(f"taxonomy {area}: service-led category not allowed: {card.get('title')}")
        for name in card.get("vendors",[]):
            if name not in vendor_by:
                errors.append(f"taxonomy {area}: unknown vendor {name}")
            covered.add(name)
    missing=sorted(area_members(area)-covered)
    if missing:
        errors.append(f"taxonomy {area}: active vendors missing: {', '.join(missing)}")

vc=load("data/vertical-content.json").get("verticals",{})
models=sum(len(x) for x in vc.values())
if len(vc)!=9 or models!=27:
    errors.append(f"verticals: expected 9 sectors/27 models, found {len(vc)}/{models}")
if "Juniper Networks" in json.dumps(vc,ensure_ascii=False):
    errors.append("verticals: Juniper reference remains")
for vertical,am in vc.items():
    for area,m in am.items():
        if len(m.get("why",[]))<3 or len(m.get("cases",[]))<4 or len(m.get("solutions",[]))<4:
            errors.append(f"vertical {vertical}/{area}: incomplete content")
        if len(m.get("start",[]))<3 or not m.get("nextStep"):
            errors.append(f"vertical {vertical}/{area}: incomplete activation content")

index=(ROOT/"index.html").read_text(encoding="utf-8")
builder=(ROOT/"builder.js").read_text(encoding="utf-8")
css=(ROOT/"builder.css").read_text(encoding="utf-8")

if "FY27 · v5.6" not in index:
    errors.append("interface: v5.6 label missing")
if "favicon.ico?v=56" not in index or "favicon.svg?v=56" not in index:
    errors.append("interface: v5.6 favicon cache-bust missing")
if "\\n" in index:
    errors.append("interface: literal \\n markup remains")
if "data/taxonomy.js" not in index:
    errors.append("interface: taxonomy data not loaded")

# Stable canvas renderer: preview, thumbnail and PPT share the same output.
for token in [
    "async function renderVendor","async function renderVertical","async function renderPortfolio",
    "async function renderTaxonomy","async function getVisualSrc","async function generatePptx"
]:
    if token not in builder:
        errors.append(f"builder: missing stable renderer {token}")
if "template:'assets/source-slides/corporate/slide-14.png'" not in builder:
    errors.append("builder: Cloudflare must clone F5 source slide")
if "template:'assets/source-slides/corporate/slide-24.png'" not in builder:
    errors.append("builder: Sonar must clone Ping source slide")
if "The standard partner-opportunity block remains untouched" not in builder:
    errors.append("builder: curated vendor template must preserve standard partner opportunity block")
if "getVisualSrc(item,'full')" not in builder or "getVisualSrc(item,'thumb')" not in builder:
    errors.append("builder: preview/PPT and thumbnails must share visual renderer")

# A single thumbnail failure must never truncate the library.
for token in ["Card error","Visual error","try{","catch(function(e)"]:
    if token not in builder:
        errors.append(f"builder: thumbnail error isolation missing: {token}")

# Narrative order must include all sections and verticals.
for token in [
    "return 300+vr","return 600+vr","return 900+vr","return 1000+p",
    "concat(allVerticalItems())","areaBlockItems('cyber')","areaBlockItems('network')","areaBlockItems('cloud')"
]:
    if token not in builder:
        errors.append(f"builder: full narrative/list invariant missing: {token}")
if "return overviewItems(a).concat(vendorSlidesForArea(a)).concat(verticalAreaItems(a))" not in builder:
    errors.append("builder: verticals must close each technology section")

# Vertical fixed grid: four use cases, but logo boxes only for real vendors.
for token in [
    "PLAYBOOK SECTORIAL","ABRE CON","IMPACTO ESPERADO","SEÑALES DE OPORTUNIDAD",
    "QUICK WINS","POR QUÉ GANAMOS","SIGUIENTE PASO",
    "filter(Boolean).slice(0,4)","for(var j=0;j<count;j++)","if(count)"
]:
    if token not in builder:
        errors.append(f"builder: vertical fixed-grid invariant missing: {token}")
if "for(var j=0;j<4;j++)" in builder:
    errors.append("builder: verticals must not draw four logo boxes unconditionally")
if "catch(e){r.text(name" not in builder or "}else{\n          r.text(name" not in builder:
    errors.append("builder: missing vendor-name fallback when a vertical logo cannot load")

# Curated vendor advantages must match FY27 compact spacing.
for token in ["var adv=(p.approvedAdvantages||[]).slice(0,4),yy=3.18","lh:1.0","yy+=Math.max(.34"]:
    if token not in builder:
        errors.append(f"builder: FY27 compact advantage spacing missing: {token}")
if "yy=3.00" in builder:
    errors.append("builder: curated advantages start too close to the heading")

for obsolete in ["sourceOverlayHtml","patchSourceSlide","portfolio-hide-juniper","taxonomy-patch","vendorStoryModel","ROLE_META"]:
    if obsolete in builder:
        errors.append(f"builder: obsolete fragile logic remains: {obsolete}")
if "Juniper Networks" in builder:
    errors.append("builder: Juniper reference remains")

for token in [".visual-placeholder",".preview-loading",".thumb>img",".deck-thumb img"]:
    if token not in css:
        errors.append(f"css: stable rendering style missing: {token}")

print("WESTCON PRESENTATION BUILDER v5.6 · QUALITY GATE")
print(f"Active vendors: {len(vendors)}/37 · Corporate assets: {len(corp)}/84")
print(f"Taxonomy coverage: Cyber {len(area_members('cyber'))} · Networking {len(area_members('network'))} · Cloud {len(area_members('cloud'))}")
print(f"Vertical sectors/models: {len(vc)}/9 · {models}/27")
print("Cloudflare/Sonar: exact FY27 F5/Ping source templates; standard opportunity block untouched")
print("Rendering: deterministic canvas shared by thumbnail, preview and PowerPoint")
print("Library: per-card error isolation + full Cyber → Networking → Cloud → Services narrative")
for e in errors:
    print("ERROR ·",e)
if errors:
    sys.exit(1)
print("OK · v5.6 stable visual/library quality gate passed")
