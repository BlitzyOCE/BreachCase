# BreachCase Scraper

Python-based breach news aggregation scraper that fetches articles from 8 RSS feeds, uses DeepSeek AI for classification and data extraction, and stores results in Supabase.

## Features

- **8 RSS Feed Sources**: BleepingComputer, The Hacker News, DataBreachToday, Krebs on Security, HelpNet Security, NCSC UK, Check Point Research, Have I Been Pwned
- **Two-Stage AI Processing**: Fast classification filter before expensive extraction (~40-60% cost savings)
- **Full-Database Dedup**: Fuzzy pre-filter across all breaches (no date limit) before AI update detection, so no breach is ever invisible to dedup regardless of age
- **Update Detection**: Automatically identifies if articles are updates to existing breaches vs. duplicate sources
- **Local Caching**: Saves raw articles and prevents duplicate URL processing via `cache/processed_ids.txt`
- **Database Integration**: Writes to Supabase (PostgreSQL)
- **Comprehensive Logging**: Daily logs with error tracking and classification metrics

## Architecture

```
RSS Feeds -> feed_parser.py -> cache_manager.py -> ai_processor.py -> db_writer.py -> Supabase
                                                    |
                                                    Stage 1: Classify (is this a breach?)
                                                    Stage 2: Extract (structured data)
                                                    Stage 3: Dedup (fuzzy pre-filter -> AI)
                                                    Stage 4: Write (new breach or update)
```

### Processing Pipeline

**Stage 1: Classification**
- Quick yes/no: "Is this article about a data breach?"
- Uses fewer tokens (~100-200 vs 1000+)
- Filters out ~40-60% of non-breach articles before expensive extraction
- Configurable confidence threshold (default: 0.6)
- Set `ENABLE_CLASSIFICATION=False` to skip and process all articles

**Stage 2: Full Extraction**
- Only runs on articles classified as breaches
- Extracts detailed structured data: company, severity, records affected, attack vector, CVEs, MITRE techniques, summary, lessons learned

**Stage 3: Dedup (Fuzzy Pre-filter + AI)**
- Fetches key fields (`id`, `company`, etc.) for **all** breaches in the database at run start
- For each extracted article, fuzzy-matches the company name against the full database (threshold: 0.6)
- If no candidates found: article is definitely a new breach - AI call skipped entirely (saves cost)
- If candidates found: passes only those candidates to DeepSeek for `NEW_BREACH` / `GENUINE_UPDATE` / `DUPLICATE_SOURCE` classification
- Newly written breaches are added to the stub list during the run, so same-company articles within one run are also caught

**Stage 4: DB Write**
- New breaches: inserted into `breaches`, `breach_tags`, `sources`
- Genuine updates: appended to `breach_updates`
- Duplicate sources: discarded, no DB write

## Setup

### 1. Install Dependencies

