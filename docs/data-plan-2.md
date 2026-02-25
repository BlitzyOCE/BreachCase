# BreachWatch Data Sources & Architecture Discussion Summary

**Date:** February 25, 2026  
**Topic:** Moving from RSS feeds to government breach notification databases

---

## The Problem

Current RSS-based approach has severe limitations:
- Limited coverage (only breaches that security news sites choose to cover)
- No historical data (only captures breaches from when scraping started)
- Misses smaller incidents that aren't newsworthy
- Won't achieve goal of comprehensive 10-year coverage + near-100% new breach coverage

---

## The Solution: Government Breach Notification Databases

### Key Discovery

**How PrivacyRights.org achieves comprehensive coverage:**
- They scrape government-mandated breach notification databases from 15 state attorney general offices and federal agencies
- NOT news articles - they go directly to legal sources
- Companies are legally required to notify state AGs of breaches (500+ affected residents)
- These notifications are public records

### Why This Works

1. **Legal requirement = comprehensive coverage** - Companies must report or face penalties
2. **Historical data available** - Many portals have 10+ years of archived notifications
3. **Free and reliable** - Government sites, publicly accessible
4. **Primary source** - Actual breach notification letters, not journalist interpretations
5. **Structured data** - Most portals have CSV downloads or simple HTML tables

### Data Sources PrivacyRights.org Uses

**State Attorney General Portals:**
- California AG (biggest source)
- New York AG
- Massachusetts AG
- Maine AG
- Vermont AG
- Montana AG
- Oregon AG
- ~8 others (15 total state + federal sources)

**Federal:**
- HHS Breach Portal (healthcare breaches - HIPAA violations)
- Various federal agency notifications

**Coverage Statistics:**
- 2025: 8,019 notification filings representing 4,080 unique breach events
- 375+ million individuals affected
- Goes back to 2005 (California's law started in 2002)

---

## Technical Implementation

### Architecture: Single Scraper with Config (Recommended)

**You DON'T need 15 separate Python files** - most government sources are simple CSV downloads or HTML tables.

### File Structure
```
scrapers/
├── government/
│   ├── scraper.py           # Main scraper (loops through all sources)
│   ├── parsers.py            # Parser functions for different formats
│   ├── config.py             # List of all government sources + URLs
│   └── processors.py         # Claude API integration for data extraction
```

### Example: California AG Portal

**What we found:**
- URL: `https://oag.ca.gov/privacy/databreach/list`
- Format: Simple HTML table with CSV export option
- CSV download: `https://oag.ca.gov/privacy/databreach/list-export`
- Contains: Organization name, breach dates, reported date
- Each entry links to actual breach notification PDF

**Key insight:** This is just a CSV download - trivially easy to scrape!

### Configuration Approach

```python
# config.py
SOURCES = {
    'california_ag': {
        'type': 'csv_download',
        'url': 'https://oag.ca.gov/privacy/databreach/list-export',
        'parser': 'parse_csv'
    },
    'maine_ag': {
        'type': 'web_table',
        'url': 'https://apps.web.maine.gov/...',
        'parser': 'parse_html_table'
    },
    'hhs_portal': {
        'type': 'csv_download',
        'url': 'https://ocrportal.hhs.gov/...',
        'parser': 'parse_hhs_csv'
    }
}
```

**Single scraper handles all sources** because they're all similar formats.

---

## Alternative Approach Discussed (Agent-Based Google Search)

### The Idea
- Agent searches Google with queries like "data breach January 2025"
- Visits top 10 results per search
- Sends articles to Claude for extraction
- Deduplicates across multiple sources

### Cost Analysis for Historical Backfill (10 years)
- ~2,400 Google searches (one per month, 20 results each)
- ~2,400 articles to process through Claude
- Google Custom Search API: ~$12 one-time
- Claude Sonnet 4.5: ~$22 one-time
- **Total one-time cost: ~$35**

**Ongoing costs:** ~$20-25/month (search API + Claude)

### Why We Rejected This Approach
1. Government sources are MORE comprehensive (legally required reporting)
2. Government sources are FREE (no search API costs)
3. Government sources are STRUCTURED (easier to parse than news articles)
4. Government sources have HISTORICAL data built-in
5. Too much noise and duplication with news approach

**Conclusion:** Agent-based approach is interesting but government sources are clearly superior for comprehensive breach coverage.

---

## Recommended Implementation Path

### Phase 1: Start with California AG (Biggest Source)
1. Download CSV from California AG portal
2. Parse CSV into structured data
3. Send to Claude for additional extraction/enrichment
4. Store in Supabase
5. **This tests your entire pipeline with the simplest source**

### Phase 2: Add HHS Breach Portal (Healthcare)
- Also CSV download
- Different format but same general approach
- Validates your parser architecture

### Phase 3: Add Other States One-by-One
- Most will be CSV or simple HTML tables
- Configuration-driven approach scales easily
- ~2-3 Python files total handles all sources

### Phase 4: Keep RSS for Breaking News & Analysis
- Government notifications have lag (15-30 days)
- RSS catches breaking news faster
- Use RSS for timeline updates and journalist analysis
- **Combined approach:** Government = comprehensive baseline, RSS = fast updates + context

---

## Key Technical Insights

### Why This Architecture Works
1. **Most sources are simple** - CSV downloads or HTML tables (not complex JavaScript sites)
2. **Similar data structure** - All have company, date, records affected, etc.
3. **Configuration over code** - Adding new source = updating config file, not writing new scraper
4. **Single codebase** - Shared logic for Claude processing, deduplication, database writes

### Data Flow
```
Government Portal (CSV/HTML)
    ↓
Download/Parse
    ↓
Claude API (enrich & extract)
    ↓
Supabase Database
    ↓
Next.js Frontend
```

---

## Next Steps

1. **Research specific state AG portals** - Identify which provide CSV vs HTML vs require scraping
2. **Build California AG scraper first** - Simplest to implement, biggest source
3. **Design parser architecture** - Plan for CSV, HTML table, and PDF formats
4. **Test end-to-end pipeline** - One source → Claude → Database → Display
5. **Scale incrementally** - Add sources one at a time, don't try to do all 15 at once

---

## Additional Notes

### Why Government Sources Beat News Aggregation
- **Coverage:** Legal requirement catches ALL breaches, not just newsworthy ones
- **Consistency:** Standardized reporting formats
- **Cost:** Free public data vs. paid search APIs
- **Historical:** 10+ years archived vs. starting from scratch
- **Authority:** Primary source vs. secondary reporting

### Deployment Considerations
- Government scrapers can run less frequently (daily or weekly) since notifications have 15-30 day lag
- RSS scrapers should still run daily for breaking news
- Separate cron jobs for government vs. RSS scrapers
- Cost stays low - no expensive AI processing of every news article

### BreachWatch Data Strategy
**Two complementary sources:**
1. **Government notifications** = Comprehensive historical + ongoing baseline (90% of breaches)
2. **RSS news feeds** = Fast breaking news + analysis + timeline updates (10% unique, plus context on existing breaches)

This hybrid approach gives you both comprehensive coverage AND timely updates.
