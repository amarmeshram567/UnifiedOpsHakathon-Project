
-- Users
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          TEXT        NOT NULL,
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspaces
CREATE TABLE workspaces (
    id              SERIAL PRIMARY KEY,
    slug            TEXT        NOT NULL UNIQUE,
    name            TEXT        NOT NULL,
    address         TEXT,
    time_zone       TEXT        NOT NULL,
    contact_email   TEXT        NOT NULL,
    onboarding_step INT         NOT NULL DEFAULT 2,
    active          BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- memberships  (users <-> workspaces, role: OWNER | STAFF)
CREATE TABLE memberships (
    id           SERIAL PRIMARY KEY,
    user_id      INT         NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    workspace_id INT         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role         TEXT        NOT NULL CHECK (role IN ('OWNER', 'STAFF')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, workspace_id)
);

-- integration_channels  (EMAIL | SMS per workspace)
CREATE TABLE integration_channels (
    id           SERIAL PRIMARY KEY,
    workspace_id INT     NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    type         TEXT    NOT NULL CHECK (type IN ('EMAIL', 'SMS')),
    enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    from_email   TEXT,
    from_phone   TEXT,
    UNIQUE (workspace_id, type)
);

-- contact_form_settings  (one row per workspace)
CREATE TABLE contact_form_settings (
    id           SERIAL PRIMARY KEY,
    workspace_id INT     NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
    enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    welcome_text TEXT
);

-- contacts
CREATE TABLE contacts (
    id           SERIAL PRIMARY KEY,
    workspace_id INT         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name         TEXT        NOT NULL,
    email        TEXT,
    phone        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- conversations
CREATE TABLE conversations (
    id                SERIAL PRIMARY KEY,
    workspace_id      INT         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id        INT         NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
    last_inbound_at   TIMESTAMPTZ,
    last_outbound_at  TIMESTAMPTZ,
    automation_paused BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- messages
CREATE TABLE messages (
    id              SERIAL PRIMARY KEY,
    conversation_id INT         NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    direction       TEXT        NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    channel_type    TEXT        NOT NULL CHECK (channel_type IN ('EMAIL', 'SMS')),
    body            TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- booking_types
CREATE TABLE booking_types (
    id           SERIAL PRIMARY KEY,
    workspace_id INT  NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    duration_min INT  NOT NULL,
    location     TEXT
);

-- availabilities
CREATE TABLE availabilities (
    id           SERIAL PRIMARY KEY,
    workspace_id INT  NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    day_of_week  INT  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time   TEXT NOT NULL,
    end_time     TEXT NOT NULL
);

-- bookings
CREATE TABLE bookings (
    id              SERIAL PRIMARY KEY,
    workspace_id    INT         NOT NULL REFERENCES workspaces(id)    ON DELETE CASCADE,
    contact_id      INT         NOT NULL REFERENCES contacts(id)      ON DELETE CASCADE,
    booking_type_id INT         NOT NULL REFERENCES booking_types(id) ON DELETE RESTRICT,
    start_at        TIMESTAMPTZ NOT NULL,
    end_at          TIMESTAMPTZ NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'SCHEDULED'
                                CHECK (status IN ('SCHEDULED', 'COMPLETED', 'NO_SHOW', 'CANCELLED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- inventory_items
CREATE TABLE inventory_items (
    id           SERIAL PRIMARY KEY,
    workspace_id INT         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name         TEXT        NOT NULL,
    unit         TEXT,
    on_hand      INT         NOT NULL DEFAULT 0,
    low_stock_at INT         NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- booking_type_resources  (inventory consumed per booking type)
CREATE TABLE booking_type_resources (
    id                  SERIAL PRIMARY KEY,
    workspace_id        INT NOT NULL REFERENCES workspaces(id)    ON DELETE CASCADE,
    booking_type_id     INT NOT NULL REFERENCES booking_types(id) ON DELETE CASCADE,
    inventory_item_id   INT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_per_booking INT NOT NULL DEFAULT 1
);

-- inventory_usage  (audit log of stock changes)
CREATE TABLE inventory_usage (
    id                SERIAL PRIMARY KEY,
    workspace_id      INT         NOT NULL REFERENCES workspaces(id)      ON DELETE CASCADE,
    inventory_item_id INT         NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    booking_id        INT                  REFERENCES bookings(id)        ON DELETE SET NULL,
    delta             INT         NOT NULL,
    reason            TEXT        NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- form_templates
CREATE TABLE form_templates (
    id              SERIAL PRIMARY KEY,
    workspace_id    INT  NOT NULL REFERENCES workspaces(id)    ON DELETE CASCADE,
    booking_type_id INT           REFERENCES booking_types(id) ON DELETE SET NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    fields_json     JSONB NOT NULL DEFAULT '{"fields":[]}'
);

-- form_responses
CREATE TABLE form_responses (
    id           SERIAL PRIMARY KEY,
    workspace_id INT         NOT NULL REFERENCES workspaces(id)     ON DELETE CASCADE,
    booking_id   INT                  REFERENCES bookings(id)       ON DELETE SET NULL,
    template_id  INT         NOT NULL REFERENCES form_templates(id) ON DELETE RESTRICT,
    token        TEXT        NOT NULL UNIQUE,
    status       TEXT        NOT NULL DEFAULT 'PENDING'
                             CHECK (status IN ('PENDING', 'OVERDUE', 'COMPLETED')),
    due_at       TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    answers_json JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- alerts
CREATE TABLE alerts (
    id           SERIAL PRIMARY KEY,
    workspace_id INT         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    severity     TEXT        NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    type         TEXT        NOT NULL,
    title        TEXT        NOT NULL,
    body         TEXT,
    link_path    TEXT,
    resolved_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- event_logs  (append-only audit trail)
CREATE TABLE event_logs (
    id           SERIAL PRIMARY KEY,
    workspace_id INT         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    event        TEXT        NOT NULL,
    payload_json JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  Indexes
-- ============================================================
CREATE INDEX ON memberships      (workspace_id);
CREATE INDEX ON contacts         (workspace_id);
CREATE INDEX ON conversations    (workspace_id);
CREATE INDEX ON conversations    (contact_id);
CREATE INDEX ON messages         (conversation_id);
CREATE INDEX ON bookings         (workspace_id);
CREATE INDEX ON bookings         (contact_id);
CREATE INDEX ON bookings         (status);
CREATE INDEX ON bookings         (start_at);
CREATE INDEX ON booking_types    (workspace_id);
CREATE INDEX ON availabilities   (workspace_id);
CREATE INDEX ON inventory_items  (workspace_id);
CREATE INDEX ON inventory_usage  (workspace_id);
CREATE INDEX ON inventory_usage  (inventory_item_id);
CREATE INDEX ON form_templates   (workspace_id);
CREATE INDEX ON form_responses   (workspace_id);
CREATE INDEX ON form_responses   (booking_id);
CREATE INDEX ON form_responses   (token);
CREATE INDEX ON form_responses   (status);
CREATE INDEX ON alerts           (workspace_id);
CREATE INDEX ON alerts           (resolved_at);
CREATE INDEX ON event_logs       (workspace_id);

