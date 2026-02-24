CREATE TABLE IF NOT EXISTS file_metadata (
    id TEXT PRIMARY KEY,
    original_filename TEXT NOT NULL,
    iv TEXT NOT NULL,
    authTag TEXT NOT NULL,
    hash TEXT NOT NULL,
    signature TEXT NOT NULL,
    wrapped_aes_key TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
