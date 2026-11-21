# Data & Privacy Reference

## Database tables

Static content (specimens, categories, volumes, field notes, and interface copy) lives in code under `src/content/` and `src/i18n/`. The database stores only visitor submissions sent through the forms.

### `contact_messages`

| Column | Type (PostgreSQL) | Personal data | Notes |
|---|---|---|---|
| `id` | `BIGINT` (identity) | No | Primary key |
| `request_id` | `TEXT` (unique) | No | Client UUID for idempotent retries |
| `full_name` | `TEXT` | Yes | 1–120 characters |
| `email` | `TEXT` | Yes | Validated e-mail, max 254 characters |
| `phone` | `TEXT` (nullable) | Yes | Optional, max 40 characters |
| `topic` | `TEXT` | No | `general`, `suggest`, `press`, or `feedback` |
| `specimen_id` | `TEXT` (nullable) | No | Allowed only when `topic = 'feedback'` |
| `message` | `TEXT` | Yes | 1–2000 characters |
| `consent_given` | `BOOLEAN` | No | Must be `true` on submission |
| `status` | `TEXT` | No | `new`, `handled`, or `spam` |
| `created_at` | `TIMESTAMPTZ` | No | UTC ISO-8601 timestamp |

### `newsletter_subscribers`

| Column | Type (PostgreSQL) | Personal data | Notes |
|---|---|---|---|
| `id` | `BIGINT` (identity) | No | Primary key |
| `email` | `TEXT` (unique) | Yes | Lower-cased, max 254 characters |
| `locale` | `TEXT` | No | `mn` or `en` |
| `created_at` | `TIMESTAMPTZ` | No | UTC ISO-8601 timestamp |

## Retention & access

- **Retention rule:** Contact messages (`contact_messages`) are deleted after **24 months**, matching the privacy notice. Newsletter subscriptions (`newsletter_subscribers`) are kept until the subscriber requests removal.
- **Reading submissions:** There is no admin UI in this phase. In production on Supabase / PostgreSQL, inspect rows directly in the **Supabase Table Editor** (the Express server connects as the database owner, while Row Level Security blocks all public API access).
- **Logging:** Server logs record only `request_id` and error codes; personal data is never logged.
