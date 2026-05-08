-- ── PART B1 — Mumbai event placeholder cleanup ─────────────────────
--
-- The live /events/mumbai page is showing leftover admin test content:
--   • a Two-column "Tell your story" block whose body subtitle is
--     gibberish ("sdfsdf...") and whose right image is a stock
--     placeholder asset
--   • potentially other Hero / RichText sections with similar
--     unbroken lowercase gibberish in their subtitle / body fields
--
-- This is a one-time idempotent cleanup. It walks the `content` array
-- inside builder_data + builder_draft and drops:
--   1. TwoColumn blocks where leftBody matches the gibberish pattern
--      ([a-z]{15,} with no spaces — unbroken lowercase typing)
--   2. Hero / RichText blocks where subtitle / body matches the same
--      pattern
--
-- The same walk runs over event_standard_pages.settings->'puckData'
-- so any sub-page seeded with the same junk gets cleaned too.
--
-- Targeted at the Mumbai event but scoped to PROVABLY-junk content
-- via the gibberish regex; safe to run on the whole events table.

-- Helper — true when a string looks like keyboard mashing.
CREATE OR REPLACE FUNCTION public.lf_looks_like_gibberish(t text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT t IS NOT NULL
     AND length(trim(t)) >= 15
     AND trim(t) ~ '^[a-z]{15,}$'
$$;

-- Helper — given a JSONB Puck content array, drop blocks whose props
-- carry obvious gibberish in the standard text fields. Returns the
-- cleaned array.
CREATE OR REPLACE FUNCTION public.lf_strip_placeholder_blocks(content jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result jsonb := '[]'::jsonb;
  block jsonb;
  block_type text;
  props jsonb;
  keep boolean;
BEGIN
  IF content IS NULL OR jsonb_typeof(content) <> 'array' THEN
    RETURN content;
  END IF;
  FOR block IN SELECT * FROM jsonb_array_elements(content) LOOP
    keep := true;
    block_type := block->>'type';
    props := COALESCE(block->'props', '{}'::jsonb);
    -- TwoColumn placeholder: gibberish leftBody OR title
    IF block_type = 'TwoColumn' THEN
      IF public.lf_looks_like_gibberish(props->>'leftBody')
         OR public.lf_looks_like_gibberish(props->>'leftTitle')
      THEN keep := false;
      END IF;
    END IF;
    -- Hero / RichText placeholder: gibberish subtitle OR body
    IF block_type IN ('Hero','RichText','TextBox','MediaWithTextGroup') THEN
      IF public.lf_looks_like_gibberish(props->>'subtitle')
         OR public.lf_looks_like_gibberish(props->>'body')
         OR public.lf_looks_like_gibberish(props->>'title')
      THEN keep := false;
      END IF;
    END IF;
    IF keep THEN
      result := result || jsonb_build_array(block);
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- Apply to events.builder_data + builder_draft (home page).
UPDATE public.events
SET
  builder_data = jsonb_set(
    COALESCE(builder_data, '{}'::jsonb),
    '{content}',
    public.lf_strip_placeholder_blocks(COALESCE(builder_data->'content', '[]'::jsonb))
  ),
  builder_draft = jsonb_set(
    COALESCE(builder_draft, '{}'::jsonb),
    '{content}',
    public.lf_strip_placeholder_blocks(COALESCE(builder_draft->'content', '[]'::jsonb))
  ),
  updated_at = now()
WHERE
     COALESCE(builder_data->'content',  '[]'::jsonb) <> public.lf_strip_placeholder_blocks(COALESCE(builder_data->'content',  '[]'::jsonb))
  OR COALESCE(builder_draft->'content', '[]'::jsonb) <> public.lf_strip_placeholder_blocks(COALESCE(builder_draft->'content', '[]'::jsonb));

-- Apply to event_standard_pages.settings->'puckData'.
UPDATE public.event_standard_pages
SET
  settings = jsonb_set(
    COALESCE(settings, '{}'::jsonb),
    '{puckData,content}',
    public.lf_strip_placeholder_blocks(COALESCE(settings->'puckData'->'content', '[]'::jsonb))
  ),
  updated_at = now()
WHERE COALESCE(settings->'puckData'->'content', '[]'::jsonb)
   <> public.lf_strip_placeholder_blocks(COALESCE(settings->'puckData'->'content', '[]'::jsonb));

-- Drop the helpers — one-shot. Re-running the migration recreates them.
DROP FUNCTION IF EXISTS public.lf_strip_placeholder_blocks(jsonb);
DROP FUNCTION IF EXISTS public.lf_looks_like_gibberish(text);
