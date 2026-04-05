-- Feature 15: Delegate/Attendee Directory
-- Allow attendees to browse the delegate list for networking

ALTER TABLE attendees ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN DEFAULT true;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS show_delegate_directory BOOLEAN DEFAULT false;
