# start.md

## For Claude Code Sessions

Before starting any work, please read these files in order:

1. **product.md** - Full technical architecture and product vision, but you don't have to strictly adhere to it, we can discuss and make changes to it as we progress
2. **ideas.md** - Current feature priorities and roadmap

## Current Sprint Focus

**Phase 1: Database Foundation** ✅ COMPLETED (2024-02-04)
- Created Supabase project: BreachWatch
- Implemented enhanced database schema with 6 tables + 2 views + 3 utility functions
- Added full-text search, deduplication support, confidence scoring
- Database file: `database/enhanced_schema.sql`

**Phase 2: Python Scraper** 🔨 BUILT (2026-02-04) - NOT TESTED
- Built complete scraper with 6 Python modules
- Configured 10 RSS feed sources (English + EU government)
- Local caching with deduplication
- Scraper directory: `scraper/`

**Phase 3: DeepSeek AI Integration** 🔨 BUILT (2026-02-04) - NOT TESTED
- DeepSeek API integration for extraction & update detection
- Confidence scoring and retry logic
- AI prompts for structured data extraction

**Next: TEST the scraper end-to-end with real API keys**


## Quick Links
- Database schema: `database/enhanced_schema.sql` (✅ implemented in Supabase)
- Scraper code: `scraper/` directory (✅ built, ready to test)
- Scraper setup guide: `scraper/README.md`
- Implementation plan: `docs/SCRAPER_IMPLEMENTATION_PLAN.md`
- AI prompts: `scraper/config.py` (EXTRACTION_PROMPT, UPDATE_DETECTION_PROMPT)
- Progress tracking: `docs/PROGRESS.md`

## When to Update Documentation

Update PRODUCT_OVERVIEW.md when we:
- Change core architecture (switch databases, add new layer)
- Add/remove major features
- Make technology decisions (pick a library, change API)

Don't update for:
- Small code refactors
- Bug fixes
- Minor UI tweaks