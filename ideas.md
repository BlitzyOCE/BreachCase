# Data Breach Aggregation Website - Feature Ideas

## Core Features (MVP)

### Data Collection & Processing
- [ ] Python scraper fetches breach news from RSS feeds (SecurityWeek, BleepingComputer, KrebsOnSecurity)
- [ ] Local file cache stores raw articles before AI processing
- [ ] Claude API extracts structured data from articles
- [ ] AI determines if article is NEW breach or UPDATE to existing breach
- [ ] Store all data in Supabase (PostgreSQL)

### Data Structure & Schema
- [ ] Breaches table: company, industry, country, breach method, attack vector, CVE references, MITRE ATT&CK techniques, severity score, initial discovery date, records affected, status
- [ ] Breach updates table: linked to parent breach, update type, date, description, source URL
- [ ] Tags system: country, industry, severity, attack vector, threat actor

### Frontend Display
- [ ] Next.js website displays breaches as cards on homepage
- [ ] Each card shows: company name, industry, date, severity badge, brief summary
- [ ] Filter by tags (country, industry, attack vector, severity)
- [ ] Search functionality (by company name, keywords, date range)
- [ ] "Recently Updated Breaches" section on homepage

## Breach Detail Pages

### Article Structure
Each breach detail page contains the following sections:
- [ ] **AI High-level Summary**: 2-3 sentence executive overview at top
- [ ] **Tags**: Country, industry, severity, attack vector, CVE, MITRE ATT&CK techniques (clickable filters)
- [ ] **Key Facts**: Company name, industry, discovery date, disclosure date, records affected, current status
- [ ] **Attack Method**: Technical explanation of how breach occurred
- [ ] **Data Compromised**: Types and volume of exposed data
- [ ] **Incident Timeline**: Vertical timeline showing key events (discovery, disclosure, milestones)
- [ ] **Impact Analysis**: Financial losses, operational disruption, reputational damage
- [ ] **Regulatory & Legal**: Fines, investigations, lawsuits, compliance violations
- [ ] **Lessons Learned**: What security controls failed, preventive recommendations
- [ ] **Update History**: Chronological list of all updates to this breach (separate dedicated section)
- [ ] **Related Breaches**: 3 similar incidents matched by tags
- [ ] **Sources**: Links to original articles and reports

### Timeline Features
- [ ] Vertical timeline visualization on breach detail page
- [ ] Update types displayed with icons: initial discovery, new information, class action, regulatory fine, remediation, resolution
- [ ] Each timeline entry shows date, type, and description
- [ ] Color-coded by update type (e.g., red for fines, blue for new info, green for resolution)

## Intelligence & Matching

### AI Processing
- [ ] Breach deduplication: AI matches variations (Qantas Airways = Qantas = QAN)
- [ ] Detect severity changes (track if impact increases from 1M to 5M records)
- [ ] Handle false positives and duplicate updates across sources
- [ ] Review queue for manually approving AI's breach matching and update classifications

### Classification & Attribution
- [ ] Attack vector taxonomy: phishing, ransomware, API exploit, insider threat, supply chain, misconfiguration
- [ ] Threat actor attribution and tracking
- [ ] CVE/vulnerability cross-reference
- [ ] MITRE ATT&CK technique mapping
- [ ] Severity scoring system (based on records affected, data sensitivity, industry impact)

## User Personalization
- [ ] User accounts and authentication
- [ ] User profiles with preferences
- [ ] Watchlists: track specific countries, industries, companies, or threat actors
- [ ] Save individual breaches and receive notifications on updates
- [ ] Comment system on breach articles (moderated)
- [ ] Customized email alerts based on watchlist criteria
- [ ] Browse history and personalized breach recommendations

## Analytics & Trends (Future)
- [ ] Breach statistics dashboard: charts by industry, country, attack vector, year
- [ ] Trend analysis: breach frequency over time, emerging attack patterns
- [ ] Heat map visualization by geography
- [ ] Most exploited vulnerabilities report
- [ ] Quarterly threat intelligence reports (AI-generated)

## Export & Integration (Future)
- [ ] Export individual breach reports to PDF
- [ ] Export filtered breach lists to CSV/JSON
- [ ] Public RSS feed of new breaches
- [ ] REST API for external access (authentication required)
- [ ] Webhook notifications for real-time alerts

## UI/UX Enhancements (Future)
- [ ] Dark mode toggle
- [ ] Advanced filtering with boolean operators (AND/OR/NOT)
- [ ] Side-by-side breach comparison view
- [ ] Breach case studies (long-form deep dives)
- [ ] Interactive infographics for major breaches
- [ ] Keyboard shortcuts for power users
- [ ] Mobile-responsive design

## Technical Infrastructure
- [ ] Daily cron job for scraper execution
- [ ] Robust error handling for Claude API failures
- [ ] Rate limiting for API calls (both Claude and Supabase)
- [ ] Logging and monitoring for scraper health
- [ ] Database backup strategy
- [ ] Frontend deployment to Vercel
- [ ] Scraper deployment to Render/Railway/VPS
- [ ] Environment variables management (.env files)
- [ ] Git version control with regular commits
- [ ] Supabase connection pooling and optimization