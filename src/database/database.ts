import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { applicationConfig } from "../config/application.config.ts";

mkdirSync(dirname(applicationConfig.databasePath), { recursive: true });

export const db = new Database(applicationConfig.databasePath, { create: true });
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA busy_timeout = 5000;");

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS generation_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      network TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      format TEXT NOT NULL,
      mode TEXT NOT NULL,
      seed TEXT,
      prefix TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generated_numbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL,
      normalized_number TEXT NOT NULL,
      local_number TEXT NOT NULL,
      network TEXT NOT NULL,
      prefix TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (batch_id) REFERENCES generation_batches(id) ON DELETE CASCADE,
      UNIQUE(batch_id, normalized_number)
    );

    CREATE INDEX IF NOT EXISTS idx_generated_numbers_normalized
      ON generated_numbers(normalized_number);

    CREATE INDEX IF NOT EXISTS idx_generated_numbers_network
      ON generated_numbers(network);

    CREATE INDEX IF NOT EXISTS idx_generation_batches_created_at
      ON generation_batches(created_at DESC);
  `);
}
