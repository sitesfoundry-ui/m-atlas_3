CREATE TABLE IF NOT EXISTS contact_messages (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id    TEXT        NOT NULL UNIQUE,
  full_name     TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  phone         TEXT,
  topic         TEXT        NOT NULL CHECK (topic IN ('general','suggest','press','feedback')),
  specimen_id   TEXT,
  message       TEXT        NOT NULL,
  consent_given BOOLEAN     NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new','handled','spam')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      TEXT        NOT NULL UNIQUE,
  locale     TEXT        NOT NULL DEFAULT 'mn' CHECK (locale IN ('mn','en')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase exposes public tables through its own web API. The app never uses that API,
-- so lock it: with RLS on and no policies, the public key can read and write nothing.
-- The server connects as the database owner, which bypasses RLS.
ALTER TABLE contact_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
