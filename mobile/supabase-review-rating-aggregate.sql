-- Canonical fix for stale caterers.rating / review_count.
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- The mobile app no longer depends on these columns (it aggregates `reviews`
-- live), but the vendor + admin web apps still read them, so keep them in sync.
--
-- Copy of vendors-legacy/supabase/migrations/20260918000000_review_rating_aggregate.sql

CREATE OR REPLACE FUNCTION public.update_caterer_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.caterer_id, OLD.caterer_id);
  UPDATE public.caterers c
  SET
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE caterer_id = target_id),
    rating = COALESCE(
      (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE caterer_id = target_id),
      0
    ),
    updated_at = now()
  WHERE c.id = target_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS reviews_update_caterer_rating ON public.reviews;
CREATE TRIGGER reviews_update_caterer_rating
AFTER INSERT OR UPDATE OF rating OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_caterer_rating();

-- Backfill existing aggregates (one-time).
UPDATE public.caterers c
SET
  review_count = COALESCE(r.cnt, 0),
  rating = COALESCE(r.avg_rating, 0),
  updated_at = now()
FROM (
  SELECT caterer_id, COUNT(*) AS cnt, ROUND(AVG(rating)::numeric, 1) AS avg_rating
  FROM public.reviews
  GROUP BY caterer_id
) r
WHERE c.id = r.caterer_id;
