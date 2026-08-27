#!/usr/bin/env python3
"""Westcon Meeting Intelligence · public evidence refresh (v2.0).

Deep, free, fail-soft research for every vendor in the FY27 portfolio.
The output is safe to publish in GitHub Pages: public titles, sources, dates,
URLs, evidence class and an authority score. No private business data is read.

Discovery layers per vendor:
  1) GDELT DOC 2.0 (current media/web discovery)
  2) Google News RSS (independent discovery path)
  3) Official vendor sitemap + a small number of relevant official pages
  4) Prior cache fallback when any public source is unavailable

Evidence policy:
  * never infer an analyst position from mere inclusion in a report;
  * preserve source/date/URL;
  * prefer analyst-direct, vendor-official and specialist media;
  * deduplicate aggressively;
  * keep the process running when individual sources fail.
"""
from __future__ import annotations

import concurrent.futures as cf
import html
import gzip
import json
import os
import re
import ssl
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VENDOR_FILE = ROOT / "data/vendor-intelligence.json"
OUT_JSON = ROOT / "data/live-intelligence.json"
OUT_JS = ROOT / "data/live-intelligence.js"
UA = "Mozilla/5.0 (compatible; WestconMeetingIntelligence/2.0; +https://github.com/)"
CTX = ssl.create_default_context()

ANALYSTS = ["Gartner", "Forrester", "IDC", "Omdia", "GigaOm", "ISG", "Canalys", "KuppingerCole"]
ANALYST_DOMAINS = {
    "gartner.com": "Gartner", "forrester.com": "Forrester", "idc.com": "IDC",
    "omdia.tech.informa.com": "Omdia", "omdia.tech": "Omdia", "gigaom.com": "GigaOm",
    "isg-one.com": "ISG", "canalys.com": "Canalys", "kuppingercole.com": "KuppingerCole",
}
TRUSTED_MEDIA = {
    # Global enterprise / channel / infrastructure
    "crn.com", "theregister.com", "techtarget.com", "computerweekly.com", "sdxcentral.com",
    "siliconangle.com", "venturebeat.com", "darkreading.com", "securityweek.com",
    "helpnetsecurity.com", "networkworld.com", "cio.com", "techradar.com",
    "infosecurity-magazine.com", "scmagazine.com", "channelweb.co.uk", "channelfutures.com",
    "techrepublic.com", "zdnet.com", "blocksandfiles.com", "lightreading.com", "rcrwireless.com",
    "networkcomputing.com", "datacenterdynamics.com", "packetpushers.net", "thefastmode.com",
    # Iberia technology / business signals
    "computing.es", "computerworld.es", "redestelecom.es", "channelpartner.es", "muycomputerpro.com",
    "ituser.es", "revistabyte.es", "expansion.com", "eleconomista.es", "cincodias.elpais.com",
}
OFFICIAL_DOMAINS = {
    "Anomali":"anomali.com","AttackIQ":"attackiq.com","Certes Networks":"certesnetworks.com","Cisco":"cisco.com",
    "Claroty":"claroty.com","CrowdStrike":"crowdstrike.com","F5":"f5.com","FireMon":"firemon.com",
    "Fortanix":"fortanix.com","Ivanti":"ivanti.com","LevelBlue":"levelblue.com","Menlo Security":"menlosecurity.com",
    "NETSCOUT":"netscout.com","Noname / Akamai API Security":"akamai.com","Okta":"okta.com",
    "Palo Alto Networks":"paloaltonetworks.com","Ping Identity":"pingidentity.com","Proofpoint":"proofpoint.com",
    "Vectra AI":"vectra.ai","XM Cyber":"xmcyber.com","Zscaler":"zscaler.com","1Password":"1password.com",
    "Ciena":"ciena.com","EfficientIP":"efficientip.com","Ericsson":"ericsson.com","Extreme Networks":"extremenetworks.com",
    "Juniper Networks":"juniper.net","Nokia":"nokia.com","Ruckus Networks":"ruckusnetworks.com","Weblib":"weblib.fr",
    "AudioCodes":"audiocodes.com","Avaya":"avaya.com","AWS":"aws.amazon.com","Microsoft":"microsoft.com",
    "Penguin Solutions":"penguinsolutions.com","UiPath":"uipath.com",
}

