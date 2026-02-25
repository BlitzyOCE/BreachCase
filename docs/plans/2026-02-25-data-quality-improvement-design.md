# Data Quality & Coverage Improvement Design

**Date:** 2026-02-25
**Status:** Draft - Awaiting Approval
**Budget:** $0-5/month ongoing
**Timeline:** ~4-6 weeks across 4 phases

---

## Problem

BreachCase currently relies on 8 RSS feeds, giving roughly 30-40% coverage of publicly reported breaches and zero historical data. To become a credible breach intelligence platform, we need:

1. **Broader ongoing coverage** of new breaches (catching incidents our 8 feeds miss)
2. **Historical backfill** of 10+ years of past breaches
3. **Authoritative government/regulatory sources** for comprehensive, legally-mandated disclosures
4. **A scalable way to test and add new sources** without manual trial-and-error for each site

---

## Design Overview

### Architecture: Source Abstraction Layer

Every data source -- RSS, API, CSV, or scraper -- implements one common interface and feeds into the existing pipeline. The key insight: **structured sources skip the classify+extract AI stages** (they already have structured data) and only need dedup + optional LLM summary generation. This saves cost and is more reliable.

```
                         +----------------------+
                         |   Source Registry     |
                         |   (config.py +        |
                         |    sources.yaml)       |
                         +----------+-----------+
                                    |
           +------------------------+------------------------+
           |                        |                        |
    +------v------+          +------v------+          +------v------+
    |  RSS Feeds  |          | Structured  |          |  Scrapers   |
    | (25+ feeds) |          | APIs & CSVs |          | (gov sites) |
    |             |          | HHS, HIBP,  |          | CA AG, etc  |
    | feed_parser |          | RansomLook, |          |             |
    |   .py       |          | WA AG, SEC  |          | (Phase 4)   |
    +------+------+          +------+------+          +------+------+
           |                        |                        |
           |                 skip classify/extract           |
           |                 (already structured)            |
           +------------------------+------------------------+
                                    |
                         normalize to common dict:
                         {company, date, records,
                          attack_vector, summary...}
                                    |
                         +----------v-----------+
                         |   Dedup Pipeline      |
                         |   (fuzzy + AI)        |
                         +----------+-----------+
                                    |
                         +----------v-----------+
                         |   db_writer.py        |
                         |   (write to Supabase) |
                         +----------------------+
```

### Common Source Interface

Every source module exports one function:

```python
def fetch_new_entries(last_run: datetime | None) -> list[dict]:
    """
    Returns new entries since last_run in normalized format.
    Each dict has the same keys as breach_data from ai_processor.
    """
```

For structured sources, the returned dicts are already complete -- they go straight to dedup. For RSS, the existing classify->extract->dedup flow continues unchanged.

### Database Change

Add a `source_type` text column to the `sources` table:

```sql
ALTER TABLE public.sources
ADD COLUMN source_type text DEFAULT 'rss';
```

Valid values: `rss`, `hhs_ocr`, `ransomlook`, `ransomware_live`, `sec_edgar`, `wa_state_ag`, `hibp`, `vcdb`, `state_ag`, `court_filing`.

This enables coverage analytics: "what % of breaches come from each source type?"

### New Directory Structure

```
scraper/
+-- sources/                  # NEW: one module per source type
|   +-- __init__.py
|   +-- rss.py               # Refactored: just the RSS_SOURCES dict + new feeds
|   +-- hhs_ocr.py           # HHS breach portal CSV
|   +-- ransomlook.py        # RansomLook REST API
|   +-- sec_edgar.py         # SEC 8-K cybersecurity filings
|   +-- wa_state_ag.py       # Washington State Socrata API
|   +-- hibp_catalog.py      # HIBP breach list API
|   +-- ransomware_live.py   # Ransomware.live API
|   +-- cisa_kev.py          # CISA KEV enrichment (not a breach source)
+-- importers/                # NEW: one-time historical imports
|   +-- __init__.py
|   +-- vcdb_import.py       # VCDB GitHub JSON -> breaches
+-- test_sources/             # NEW: config-driven source test harness
|   +-- __init__.py
|   +-- source_tester.py     # Test runner
|   +-- sources.yaml         # Source registry with test expectations
+-- main.py                  # Updated: orchestrate RSS + all sources
+-- ai_processor.py          # Unchanged
+-- db_writer.py             # Add source_type param + batch write
+-- cache_manager.py         # Add per-source last_run tracking
+-- config.py                # Add new source configs + expanded RSS list
+-- audit.py                 # Add cross-source coverage metrics
```

