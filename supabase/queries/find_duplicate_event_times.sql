-- Find duplicate event rows (same calendar day, title, and clock time).
-- Run in Supabase SQL editor or psql against your project database.

SELECT date, title, time, COUNT(*) AS row_count
FROM public.events
GROUP BY date, title, time
HAVING COUNT(*) > 1
ORDER BY date DESC, title, time;

-- Optional: list the duplicate row ids (adjust table name if different)
-- SELECT e.id, e.date, e.title, e.time, e.created_at
-- FROM public.events e
-- INNER JOIN (
--   SELECT date, title, time
--   FROM public.events
--   GROUP BY date, title, time
--   HAVING COUNT(*) > 1
-- ) d ON e.date = d.date AND e.title = d.title AND e.time = d.time
-- ORDER BY e.date, e.title, e.time, e.created_at;
