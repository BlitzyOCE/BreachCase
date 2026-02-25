DELETE FROM breach_updates;
DELETE FROM breach_tags;
DELETE FROM sources;
DELETE FROM breach_views;
DELETE FROM breaches;

TRUNCATE 
  comments,
  saved_breaches,
  breach_views,
  breach_updates,
  breach_tags,
  company_aliases,
  sources,
  breaches
CASCADE;