CREATE TABLE IF NOT EXISTS visa_request_records (
  id TEXT PRIMARY KEY,
  submitted_at TEXT NOT NULL,
  center_id TEXT NOT NULL,
  center_label TEXT NOT NULL,
  formula TEXT NOT NULL,
  traveller_count INTEGER NOT NULL,
  primary_traveller_name TEXT NOT NULL,
  primary_traveller_email TEXT NOT NULL,
  primary_traveller_phone TEXT NOT NULL,
  appointment_date TEXT NULL,
  appointment_time TEXT NULL,
  status_code INTEGER NOT NULL,
  confirmation_location TEXT NULL,
  encoded_payload TEXT NOT NULL,
  booking_snapshot JSONB NOT NULL,
  dismissed_reminder_at TEXT NULL
);

CREATE INDEX IF NOT EXISTS visa_request_records_submitted_at_idx
ON visa_request_records (submitted_at);

CREATE INDEX IF NOT EXISTS visa_request_records_center_id_idx
ON visa_request_records (center_id);