---

## Phase 1: Expand RSS Feeds (Days 1-2)

**Goal:** Double ongoing new-breach coverage from ~30-40% to ~50-55% at zero cost.

### New Feeds to Add

| Key | Name | URL | Why |
|-----|------|-----|-----|
| `databreachesnet` | DataBreaches.net | `https://databreaches.net/feed/` | Single most comprehensive breach aggregator. Catches small incidents mainstream media ignores. |
| `therecord` | The Record (Recorded Future) | `https://therecord.media/feed` | High-quality ransomware + breach coverage. **Test first** -- may not have a working RSS feed (not WordPress-based). |
| `scmagazine_threats` | SC Magazine (Threats) | `https://www.scmagazine.com/feed/topic/threats` | Breach/threat focused. **Note:** Use topic-level feed, not generic `/feed` which may 404. |
| `cyberscoop` | CyberScoop | `https://cyberscoop.com/feed/` | Policy-oriented, good for government breaches |
| `techcrunch_security` | TechCrunch Security | `https://techcrunch.com/category/security/feed/` | Breaks major tech company breaches first |
| `infosecurity_mag` | Infosecurity Magazine | `https://www.infosecurity-magazine.com/rss/news/` | Strong European breach coverage |
| `globenewswire_cyber` | GlobeNewswire Cybersecurity | `https://www.globenewswire.com/RssFeed/subjectcode/25-Cybersecurity/feedTitle/GlobeNewswire` | Company press releases about breaches (first-party) |
| `securityweek` | SecurityWeek | `https://www.securityweek.com/feed/` | Solid all-around breach reporting |
| `darkreading` | Dark Reading | `https://www.darkreading.com/rss.xml` | Enterprise security focus |
| `threatpost` | Threatpost | `https://threatpost.com/feed/` | Good for vulnerability-related breaches |
| `grahamcluley` | Graham Cluley | `https://grahamcluley.com/feed/` | Independent security journalist, catches unique stories |
| `securityaffairs` | Security Affairs | `https://securityaffairs.com/feed` | Strong international coverage |
| `theregister_security` | The Register Security | `https://www.theregister.com/security/headlines.atom` | UK/global perspective |

**Implementation:** Add these entries to `RSS_SOURCES` in `config.py`. No code changes needed -- the existing `feed_parser.py` handles them automatically.

**Validation:** Run the scraper once, check logs for any feeds that fail to parse (bad XML, auth required, etc.). Remove any that don't work. The Record and GlobeNewswire are the least certain -- test those first.

**Note on GlobeNewswire:** This is a press release wire, not editorial news. It will have noise from marketing/product announcements tagged as "cybersecurity." Your existing AI classification stage will filter these out, but expect a lower breach hit rate than editorial feeds.

**Coverage after Phase 1:** ~50-55% of new breaches (roughly doubled).

---

## Phase 2: Free Structured APIs (Days 3-10)

**Goal:** Add 6 free, structured data sources that skip AI extraction. These provide authoritative data directly.

### Source 1: HHS OCR Breach Portal (Healthcare)

- **What:** All HIPAA breaches affecting 500+ individuals since 2009. ~6,000+ records.
- **URL:** `https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf`
- **Format:** CSV export via JSF web interface. **Important:** This is NOT a simple CSV download URL -- the portal uses JavaServer Faces (JSF) with server-side state, so the export button triggers a POST request. You need to either: (a) manually download the CSV and ingest it, or (b) use Selenium/Playwright to automate the button click. The manual approach is fine for weekly runs.
- **CSV columns:** Name of Covered Entity, State, Covered Entity Type, Individuals Affected, Breach Submission Date, Type of Breach, Location of Breached Information, Business Associate Present, Web Description.
- **Scope note:** Only shows breaches from the last 24 months by default. Older breaches are in an "Archive" section on the same portal -- you'll need to export both.
- **Mapping to our schema:**

| HHS CSV Field | Our Field | Notes |
|---------------|-----------|-------|
| Name of Covered Entity | `company` | Direct |
| State | `country` | Always "United States" + use state for tags |
| Covered Entity Type | `industry` | Always "healthcare" |
| Individuals Affected | `records_affected` | Direct |
| Breach Submission Date | `disclosure_date` | Direct |
| Type of Breach | `attack_vector` | Map: "Hacking/IT Incident" -> varies, "Theft" -> "other", etc. |
| Location of Breached Information | `data_compromised` | Parse: "Email, Network Server" -> ["email data", "server data"] |
| Web Description | `summary` seed | Can use as starting point for LLM summary |

