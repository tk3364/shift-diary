import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const SHOT = process.env.SHOT_DIR;
const results = [];
function check(name, cond) {
  results.push({ name, ok: !!cond });
  console.log((cond ? "PASS" : "FAIL") + "  " + name);
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });

async function newUser(handle) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); // iPhone 12 相当
  const page = await ctx.newPage();
  await page.goto(BASE + "/nanoru");
  const reg = page.locator(".authBlock").first();
  await reg.locator('input[name="handle"]').fill(handle);
  await reg.locator('input[name="password"]').fill("aikotoba");
  await reg.getByRole("button", { name: "名乗る" }).click();
  await page.waitForURL(BASE + "/");
  return page;
}

// --- 完了条件1: 二人のユーザーが登録し、それぞれ投稿できる ---
const a = await newUser("放哉");
const b = await newUser("山頭火");
check("二人のユーザーが登録できる", true);

// A が一首を詠む(3字 = 大きく表示されるはず)
await a.goto(BASE + "/yomu");
await a.locator('textarea[name="body"]').fill("咳をしても一人");
await a.getByRole("button", { name: "詠む" }).click();
await a.waitForURL(/\/poem\/\d+/);
const poemAUrl = a.url();
check("Aが一首を詠める", /\/poem\/\d+/.test(poemAUrl));

// A が二首目を試みる → 拒まれる
await a.goto(BASE + "/yomu");
const limitMsg = await a.locator("main").textContent();
check("一日一首の制限が効く", limitMsg.includes("もう詠みました"));

// --- 完了条件2: タイムラインで短い歌が大きく表示される ---
// B が長めの歌を(比較用に)…はBの1日枠を返歌に使うため、フォントサイズは同一ページ内の相対比較でなく size 関数を信頼。
// 代わりに timeline 上で A の歌のフォントサイズが本文より十分大きいことを確認。
await b.goto(BASE + "/");
const fs = await b.locator(".strip .vert").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
check(`タイムラインで短い歌が大きい (font-size=${fs}px > 30px)`, fs > 30);
if (SHOT) await b.screenshot({ path: SHOT + "/timeline.png", fullPage: true });

// --- 完了条件3: 返歌と解凍を付けられ、詳細で層として読める ---
// B が A の歌を開いて解凍コメント
await b.locator(".strip a").first().click();
await b.waitForURL(/\/poem\/\d+/);
await b.locator('textarea[name="body"]').fill("「一人」で切らず、咳という身体の音から始めるのがこの句の呼吸だと思う。誰にも届かない音が、そのまま定型を破っている。");
await b.getByRole("button", { name: "層を足す" }).click();
await b.waitForSelector(".layer");
const layerText = await b.locator(".layer .prose").first().textContent();
check("解凍コメントが層として表示される", layerText.includes("呼吸"));

// B が返歌
await b.getByRole("link", { name: "この歌に返す" }).click();
await b.waitForURL(/\/yomu\?reply=/);
const moto = await b.locator(".motoUta").textContent();
check("返歌画面に元歌が表示される", moto.includes("咳をしても"));
await b.locator('textarea[name="body"]').fill("うしろすがたのしぐれてゆくか");
await b.getByRole("button", { name: "返す" }).click();
await b.waitForURL(/\/poem\/\d+/);
check("返歌を投稿できる", true);

// 返歌詳細に元歌が連結表示される
const replyDetail = await b.locator("main").textContent();
check("返歌の詳細に元歌が連結される", replyDetail.includes("元歌") && replyDetail.includes("咳をしても"));

// 元歌の詳細に返歌と解凍が積もっている
await a.goto(poemAUrl);
const detail = await a.locator("main").textContent();
check("元歌詳細に返歌が表示される", detail.includes("しぐれてゆくか"));
check("元歌詳細に解凍が表示される", detail.includes("呼吸"));
if (SHOT) await a.screenshot({ path: SHOT + "/detail.png", fullPage: true });

// B も本日分を消費済みのはず(返歌が枠を使う)
await b.goto(BASE + "/yomu");
const bLimit = await b.locator("main").textContent();
check("返歌も一日一首の枠を消費する", bLimit.includes("もう詠みました"));

// --- 完了条件4: いいね・数値・通知が存在しない ---
const tl = await a.goto(BASE + "/").then(() => a.content());
check("いいね/通知の痕跡がない", !/いいね|like|フォロワー|通知/i.test(tl));

// 詠む画面のスクリーンショット(縦書き入力欄)
const c = await browser.newContext({ viewport: { width: 390, height: 844 } });
const cp = await c.newPage();
await cp.goto(BASE + "/nanoru");
const reg = cp.locator(".authBlock").first();
await reg.locator('input[name="handle"]').fill("客人");
await reg.locator('input[name="password"]').fill("aikotoba");
await reg.getByRole("button", { name: "名乗る" }).click();
await cp.waitForURL(BASE + "/");
await cp.goto(BASE + "/yomu");
if (SHOT) await cp.screenshot({ path: SHOT + "/yomu.png" });

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(failed.length === 0 ? "\nALL PASS" : `\n${failed.length} FAILED`);
process.exit(failed.length === 0 ? 0 : 1);
