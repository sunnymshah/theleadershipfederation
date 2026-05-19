-- Plan A — external EventCreate microsite link per event.
--
-- Under Plan A the public-facing event page is built in EventCreate (a
-- hosted, event-templated drag-and-drop builder). The TLF admin console
-- stays the source of truth for data, registration, payments and
-- check-in. This column stores the live EventCreate microsite URL so
-- the admin can link out to it and the public /events/[slug] route can
-- redirect visitors to it.
ALTER TABLE events ADD COLUMN IF NOT EXISTS eventcreate_url text;

COMMENT ON COLUMN events.eventcreate_url IS
  'External EventCreate microsite URL for this event (Plan A). When set, the public event page links/redirects here.';