- **LLM usage:** Only for generating `summary` and `lessons_learned` fields. Batch process with DeepSeek (~$2 one-time for 6,000 records).
- **Schedule:** Weekly manual CSV download + diff against last snapshot. Automate with Playwright later if desired.
- **Coverage gain:** +15% (entire US healthcare breach history).

### Source 2: RansomLook API (Ransomware Early Warning)

- **What:** Real-time monitoring of 100+ ransomware group leak sites.
- **Endpoints:**
  - `GET /api/recentposts` -- recent victim posts across all groups
  - `GET /api/groups` -- all tracked groups
  - `GET /api/posts/{group}` -- posts for a specific group
- **Docs:** `https://www.ransomlook.io/doc/` (Swagger-style)
- **Format:** REST API, no auth, CC BY 4.0. Also self-hostable via GitHub (`https://github.com/RansomLook/RansomLook`).
- **Key fields:** victim name (title), sector, country, discovered date, group name, description.
- **Mapping:** `group` -> `threat_actor`, set `attack_vector = 'ransomware'`.
- **Schedule:** Every 6 hours. No documented rate limit, but be courteous.
- **Coverage gain:** +5% (catches ransomware victims days before news).

### Source 3: HIBP Breach Catalog

- **What:** Metadata for every breach dataset indexed by Have I Been Pwned. ~800+ curated breaches.
- **URL:** `https://haveibeenpwned.com/api/v3/breaches`
- **Format:** Free JSON array, no auth needed for the breach list endpoint. **Gotcha:** Must set a descriptive `User-Agent` header or requests may be blocked.
- **Key fields:** Name, Title, Domain, BreachDate, AddedDate, PwnCount, DataClasses, Description, IsVerified, IsFabricated, IsSensitive.
- **Mapping:** `PwnCount` -> `records_affected`, `DataClasses` -> `data_compromised`, `BreachDate` -> `discovery_date`, `Domain` -> helps with company identification.
- **Note:** Per-email lookup endpoints require a paid API key, but the `/breaches` list is free and sufficient for our needs.
- **Schedule:** Daily.
- **Coverage gain:** +2% (verified breaches where data is confirmed circulating).

### Source 4: Washington State AG (Socrata API)

- **What:** All breach notifications to WA state since July 2015. Richest state-level structured dataset.
- **URL:** `https://data.wa.gov/resource/sb4j-ca4h.json`
- **Bulk CSV:** `https://data.wa.gov/api/views/sb4j-ca4h/rows.csv?accessType=DOWNLOAD` (no pagination needed)
- **Format:** Socrata SODA API, JSON, no auth required (anonymous gets 1000 rows/request; free app token raises limit).
- **Actual field names:** `name` (company), `datestart`, `dateend`, `dateaware`, `datesubmitted`, `databreachcause`, `cyberattacktype`, `washingtoniansaffected` (record count), `industrytype`, `businesstype`, `entitystate`.
- **Useful query:** `?$where=datesubmitted>'2025-01-01'&$limit=5000` for recent entries.
- **Companion dataset:** `padd-mby7` breaks down personal information type per breach.
- **Schedule:** Weekly.
- **Coverage gain:** +2% (state-level filings that miss national news, only breaches affecting 500+ WA residents).

### Source 5: SEC EDGAR 8-K Filings

- **What:** Since July 26 2023, public companies must file 8-K (Item 1.05) within 4 business days of a material cybersecurity incident.
- **Search URL:** `https://efts.sec.gov/LATEST/search-index?q=%22cybersecurity%22&forms=8-K&items=1.05&dateRange=custom&startdt=2023-07-26`
- **Format:** REST API, JSON, no auth. Returns `hits.hits` array with fields: `file_date`, `entity_name`, `file_num`, `form_type`, `items`, `period_of_report`, `biz_location`, plus `file_path` to the actual filing HTML.
- **Filing text URL:** `https://www.sec.gov/Archives/edgar/data/{CIK}/{accession}/`
- **Gotchas:**
  - Must include `User-Agent` header with org name + email (SEC requirement).
  - Rate limit: 10 requests/second. Exceeding causes temporary IP blocks.
  - Max 10,000 results per query; paginate with `from` parameter.
  - Item 1.05 only exists post-July 2023, so no historical data before that.
