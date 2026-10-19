ALTER TABLE visa_request_records
ADD COLUMN IF NOT EXISTS submitter_name TEXT NOT NULL DEFAULT '';

ALTER TABLE visa_request_records
ADD COLUMN IF NOT EXISTS submitter_email TEXT NOT NULL DEFAULT '';
