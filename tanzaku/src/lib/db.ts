import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS poems (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  day TEXT NOT NULL,
  reply_to_poem_id INTEGER REFERENCES poems(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_poems_day ON poems(day);
CREATE INDEX IF NOT EXISTS idx_poems_user_day ON poems(user_id, day);
CREATE INDEX IF NOT EXISTS idx_poems_reply ON poems(reply_to_poem_id);
CREATE TABLE IF NOT EXISTS annotations (
  id INTEGER PRIMARY KEY,
  poem_id INTEGER NOT NULL REFERENCES poems(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_annotations_poem ON annotations(poem_id);
`;

function open(): Database.Database {
  const dir = path.join(process.cwd(), "var");
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, "tanzaku.db"));
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  return db;
}

// dev の HMR でコネクションが増殖しないよう globalThis に保持する
const g = globalThis as unknown as { __tanzakuDb?: Database.Database };
export const db: Database.Database = g.__tanzakuDb ?? (g.__tanzakuDb = open());

export interface User {
  id: number;
  handle: string;
}

export interface Poem {
  id: number;
  user_id: number;
  handle: string;
  body: string;
  day: string;
  reply_to_poem_id: number | null;
  created_at: string;
}

export interface Annotation {
  id: number;
  poem_id: number;
  user_id: number;
  handle: string;
  body: string;
  created_at: string;
}

const POEM_SELECT = `
  SELECT p.id, p.user_id, u.handle, p.body, p.day, p.reply_to_poem_id, p.created_at
  FROM poems p JOIN users u ON u.id = p.user_id
`;

export function poemsOfDay(day: string): Poem[] {
  return db
    .prepare(`${POEM_SELECT} WHERE p.day = ? ORDER BY p.created_at ASC`)
    .all(day) as Poem[];
}

export function poemById(id: number): Poem | undefined {
  return db.prepare(`${POEM_SELECT} WHERE p.id = ?`).get(id) as Poem | undefined;
}

export function repliesTo(poemId: number): Poem[] {
  return db
    .prepare(`${POEM_SELECT} WHERE p.reply_to_poem_id = ? ORDER BY p.created_at ASC`)
    .all(poemId) as Poem[];
}

export function annotationsOf(poemId: number): Annotation[] {
  return db
    .prepare(
      `SELECT a.id, a.poem_id, a.user_id, u.handle, a.body, a.created_at
       FROM annotations a JOIN users u ON u.id = a.user_id
       WHERE a.poem_id = ? ORDER BY a.created_at ASC`
    )
    .all(poemId) as Annotation[];
}

export function poemCountOn(userId: number, day: string): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM poems WHERE user_id = ? AND day = ?`)
    .get(userId, day) as { n: number };
  return row.n;
}

/** 指定日以前で歌が存在する直近の日(その日自身を含む) */
export function latestDayWithPoems(onOrBefore: string): string | undefined {
  const row = db
    .prepare(`SELECT day FROM poems WHERE day <= ? ORDER BY day DESC LIMIT 1`)
    .get(onOrBefore) as { day: string } | undefined;
  return row?.day;
}

export function adjacentDays(day: string): { prev?: string; next?: string } {
  const prev = db
    .prepare(`SELECT day FROM poems WHERE day < ? ORDER BY day DESC LIMIT 1`)
    .get(day) as { day: string } | undefined;
  const next = db
    .prepare(`SELECT day FROM poems WHERE day > ? ORDER BY day ASC LIMIT 1`)
    .get(day) as { day: string } | undefined;
  return { prev: prev?.day, next: next?.day };
}