- **LLM usage:** Required -- filing text is prose, needs extraction. But these are high-value (first-party disclosure from public companies).
- **Schedule:** Daily.
- **Coverage gain:** +3% (authoritative, first-party public company disclosures).

### Source 6: Ransomware.live (Complementary to RansomLook)

- **What:** Scrapes ransomware leak sites. Monitors slightly different groups than RansomLook.
- **v2 API endpoints:**
  - `GET /v2/recentvictims` -- victims disclosed in last 48 hours
  - `GET /v2/victims` -- all victims (large dataset)
  - `GET /v2/groups` -- all tracked groups
- **Static bulk downloads (most scraper-friendly):**
  - `https://data.ransomware.live/victims.json` -- full victims list
  - `https://data.ransomware.live/victims.csv` -- CSV format
  - `https://data.ransomware.live/groups.json` -- all groups
- **Format:** JSON, free for personal/research use. PRO tier exists for commercial use.
- **Key fields per victim:** name, group, country, published date, website, description, sector/industry.
- **Schedule:** Every 6 hours (use `/v2/recentvictims`), dedup against RansomLook by victim name + date.
- **Coverage gain:** +1% (redundancy for ransomware coverage).

### Enrichment Source: CISA KEV

- **What:** 1,200+ CVEs confirmed exploited in the wild.
- **JSON:** `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
- **CSV:** `https://www.cisa.gov/sites/default/files/csv/known_exploited_vulnerabilities.csv`
- **GitHub mirror (preferred for polling):** `https://github.com/cisagov/kev-data`
- **Key fields per CVE:** cveID, vendorProject, product, vulnerabilityName, dateAdded, shortDescription, `knownRansomwareCampaignUse` (added Oct 2023 -- especially useful for correlating CVEs with ransomware breaches).
- **Integration:** Cross-reference CVEs in `cve_references` field. Add an enrichment flag. Not a breach source itself.
- **Schedule:** Weekly.

### How Structured Sources Skip AI Extraction

For sources like HHS, HIBP, WA AG -- the data is already structured. The pipeline for these is:

```python
# In each source module:
def fetch_new_entries(last_run):
    raw = download_csv()  # or call API
    entries = []
    for row in raw:
        entry = {
            'company': row['entity_name'],
            'records_affected': int(row['individuals']),
            'disclosure_date': row['submission_date'],
            # ... direct field mapping
            'source_type': 'hhs_ocr',
            '_needs_ai_summary': True,  # Flag for optional LLM enrichment
        }
        entries.append(entry)
    return entries
```

In `main.py`, the orchestrator checks `_needs_ai_summary` and only calls DeepSeek for summary generation (not classification or extraction).

**Coverage after Phase 2:** ~65-75% (including historical healthcare data from HHS).

---

## Phase 3: Historical Backfill via VCDB (Days 11-16)

**Goal:** Import 8,000+ historical breach incidents from the VERIS Community Database.

### VCDB Overview

- **URL:** `https://github.com/vz-risk/VCDB`
- **What:** 10,000+ publicly reported security incidents in VERIS framework (used by Verizon DBIR). Individual JSON files per incident with source URLs. Goes back 10+ years.
- **Format:** Git repo of JSON files. Free. `git clone` and process.
- **Key files:**
  - `vcdb.json` -- merged full database (all incidents combined, easiest to ingest)
  - `data/json/validated/` -- individual JSON incident files
  - `data/csv/vcdb.csv` -- CSV export
- **Raw download:** `https://raw.githubusercontent.com/vz-risk/VCDB/master/vcdb.json`
- **Important caveat:** Many victim organizations are partially anonymized (e.g., "Large US Financial Institution" instead of the actual company name). VCDB covers security incidents broadly (not just data breaches) -- includes lost devices, internal misuse, etc. You'll need to filter for confidentiality breaches specifically and skip anonymized entries that have no company name.

### VERIS-to-BreachCase Mapping

| VERIS Field | Our Field | Transform |
|-------------|-----------|-----------|
| `victim.victim_id` | `company` | Direct |
| `victim.industry` (NAICS code) | `industry` | Map NAICS -> our categories |
| `victim.country` | `country` | ISO 2-letter -> full name |
| `timeline.incident.year/month` | `discovery_date` | Construct YYYY-MM-01 |
| `impact.overall_amount` | `records_affected` | Direct if available |
| `action.*` (top-level keys) | `attack_vector` | Map: hacking->api_exploit, malware->malware, social->phishing, etc. |
| `actor.*.name` | `threat_actor` | Extract from actor varieties |
| `attribute.confidentiality.data.*.variety` | `data_compromised` | Map VERIS data types to our format |
| `reference` | source URLs | Use for `sources` table entries |

