# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BreachWatch is an AI-powered data breach intelligence platform that aggregates breach news from RSS feeds, extracts structured data using DeepSeek AI, and stores results in Supabase. Breaches are treated as "living stories" with timeline updates.

**Current Status**: Phase 2 complete (Python scraper built). Next.js frontend not yet implemented.

## Architecture

```
RSS Feeds -> feed_parser.py -> cache_manager.py -> ai_processor.py -> db_writer.py -> Supabase
```

**Two-Stage AI Processing**:
1. **Classification** (fast/cheap): Quick yes/no - is this a breach article?
2. **Extraction** (detailed): Full structured data extraction for confirmed breaches

## Development Commands

### Scraper Setup (Windows)
```bash
cd scraper
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Then edit with real API keys
```

### Run Scraper
```bash
cd scraper
python main.py
```

### Test Individual Modules
```bash
python scraper/feed_parser.py      # Test RSS fetching
python scraper/cache_manager.py    # Test caching
python scraper/ai_processor.py     # Test AI extraction (requires DEEPSEEK_API_KEY)
python scraper/db_writer.py        # Test database connection (requires SUPABASE credentials)
```

### Audit Database
```bash
cd scraper
python audit.py              # Full audit report (breaches, duplicates, missing fields)
python audit.py --duplicates # Show only potential duplicates
python audit.py --csv        # Export all data to CSV files in audit_export/
```

## Key Files

### Scraper Modules (`scraper/`)
- **main.py** - Orchestrator: fetches feeds, runs two-stage AI, writes to database
- **config.py** - All configuration, RSS sources, AI prompts (CLASSIFICATION_PROMPT, EXTRACTION_PROMPT, UPDATE_DETECTION_PROMPT)
- **feed_parser.py** - Parallel RSS fetching from 10 sources, date filtering, deduplication
- **cache_manager.py** - Local file caching, processed URL tracking
- **ai_processor.py** - DeepSeek API integration: `classify_article()`, `extract_breach_data()`, `detect_update()`
- **db_writer.py** - Supabase writes: `write_new_breach()`, `write_breach_update()`, `get_existing_breaches()`
- **audit.py** - Data quality audit: duplicate detection, missing field analysis, CSV export

### Database (`database/`)
- **current_db.sql** - Full PostgreSQL schema for Supabase
- **DATABASE_DESIGN.md** - Detailed documentation of all tables, views, functions

### Documentation (`docs/`)
- **product.md** - Technical architecture and data flow
- **PROGRESS.md** - Development status and session notes

## Logs

Logs written to `scraper/logs/`:
- `scraper_YYYY-MM-DD.log` - Full execution log
- `errors_YYYY-MM-DD.log` - Errors only
