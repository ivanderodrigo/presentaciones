#!/usr/bin/env python3
"""Structural and portfolio quality gate for Westcon Presentation Builder v5.4."""
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
    if len(x.get("headline",""))>34:
        errors.append(f"{name}: headline too long for exact FY27 card")
    if len(x.get("tagline",""))>72:
        errors.append(f"{name}: tagline too long for exact FY27 card")
    if len(x.get("valueProposition",""))>245:
        errors.append(f"{name}: value proposition too long for exact FY27 card")
    for adv in x.get("approvedAdvantages",[]):
        if len(adv)>88:
            errors.append(f"{name}: advantage too long for exact FY27 card: {adv[:35]}...")

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

# Master taxonomy: every active vendor must be represented in each area it belongs to.
taxonomy=load("data/taxonomy.json")
areas=taxonomy.get("areas",{})
if set(areas)!={"cyber","network","cloud"}:
    errors.append(f"taxonomy: expected cyber/network/cloud, found {sorted(areas)}")

def area_members(area):
    out=set()
    for v in vendors:
        a=(v.get("area") or "").lower()
        if area=="cyber" and "ciberseguridad" in a: out.add(v["name"])
        if area=="network" and "networking" in a: out.add(v["name"])
        if area=="cloud" and ("cloud" in a or "automatización" in a or "uc" in a): out.add(v["name"])
    return out

banned_category_terms=["servicios","lifecycle","preventa","financiación","support","soporte westcon"]
for area,data in areas.items():
    cards=data.get("cards",[])
    covered=set()
    for card in cards:
        title=(card.get("title") or "").lower()
        if any(term in title for term in banned_category_terms):
            errors.append(f"taxonomy {area}: service-led category is not allowed: {card.get('title')}")
        for name in card.get("vendors",[]):
            if name not in vendor_by:
                errors.append(f"taxonomy {area}: unknown/inactive vendor {name}")
            covered.add(name)
    expected=area_members(area)
    missing=sorted(expected-covered)
    if missing:
        errors.append(f"taxonomy {area}: active vendors missing: {', '.join(missing)}")

vc=load("data/vertical-content.json").get("verticals",{})
models=sum(len(x) for x in vc.values())
if len(vc)!=9 or models!=27:
    errors.append(f"vertical content: expected 9 sectors/27 models, found {len(vc)}/{models}")
if "Juniper Networks" in json.dumps(vc,ensure_ascii=False):
    errors.append("vertical content: Juniper reference remains")
for vertical,area_models in vc.items():
    for area,model in area_models.items():
        if len(model.get("why",[]))<3:
            errors.append(f"vertical {vertical}/{area}: fewer than 3 opportunity signals")
        if len(model.get("cases",[]))<4 or len(model.get("solutions",[]))<4:
            errors.append(f"vertical {vertical}/{area}: needs 4 use cases and 4 solution mappings")
        if len(model.get("start",[]))<3:
            errors.append(f"vertical {vertical}/{area}: needs 3 quick wins")
        if not model.get("nextStep"):
            errors.append(f"vertical {vertical}/{area}: next step missing")

index=(ROOT/"index.html").read_text(encoding="utf-8")
builder=(ROOT/"builder.js").read_text(encoding="utf-8")
css=(ROOT/"builder.css").read_text(encoding="utf-8")

if "data/taxonomy.js" not in index:
    errors.append("interface: taxonomy.js is not loaded")
if "favicon.ico?v=54" not in index or "favicon.svg?v=54" not in index:
    errors.append("interface: versioned v5.4 favicon links missing")
if "FY27 · v5.4" not in index:
    errors.append("interface: v5.4 label missing")
if "data-role" in index or "PSM" in index or "VSM" in index:
    errors.append("interface: role language must remain absent")

for fn in [
    "vendorSlidesForArea","verticalAreaItems","areaBlockItems","presentationOrder",
    "portfolioHtml","taxonomyHtml","specialSourceHtml","addPortfolioSlide",
    "addTaxonomySlide","addVendorSlide","addVerticalSlide","generatePptx"
]:
    if f"function {fn}" not in builder and f"async function {fn}" not in builder:
        errors.append(f"builder: missing {fn}")

for obsolete in [
    "sourceOverlayHtml","patchSourceSlide","portfolio-hide-juniper",
    "vendorStoryModel","ROLE_META","addVerticalContext","addVerticalCases","addVerticalAction"
]:
    if obsolete in builder:
        errors.append(f"builder: obsolete patch/AI logic remains: {obsolete}")

# Exact FY27 manufacturer card geometry + editorial budgets.
for token in [
    "fontFace:'Corbel'","x:sc(.35),y:sc(.20)","x:sc(.25),y:sc(.62)",
    "x:sc(4.0),y:sc(.15)","x:sc(.20),y:sc(3.05)","OPPORTUNITY_LINES"
]:
    if token not in builder:
        errors.append(f"builder: FY27 vendor-card clone invariant missing: {token}")

# Clean native portfolio/taxonomies.
for token in ["addPortfolioSlide","vendorNamesForArea('cyber')","addTaxonomySlide('cyber')","addTaxonomySlide('network')","addTaxonomySlide('cloud')"]:
    if token not in builder:
        errors.append(f"builder: native portfolio/taxonomy invariant missing: {token}")

# Narrative order.
if "presentationOrder" not in builder:
    errors.append("builder: original-deck narrative ordering is missing")
if "return overviewItems(area).concat(vendorSlidesForArea(area)).concat(verticalAreaItems(area))" not in builder:
    errors.append("builder: verticals must close each solution block")
if "vendorName(a).localeCompare" not in builder:
    errors.append("builder: manufacturer miniatures are not alphabetically ordered")

# Vertical playbook clone with controlled title sizing and two large manufacturer logos.
for token in [
    "VERTICAL_TITLE","VERTICAL_QUESTION","verticalMeta","verticalQuestionFor",
    "PLAYBOOK SECTORIAL","ABRE CON","FABRICANTES CLAVE","SEÑALES DE OPORTUNIDAD",
    "QUICK WINS","POR QUÉ GANAMOS","SIGUIENTE PASO","slice(0,2)"
]:
    if token not in builder:
        errors.append(f"builder: vertical playbook invariant missing: {token}")

if "Juniper Networks" in builder:
    errors.append("builder: Juniper reference remains")

for css_token in [
    ".vendor-fy27",".vertical-fy27",".special-portfolio",".special-taxonomy",
    "font-family:Corbel",".sp-logo-grid.cyber",".tax-grid.count-7"
]:
    if css_token not in css:
        errors.append(f"css: missing visual invariant {css_token}")

print("WESTCON PRESENTATION BUILDER v5.4 · QUALITY GATE")
print(f"Active vendors: {len(vendors)}/37 · Corporate assets: {len(corp)}/84")
print(f"Taxonomy: Cyber {len(areas.get('cyber',{}).get('cards',[]))} · Networking {len(areas.get('network',{}).get('cards',[]))} · Cloud {len(areas.get('cloud',{}).get('cards',[]))}")
print(f"Vertical sectors/models: {len(vc)}/9 · {models}/27")
print("Cloudflare/Sonar: FY27 card geometry + strict text budgets")
print("Portfolio/taxonomies: native, no screenshot patches; full active-vendor coverage")
print("Verticals: FY27 playbook grid + sector title sizing + max 2 large logos/use case")
for e in errors:
    print("ERROR ·",e)
if errors:
    sys.exit(1)
print("OK · v5.4 portfolio/visual quality gate passed")