### Import Strategy

1. `git clone` the VCDB repo
2. Process JSON files in batches of 100
3. For each: map VERIS fields -> our schema, generate LLM summary
4. Dedup against existing DB records (exact company name match first, then fuzzy)
5. Import in order: VCDB first (largest), then cross-reference

### Dedup at Scale

With 8,000+ records importing into a DB that may already have hundreds of entries:

1. **Fast first pass:** Exact match on normalized company name (lowercase, strip "Inc.", "LLC", "Corp.", "Ltd.", etc.)
2. **Fuzzy second pass:** Only on records that survive step 1, using the existing 0.85 threshold
3. **AI dedup third pass:** Only for ambiguous fuzzy matches (0.7-0.85 range) -- batch via DeepSeek

**Cost:** ~$5-10 one-time for LLM summary generation across 8,000 records.
**Coverage after Phase 3:** ~75-85% (massive historical backfill).

---

## Phase 4: Config-Driven Source Test Harness (Days 17-22)

**Goal:** Make it trivial to evaluate whether a new government/data source can be scraped, before investing in a full integration.

### The Problem

You'll want to evaluate dozens of potential sources (state AG sites, international DPAs, etc.). Manually checking each one is tedious. You need a way to:

1. Define a source with its URL and expected format
2. Run a single command to test if it's scrapable
3. Get a structured report: pass/fail, sample data, field mapping quality

### sources.yaml -- Source Registry

```yaml
# Each source gets tested by the harness
sources:
  hhs_ocr:
    name: "HHS OCR Breach Portal"
    type: csv_download
    url: "https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf"
    download_url: "https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf"
    format: csv
    expected_fields:
      - "Name of Covered Entity"
      - "State"
      - "Individuals Affected"
    min_rows: 100
    test_validation:
      has_company_field: true
      has_date_field: true
      has_records_field: true

  wa_state_ag:
    name: "Washington State AG"
    type: api_json
    url: "https://data.wa.gov/resource/sb4j-ca4h.json"
    format: json
    expected_fields:
      - "organizationname"
      - "dateofbreach"
    min_rows: 50
    test_validation:
      has_company_field: true
      has_date_field: true

  california_ag:
    name: "California AG Breach List"
    type: html_table
    url: "https://oag.ca.gov/privacy/databreach/list"
    format: html
    expected_elements:
      - "table"
      - "Organization"
    min_rows: 20
    test_validation:
      has_company_field: true
      has_date_field: true

  maine_ag:
    name: "Maine AG Breach Notifications"
    type: html_table
    url: "https://apps.web.maine.gov/online/aeviewer/ME/40/list.shtml"
    format: html
    expected_elements:
      - "table"
    min_rows: 10

  # Add new sources here to test them:
  example_new_source:
    name: "Some New Government Portal"
    type: html_table
    url: "https://example.gov/breaches"
    format: html
    expected_elements:
      - "table"
    min_rows: 5
    enabled: false  # Set to true when ready to test
```

### source_tester.py -- Test Runner

```
python test_sources/source_tester.py                    # Test all enabled sources
python test_sources/source_tester.py --source hhs_ocr   # Test one source
python test_sources/source_tester.py --source california_ag --verbose  # Detailed output
```

**What it does per source:**

1. **Connectivity test:** Can we reach the URL? (HTTP 200, no auth wall)
2. **Format test:** Does the response match expected format? (CSV headers present, JSON parseable, HTML has expected elements)
3. **Data extraction test:** Can we extract at least `min_rows` entries?
4. **Field mapping test:** Do extracted rows contain company name, date, and at least one other useful field?
5. **Sample output:** Print 3 sample rows mapped to our schema

**Output:**

```
=== Source Test Results ===

[PASS] HHS OCR Breach Portal
  - URL reachable: yes (HTTP 200)
  - Format: CSV (6,234 rows)
  - Fields found: 8/8 expected
  - Sample: "Advocate Medical Group | 2013-08-01 | 4,000,000 records"

[PASS] Washington State AG
  - URL reachable: yes (HTTP 200)
  - Format: JSON (2,847 entries)
  - Fields found: 5/5 expected
  - Sample: "T-Mobile | 2023-01-15 | 37,000,000 records"

[FAIL] California AG Breach List
  - URL reachable: yes (HTTP 200)
  - Format: HTML (table found)
  - Issue: Links to individual PDF notices, not inline data
  - Recommendation: Needs PDF parser, not simple HTML scraping

[SKIP] Some New Government Portal (disabled)
```

