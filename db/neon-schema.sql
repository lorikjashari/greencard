CREATE TABLE IF NOT EXISTS app_documents (
  collection text NOT NULL,
  id text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection, id)
);

CREATE INDEX IF NOT EXISTS app_documents_collection_idx
  ON app_documents (collection, created_at);

CREATE INDEX IF NOT EXISTS app_documents_data_gin_idx
  ON app_documents USING gin (data jsonb_path_ops);

CREATE TABLE IF NOT EXISTS app_blobs (
  key text PRIMARY KEY,
  data bytea NOT NULL,
  content_type text NOT NULL,
  bytes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
