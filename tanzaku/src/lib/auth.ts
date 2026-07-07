import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { db, type User } from "./db";

const COOKIE = "tanzaku_session";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

export async function createSession(userId: number): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare(`INSERT INTO sessions (token, user_id) VALUES (?, ?)`).run(token, userId);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.handle FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`
    )
    .get(token) as User | undefined;
  return row ?? null;
}
