"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, poemCountOn, poemById } from "./db";
import { createSession, currentUser, destroySession, hashPassword, verifyPassword } from "./auth";
import { todayJst } from "./time";

export type ActionState = { error: string } | null;

const MAX_POEM = 60;
const MAX_ANNOTATION = 2000;

function len(s: string): number {
  return [...s].length;
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const handle = String(formData.get("handle") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!/^\S{1,16}$/u.test(handle)) {
    return { error: "名は一〜十六字、空白は使えません。" };
  }
  if (password.length < 4) {
    return { error: "合言葉は四字以上でお願いします。" };
  }
  const exists = db.prepare(`SELECT id FROM users WHERE handle = ?`).get(handle);
  if (exists) {
    return { error: "その名はすでに誰かのものです。" };
  }
  const info = db
    .prepare(`INSERT INTO users (handle, password_hash) VALUES (?, ?)`)
    .run(handle, hashPassword(password));
  await createSession(Number(info.lastInsertRowid));
  redirect("/");
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const handle = String(formData.get("handle") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const user = db
    .prepare(`SELECT id, password_hash FROM users WHERE handle = ?`)
    .get(handle) as { id: number; password_hash: string } | undefined;
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "名か合言葉が違うようです。" };
  }
  await createSession(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function composePoem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await currentUser();
  if (!user) redirect("/nanoru");

  const body = String(formData.get("body") ?? "").trim();
  const replyToRaw = formData.get("reply_to");
  const replyTo = replyToRaw ? Number(replyToRaw) : null;

  if (len(body) === 0) return { error: "まだ何も書かれていません。" };
  if (len(body) > MAX_POEM) return { error: `長すぎます。六十字まで——削れるはずです。` };
  if (replyTo !== null && !poemById(replyTo)) return { error: "元の歌が見つかりません。" };

  const day = todayJst();
  if (poemCountOn(user.id, day) >= 1) {
    return { error: "今日の一首はもう詠みました。続きはまた明日。" };
  }

  const info = db
    .prepare(`INSERT INTO poems (user_id, body, day, reply_to_poem_id) VALUES (?, ?, ?, ?)`)
    .run(user.id, body, day, replyTo);
  revalidatePath("/");
  redirect(`/poem/${info.lastInsertRowid}`);
}

export async function annotate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await currentUser();
  if (!user) redirect("/nanoru");

  const poemId = Number(formData.get("poem_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!poemById(poemId)) return { error: "歌が見つかりません。" };
  if (len(body) === 0) return { error: "まだ何も書かれていません。" };
  if (len(body) > MAX_ANNOTATION) return { error: "解凍が長すぎます。二千字までに。" };

  db.prepare(`INSERT INTO annotations (poem_id, user_id, body) VALUES (?, ?, ?)`).run(
    poemId,
    user.id,
    body
  );
  revalidatePath(`/poem/${poemId}`);
  return null;
}
