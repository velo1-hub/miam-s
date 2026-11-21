-- Business-only repositioning: walkthroughs are the only online booking, no public pricing.
alter table bookings add column if not exists company text;
drop table if exists pricing_rules;