QUERY_FAMILIES = {
    "analyst": '(Gartner OR Forrester OR "IDC MarketScape" OR Omdia OR GigaOm OR ISG OR Canalys OR KuppingerCole OR "Magic Quadrant" OR "Forrester Wave")',
    "cases": '(customer OR "case study" OR "success story" OR deployment OR reference OR "customer story")',
    "market": '(innovation OR launch OR acquisition OR partnership OR award OR expansion OR roadmap OR strategy OR investment)',
    "marketshare": '("market share" OR revenue OR growth OR adoption OR installed-base OR momentum)',
    "channel": '("partner program" OR channel OR certification OR specialization OR incentive OR MDF OR rebate OR enablement OR distributor)',
    "technology": '(architecture OR integration OR benchmark OR interoperability OR deployment OR platform OR performance OR "reference design" OR scalability)',
    "competitive": '(competitor OR comparison OR versus OR alternative OR migration OR differentiation OR replacement)',
    "trust": '(reliability OR resilience OR security OR vulnerability OR outage OR incident OR compliance)',
}


def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def fetch(url: str, timeout: int = 15, accept: str = "*/*") -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        return r.read()


def clean_text(s: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


def pubdate(s: str) -> str:
    if not s:
        return ""
    try:
        return parsedate_to_datetime(s).astimezone(timezone.utc).isoformat()
    except Exception:
        # GDELT often uses YYYYMMDDTHHMMSSZ
        try:
            return datetime.strptime(s, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc).isoformat()
        except Exception:
            return s


def host(url: str) -> str:
    try:
        return urllib.parse.urlparse(url).hostname.lower().removeprefix("www.")
    except Exception:
        return ""


def google_news(query: str, limit: int = 14) -> list[dict]:
    q = urllib.parse.quote(query)
    url = f"https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en"
    root = ET.fromstring(fetch(url, accept="application/rss+xml,application/xml,text/xml,*/*"))
    out = []
    for item in root.findall(".//item")[:limit]:
        src = item.find("source")
        out.append({
            "title": clean_text(item.findtext("title") or ""),
            "url": (item.findtext("link") or "").strip(),
            "publisher": clean_text(src.text if src is not None and src.text else ""),
            "publishedAt": pubdate(item.findtext("pubDate") or ""),
            "discovery": "google-news-rss",
        })
    return [x for x in out if x["title"] and x["url"]]


def gdelt(query: str, days: int = 180, limit: int = 45) -> list[dict]:
    timespan = "1m" if days <= 30 else "3m" if days <= 120 else "1y"
    params = urllib.parse.urlencode({"query": query, "mode": "artlist", "format": "json", "sort": "datedesc", "maxrecords": limit, "timespan": timespan})
    data = json.loads(fetch("https://api.gdeltproject.org/api/v2/doc/doc?" + params, accept="application/json").decode("utf-8", "replace"))
    rows = data.get("articles") or data.get("items") or []
    out = []
    for a in rows:
        out.append({
            "title": clean_text(a.get("title") or a.get("name") or ""),
            "url": a.get("url") or a.get("link") or "",
            "publisher": a.get("domain") or a.get("source") or "",
            "publishedAt": pubdate(a.get("seendate") or a.get("date") or a.get("publishedAt") or ""),
            "discovery": "gdelt-doc-2",
        })
    return [x for x in out if x["title"] and x["url"]]


def xml_locs(data: bytes) -> tuple[str, list[str]]:
    if data[:2] == b"\x1f\x8b":
        data = gzip.decompress(data)
    root = ET.fromstring(data)
    tag = root.tag.lower()
    locs = [clean_text(x.text or "") for x in root.iter() if x.tag.lower().endswith("loc")]
    return ("index" if tag.endswith("sitemapindex") else "urlset", [x for x in locs if x])


def official_sitemap_urls(domain: str, max_urls: int = 6000) -> list[str]:
    roots = [f"https://{domain}/sitemap.xml", f"https://www.{domain}/sitemap.xml", f"https://{domain}/sitemap_index.xml"]
    first = None
    for u in roots:
        try:
            first = fetch(u, timeout=12, accept="application/xml,text/xml,*/*")
            if first:
                break
        except Exception:
            continue
    if not first:
        # A number of vendors declare their sitemap only in robots.txt.
        for ru in [f"https://{domain}/robots.txt", f"https://www.{domain}/robots.txt"]:
            try:
                robots = fetch(ru, timeout=10, accept="text/plain,*/*").decode("utf-8", "replace")
                declared = [line.split(":", 1)[1].strip() for line in robots.splitlines() if line.lower().startswith("sitemap:")]
                if declared:
                    first = fetch(declared[0], timeout=12, accept="application/xml,text/xml,*/*")
                    break
            except Exception:
                continue
    if not first:
        return []
    typ, locs = xml_locs(first)
    if typ == "urlset":
        return locs[:max_urls]
    # sitemap index: prefer resources/news/customer/blog/partner/report, then first entries
    keys = ("blog", "news", "resource", "customer", "case", "partner", "report", "analyst", "press")
    children = sorted(locs, key=lambda x: (0 if any(k in x.lower() for k in keys) else 1, x))[:4]
    out = []
    for child in children:
        try:
            _, xs = xml_locs(fetch(child, timeout=12, accept="application/xml,text/xml,*/*"))
            out.extend(xs)
            if len(out) >= max_urls:
                break
        except Exception:
            pass
    return out[:max_urls]


def page_meta(url: str) -> dict | None:
    try:
        raw = fetch(url, timeout=12, accept="text/html,*/*")[:800_000].decode("utf-8", "replace")
    except Exception:
        return None
    title = ""
    m = re.search(r"<title[^>]*>(.*?)</title>", raw, re.I | re.S)
    if m:
        title = clean_text(m.group(1))
    desc = ""
    for pat in [r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\'](.*?)["\']', r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']']:
        m = re.search(pat, raw, re.I | re.S)
        if m:
            desc = clean_text(m.group(1)); break
    date = ""
    for pat in [r'<meta[^>]+property=["\']article:published_time["\'][^>]+content=["\'](.*?)["\']', r'"datePublished"\s*:\s*"([^"]+)"']:
        m = re.search(pat, raw, re.I | re.S)
        if m:
            date = clean_text(m.group(1)); break
    if not title:
        return None
    return {"title": title, "description": desc[:500], "url": url, "publisher": host(url), "publishedAt": date, "discovery": "official-sitemap"}


def official_pages(vendor: str, domain: str, limit: int = 8) -> list[dict]:
    try:
        urls = official_sitemap_urls(domain)
    except Exception:
        return []
    if not urls:
        return []
    keys = ["gartner", "forrester", "idc", "marketscape", "omdia", "gigaom", "isg", "canalys", "kuppinger", "customer", "case-study", "case_study", "success", "partner", "channel", "certification", "award", "news", "press", "report"]
    scored = []
    for u in urls:
        lu = u.lower()
        score = sum(6 for k in keys[:9] if k in lu) + sum(2 for k in keys[9:] if k in lu)
        if score:
            scored.append((score, u))
    chosen = [u for _, u in sorted(scored, reverse=True)[:limit]]
    out = []
    with cf.ThreadPoolExecutor(max_workers=4) as ex:
        for x in ex.map(page_meta, chosen):
            if x:
                out.append(x)
    return out


def analyst_tags(text: str) -> list[str]:
    t = (text or "").lower()
    return [a for a in ANALYSTS if a.lower() in t]


def classify(e: dict, vendor: str, family: str = "") -> dict:
    d = host(e.get("url", ""))
    pub = (e.get("publisher") or "").lower()
    text = " ".join([e.get("title", ""), e.get("description", ""), pub]).lower()
    tags = analyst_tags(text)
    official = OFFICIAL_DOMAINS.get(vendor, "")
    score, kind = 55, "media"
    analyst_direct = next((name for dom, name in ANALYST_DOMAINS.items() if d == dom or d.endswith("." + dom)), None)
    analyst_publisher = next((name for name in ANALYSTS if name.lower() in pub), None)
    if analyst_direct:
        score, kind = 100, "analyst-direct"
        if analyst_direct not in tags:
            tags.append(analyst_direct)
    elif analyst_publisher:
        # Google News preserves the originating publisher even when the click URL is a redirect.
        score, kind = 96, "analyst-publisher"
        if analyst_publisher not in tags:
            tags.append(analyst_publisher)
    elif official and (d == official or d.endswith("." + official)):
        score, kind = 94, "vendor-official"
    elif any(d == x or d.endswith("." + x) for x in TRUSTED_MEDIA) or any(x.split(".")[0] in pub for x in TRUSTED_MEDIA):
        score, kind = 84, "trusted-media"
    elif e.get("discovery") == "google-news-rss":
        score, kind = 68, "news-discovery"
    if tags:
        score += 5
    if re.search(r"\b(leader|leaders|leadership|magic quadrant|wave|marketscape|strong performer|challenger|visionary)\b", text):
        score += 3
    if family == "analyst": score += 2
    # Freshness is a secondary signal: authority remains dominant.
    try:
        dt = datetime.fromisoformat((e.get("publishedAt") or "").replace("Z","+00:00"))
        age = (datetime.now(timezone.utc) - dt.astimezone(timezone.utc)).days
        if age <= 45: score += 4
        elif age <= 180: score += 2
        elif age > 730: score -= 4
    except Exception:
        pass
    if family == "competitive": source_class = "competitive"
    elif any(k in text for k in ["customer", "case study", "success story", "deployment"]): source_class = "case"
    elif tags: source_class = "analyst"
    elif any(k in text for k in ["partner program", "channel", "certification", "specialization", "incentive", "mdf"]): source_class = "channel"
    elif any(k in text for k in ["architecture", "integration", "benchmark", "deployment", "reference design"]): source_class = "technical"
    elif any(k in text for k in ["launch", "innovation", "acquisition", "partnership", "award", "expansion"]): source_class = "market"
    else: source_class = family or "market"
    explicit_position = bool(tags and re.search(r"\b(named|recognized|positioned|ranked|leader|leaders|strong performer|challenger|visionary)\b", text))
    risk_flags = []
    if e.get("discovery") == "google-news-rss" and not analyst_publisher and kind == "news-discovery": risk_flags.append("discovery-link")
    try:
        dt = datetime.fromisoformat((e.get("publishedAt") or "").replace("Z", "+00:00")); age = (datetime.now(timezone.utc)-dt.astimezone(timezone.utc)).days
        if age > 730: risk_flags.append("stale")
    except Exception: pass
    analyst_claim = e.get("title", "") if explicit_position else ""
    return {**e, "analysts": sorted(set(tags)), "confidence": "high" if score >= 92 else "medium" if score >= 75 else "low", "authorityScore": min(score, 100), "kind": kind, "sourceClass": source_class, "explicitAnalystPositionClaim": explicit_position, "analystClaim": analyst_claim, "riskFlags": risk_flags, "queryFamily": family}


def dedupe(items: list[dict], vendor: str) -> list[dict]:
    best = {}
    for e in items:
        title = clean_text(e.get("title", ""))
        if not title:
            continue
        e = {**e, "title": title}
        key = re.sub(r"[^a-z0-9]+", "", title.lower())[:120] or e.get("url", "")
        old = best.get(key)
        if not old or e.get("authorityScore", 0) > old.get("authorityScore", 0):
            best[key] = e
    return sorted(best.values(), key=lambda x: (x.get("authorityScore", 0), x.get("publishedAt", "")), reverse=True)


def research_vendor(name: str, prior: dict, horizon: int = 365) -> tuple[str, dict, list[dict]]:
    evidence, errors = [], []
    for family, expr in QUERY_FAMILIES.items():
        q = f'"{name}" {expr}'
        for method, fn in [("gdelt", gdelt), ("google-news", google_news)]:
            try:
                rows = fn(q, horizon, 32) if method == "gdelt" else fn(q, 12)
                evidence.extend(classify(x, name, family) for x in rows)
            except Exception as ex:
                errors.append({"vendor": name, "source": method, "family": family, "error": str(ex)[:240]})
    domain = OFFICIAL_DOMAINS.get(name)
    if domain:
        try:
            evidence.extend(classify(x, name, "official") for x in official_pages(name, domain, 8))
        except Exception as ex:
            errors.append({"vendor": name, "source": "official-sitemap", "error": str(ex)[:240]})
    evidence = dedupe(evidence, name)
    # Keep a balanced evidence set rather than 20 variants of the same news story.
    selected = []
    for cls, cap in [("analyst", 10), ("case", 6), ("competitive", 5), ("channel", 5), ("technical", 5), ("market", 6), ("marketshare", 3), ("trust", 3)]:
        selected.extend([x for x in evidence if x.get("sourceClass") == cls][:cap])
    selected.extend([x for x in evidence if x not in selected][:max(0, 32-len(selected))])
    selected = dedupe(selected, name)[:32]
    if not selected:
        selected = prior.get("evidence", [])
    data = {
        "queries": {k: f'"{name}" {v}' for k, v in QUERY_FAMILIES.items()},
        "officialDomain": domain,
        "evidence": selected,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "ok" if selected else "no-public-signal",
        "coverage": {
            "analyst": sum(1 for x in selected if x.get("sourceClass") == "analyst"),
            "cases": sum(1 for x in selected if x.get("sourceClass") == "case"),
            "competitive": sum(1 for x in selected if x.get("sourceClass") == "competitive"),
            "channel": sum(1 for x in selected if x.get("sourceClass") == "channel"),
            "technical": sum(1 for x in selected if x.get("sourceClass") == "technical"),
            "market": sum(1 for x in selected if x.get("sourceClass") == "market"),
            "marketshare": sum(1 for x in selected if x.get("sourceClass") == "marketshare"),
            "trust": sum(1 for x in selected if x.get("sourceClass") == "trust"),
            "sourceDiversity": len({host(x.get("url", "")) or (x.get("publisher") or "").lower() for x in selected if x.get("url") or x.get("publisher")}),
            "explicitAnalystClaims": sum(1 for x in selected if x.get("explicitAnalystPositionClaim")),
        },
    }
    return name, data, errors


def main():
    vendor_data = load_json(VENDOR_FILE, {})
    old = load_json(OUT_JSON, {"vendors": {}})
    vendors = vendor_data.get("vendors", {})
    only = os.environ.get("VENDORS", "").strip()
    names = [x.strip() for x in only.split(",") if x.strip()] if only else list(vendors)
    workers = max(2, min(int(os.environ.get("RESEARCH_WORKERS", "6")), 10))
    horizon = int(os.environ.get("RESEARCH_HORIZON_DAYS", "365"))
    result = {
        "version": "2.0.0",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "methods": ["GDELT DOC 2.0", "Google News RSS", "official vendor sitemaps/pages", "prior-cache fallback"],
        "policy": "Evidence-first. Source/date/URL preserved. Analyst positions are never inferred from report inclusion.",
        "vendors": {}, "errors": [],
    }
    print(f"researching {len(names)} vendors with {workers} workers")
    with cf.ThreadPoolExecutor(max_workers=workers) as ex:
        futures = {ex.submit(research_vendor, n, old.get("vendors", {}).get(n, {}), horizon): n for n in names}
        done = 0
        for fut in cf.as_completed(futures):
            n = futures[fut]; done += 1
            try:
                name, data, errs = fut.result(); result["vendors"][name] = data; result["errors"].extend(errs)
                c = data.get("coverage", {})
                print(f"[{done:02}/{len(names):02}] {name}: {len(data.get('evidence', []))} signals · analyst {c.get('analyst',0)} · cases {c.get('cases',0)} · market {c.get('market',0)}")
            except Exception as exn:
                prior = old.get("vendors", {}).get(n, {"evidence": []})
                result["vendors"][n] = {**prior, "updatedAt": datetime.now(timezone.utc).isoformat(), "status": "stale-fallback"}
                result["errors"].append({"vendor": n, "source": "vendor-job", "error": str(exn)[:300]})
    # preserve vendors not refreshed on partial runs
    for name, data in old.get("vendors", {}).items():
        result["vendors"].setdefault(name, data)
    OUT_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_JS.write_text("window.WESTCON_LIVE_INTELLIGENCE = " + json.dumps(result, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print("updated", OUT_JSON, "vendors", len(result["vendors"]), "source-errors", len(result["errors"]))


if __name__ == "__main__":
    main()
