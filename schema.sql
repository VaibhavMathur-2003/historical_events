-- DDL for historical_events_db

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS historical_events_db (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name VARCHAR(255) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_date - start_date)) / 60
  ) STORED,
  parent_id UUID REFERENCES historical_events_db(event_id) ON DELETE SET NULL,
  research_value INTEGER,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historical_events_db_start_date ON historical_events_db(start_date);
CREATE INDEX IF NOT EXISTS idx_historical_events_db_end_date ON historical_events_db(end_date);
CREATE INDEX IF NOT EXISTS idx_historical_events_db_parent_id ON historical_events_db(parent_id);
CREATE INDEX IF NOT EXISTS idx_historical_events_db_metadata_jsonb_gin ON historical_events_db USING GIN (metadata); 