### Why This Matters

When you hear about a new data source (another state AG, an EU DPA, an international breach database), you:

1. Add 5 lines to `sources.yaml`
2. Run `python test_sources/source_tester.py --source new_source`
3. In 10 seconds, know if it's worth building a full integration

This turns source evaluation from a multi-hour research task into a 2-minute test.

---

## Practical Advice: Additional Quick Wins

Beyond the phased plan, here are high-impact, low-effort additions to consider:

### 1. DataBreaches.net Is Your Single Best RSS Addition

Dissent Doe at DataBreaches.net manually curates breach reports from leak sites, government filings, and tips. They frequently break stories before mainstream outlets. This single feed may be worth more than the other 12 new feeds combined for catching small/mid-size breaches.

### 2. Use Company Press Releases as a Source

GlobeNewswire and BusinessWire publish company press releases about breaches. These are **first-party disclosures** -- the company itself is announcing the breach. They're more authoritative than journalist reports and often contain details (exact record counts, breach timeline) that news articles summarize poorly.

### 3. CISA KEV as Severity Signal

Cross-referencing your `cve_references` against the CISA KEV list gives you a free severity signal: if a breach exploited a known-exploited vulnerability, it's almost certainly high/critical severity. This improves your severity classification without any AI cost.

### 4. Consider a "Confidence Score" Per Breach

Different sources have different reliability:
- SEC 8-K filings: very high confidence (legally mandated disclosure)
- HHS OCR: very high (federal reporting requirement)
- State AG filings: high (state legal requirement)
- HIBP catalog: high (verified data circulating)
- RSS news: medium (journalist interpretation)
- Ransomware leak sites: medium-low (threat actor claims, may be exaggerated)

A `data_confidence` field on breaches (or derived from `source_type`) helps users understand how trustworthy each record is.

### 5. Don't Bother with Privacy Rights Clearinghouse (For Now)

Their data overlaps heavily with HHS + state AG data that you can get for free. The paid license ($100-500/year) isn't worth it until you've exhausted the free sources and need it as a cross-reference for validation.

---

## Cost Summary

| Phase | Monthly Cost | One-Time Cost | Coverage |
|-------|-------------|---------------|----------|
| Current (8 RSS feeds) | ~$1 | - | ~30-40% |
| Phase 1: Expand RSS to 25+ | ~$1 | 0 | ~50-55% |
| Phase 2: Free structured APIs | ~$1 | ~$2 (HHS summaries) | ~65-75% |
| Phase 3: VCDB historical import | ~$1 | ~$5-10 (summaries) | ~75-85% |
| Phase 4: Test harness | ~$1 | 0 | Same (enables future growth) |

**Total ongoing: ~$1/month. Total one-time: ~$7-12 in LLM costs.**

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Government sites change format | Test harness detects breakage. Config-driven parsers are easy to update. |
| Dedup errors during VCDB import (8K records) | Import in batches of 100, run `audit.py --duplicates` after each batch. Manual review queue for 0.7-0.85 similarity matches. |
| RSS feeds go dead or change URLs | Test harness includes RSS feed validation. Scraper logs already flag fetch failures. |
| HHS CSV download format changes | Pin expected column names in config. Test harness catches schema drift. |
| RansomLook/Ransomware.live APIs go offline | They're free community projects. Redundancy (both sources) mitigates. If both fail, ransomware coverage degrades gracefully to RSS. |

---

## What Comes After (Future Phases)

Once Phases 1-4 are complete (~85% coverage), the next high-value additions would be:

1. **California AG scraper** (PDF parsing required, +3% coverage)
2. **More state AG portals** (test harness makes evaluation fast)
3. **EU DPA enforcement decisions** (international coverage)
4. **CourtListener class action monitoring** (enrichment: legal outcomes for existing breaches)
5. **Dark web intelligence feeds** (only if this becomes a commercial product, $200-500/mo)

The test harness built in Phase 4 makes each of these a "test first, build if viable" decision rather than a leap of faith.

---

## Next Step

After approval, this design will be turned into a detailed implementation plan with specific file changes, function signatures, and task ordering.
