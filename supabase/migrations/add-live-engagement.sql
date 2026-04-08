-- =========================================================================
-- Live Engagement: Polls, Q&A, Session Bookmarks, Networking
-- =========================================================================

-- Live Polls
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  poll_type TEXT NOT NULL DEFAULT 'single' CHECK (poll_type IN ('single', 'multiple', 'rating', 'word_cloud')),
  options JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  show_results BOOLEAN DEFAULT false,
  allow_anonymous BOOLEAN DEFAULT true,
  max_votes_per_user INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES attendees(id) ON DELETE SET NULL,
  selected_options JSONB NOT NULL DEFAULT '[]',
  text_response TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_poll_vote UNIQUE(poll_id, attendee_id)
);

-- Live Q&A
CREATE TABLE IF NOT EXISTS qa_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  attendee_id UUID REFERENCES attendees(id) ON DELETE SET NULL,
  author_name TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'answered', 'rejected', 'pinned')),
  upvotes INTEGER DEFAULT 0,
  is_anonymous BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS qa_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES qa_questions(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES attendees(id) ON DELETE SET NULL,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_qa_upvote UNIQUE(question_id, attendee_id)
);

-- Session Bookmarks (attendee personal agenda)
CREATE TABLE IF NOT EXISTS session_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  reminder_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_session_bookmark UNIQUE(attendee_id, session_id)
);

-- Networking Requests
CREATE TABLE IF NOT EXISTS networking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  from_attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  to_attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  meeting_time TIMESTAMPTZ,
  meeting_location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT unique_networking_request UNIQUE(from_attendee_id, to_attendee_id, event_id),
  CONSTRAINT no_self_request CHECK (from_attendee_id != to_attendee_id)
);

-- RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE networking_requests ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Authenticated manage polls" ON polls FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated manage poll_votes" ON poll_votes FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated manage qa_questions" ON qa_questions FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated manage qa_upvotes" ON qa_upvotes FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated manage session_bookmarks" ON session_bookmarks FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated manage networking_requests" ON networking_requests FOR ALL TO authenticated USING (true);

-- Public access for voting/questions (anon)
CREATE POLICY "Anon can vote" ON poll_votes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can read votes" ON poll_votes FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can submit questions" ON qa_questions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can read questions" ON qa_questions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can upvote" ON qa_upvotes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can read polls" ON polls FOR SELECT TO anon USING (status IN ('active', 'closed'));
CREATE POLICY "Anon can read bookmarks" ON session_bookmarks FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can manage bookmarks" ON session_bookmarks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can delete bookmarks" ON session_bookmarks FOR DELETE TO anon USING (true);
CREATE POLICY "Anon can read networking" ON networking_requests FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can create networking" ON networking_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update networking" ON networking_requests FOR UPDATE TO anon USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_polls_event ON polls(event_id);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_event ON qa_questions(event_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_session ON qa_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_status ON qa_questions(status);
CREATE INDEX IF NOT EXISTS idx_qa_upvotes_question ON qa_upvotes(question_id);
CREATE INDEX IF NOT EXISTS idx_session_bookmarks_attendee ON session_bookmarks(attendee_id);
CREATE INDEX IF NOT EXISTS idx_networking_event ON networking_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_networking_from ON networking_requests(from_attendee_id);
CREATE INDEX IF NOT EXISTS idx_networking_to ON networking_requests(to_attendee_id);