```bash
cd scraper/
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `scraper/` directory:

```bash
# Required
DEEPSEEK_API_KEY=sk-your-deepseek-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Optional (defaults shown)
ENABLE_CLASSIFICATION=True
CLASSIFICATION_CONFIDENCE_THRESHOLD=0.6
ARTICLE_LOOKBACK_HOURS=48
FUZZY_MATCH_THRESHOLD=0.85
FUZZY_CANDIDATE_THRESHOLD=0.6
MAX_FEED_WORKERS=10
LOG_LEVEL=INFO
```

### 3. Run

```bash
python main.py
```

## Usage

### Run Manually

```bash
python main.py
```

### Audit the Database

```bash
python audit.py              # General audit
python audit.py --duplicates # Flag potential duplicates
python audit.py --csv        # Export to CSV
```

### Schedule Daily Runs

#### Linux/Mac (cron)

```bash
crontab -e
```

Add:
```
0 8 * * * cd /path/to/BreachBase/scraper && /path/to/venv/bin/python main.py >> logs/cron.log 2>&1
```

#### Windows (Task Scheduler)

1. Open Task Scheduler -> Create Basic Task
2. Trigger: Daily at 8:00 AM
3. Action: Start a program
   - Program: `C:\path\to\venv\Scripts\python.exe`
   - Arguments: `main.py`
   - Start in: `C:\path\to\BreachBase\scraper`

## File Structure

```
scraper/
+-- main.py                 # Main orchestrator
+-- config.py               # Configuration, prompts, env-overridable settings
+-- feed_parser.py          # RSS feed fetching and filtering
+-- cache_manager.py        # Local caching, processed URL tracking
+-- ai_processor.py         # DeepSeek AI integration
+-- db_writer.py            # Supabase database writing
+-- audit.py                # DB audit and duplicate detection tool
+-- requirements.txt        # Python dependencies
+-- .env                    # Your env vars (gitignored)
+-- cache/
|   +-- raw_YYYY-MM-DD.json         # Raw article cache
|   +-- processed_ids.txt           # Permanent log of processed article URLs
|   +-- extraction_results_*.json   # AI extraction results for debugging
+-- logs/
    +-- scraper_YYYY-MM-DD.log      # Full log (debug level)
    +-- errors_YYYY-MM-DD.log       # Errors only
```

## Modules

### feed_parser.py
Fetches and parses RSS feeds from 8 sources in parallel, filters recent articles (last 48 hours), and deduplicates by URL.

**Key functions:** `fetch_all_feeds()`, `filter_recent_articles()`, `deduplicate_by_url()`

### cache_manager.py
Manages local file cache, tracks processed article URLs (permanent, ever-growing `processed_ids.txt`), and prevents reprocessing the same URL across runs.

**Key functions:** `get_new_articles()`, `cache_articles()`, `save_processed_id()`

### ai_processor.py
DeepSeek API integration for classifying articles, extracting structured breach data, and detecting updates.

**Key functions:** `classify_article()`, `extract_breach_data()`, `detect_update()`, `call_api()`

### db_writer.py
Supabase database integration for writing breaches, updates, tags, and sources.

**Key functions:** `write_new_breach()`, `write_breach_update()`, `get_all_breach_stubs()`

## Configuration

All settings in `config.py` are overridable via environment variables. Key settings:

| Variable | Default | Description |
|----------|---------|-------------|
| `ARTICLE_LOOKBACK_HOURS` | 48 | How far back to fetch articles |
| `FUZZY_CANDIDATE_THRESHOLD` | 0.6 | Min similarity to surface a breach as a dedup candidate |
| `FUZZY_MATCH_THRESHOLD` | 0.85 | High-confidence match threshold |
| `CLASSIFICATION_CONFIDENCE_THRESHOLD` | 0.6 | Min confidence to classify as breach |
| `MAX_FEED_WORKERS` | 10 | Parallel RSS fetch threads |
| `ENABLE_CLASSIFICATION` | True | Enable Stage 1 classification filter |

## Logging

- `logs/scraper_YYYY-MM-DD.log` - Full debug log
- `logs/errors_YYYY-MM-DD.log` - Errors only
- Console output during execution

## Testing Individual Modules

Each module has a `if __name__ == '__main__'` section for standalone testing:

```bash
python feed_parser.py      # Test RSS fetching
python cache_manager.py    # Test caching
python ai_processor.py     # Test AI extraction (requires DEEPSEEK_API_KEY)
python db_writer.py        # Test database connection (requires SUPABASE credentials)
```

## Troubleshooting

**No articles fetched**
- Check internet connection and verify RSS feed URLs are still valid
- Check logs for specific feed errors

**AI extraction fails**
- Verify `DEEPSEEK_API_KEY` is set correctly
- Check DeepSeek API quota/limits

**Database errors**
- Verify `SUPABASE_URL` and `SUPABASE_KEY`
- Check database schema matches `database/current_db.sql`

**Duplicate breaches appearing**
- Check `cache/processed_ids.txt` exists and is readable
- Run `python audit.py --duplicates` to identify existing duplicates
