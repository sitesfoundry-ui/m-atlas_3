CREATE TABLE IF NOT EXISTS contact_messages (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id    TEXT    NOT NULL UNIQUE,
  full_name     TEXT    NOT NULL,
  email         TEXT    NOT NULL,
  phone         TEXT,
  topic         TEXT    NOT NULL CHECK (topic IN ('general','suggest','press','feedback')),
  specimen_id   TEXT,
  message       TEXT    NOT NULL,
  consent_given INTEGER NOT NULL CHECK (consent_given IN (0,1)),
  status        TEXT    NOT NULL DEFAULT 'new' CHECK (status IN ('new','handled','spam')),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL UNIQUE,
  locale     TEXT    NOT NULL DEFAULT 'mn' CHECK (locale IN ('mn','en')),
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
