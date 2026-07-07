const JST = "Asia/Tokyo";

/** 今日の日付 (JST, YYYY-MM-DD) */
export function todayJst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: JST }).format(new Date());
}

/** YYYY-MM-DD → 「七月七日」のような和文表記 */
export function dayLabel(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const today = todayJst();
  const kanji = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  const num = (n: number): string => {
    if (n <= 10) return kanji[n];
    if (n < 20) return "十" + (n % 10 ? kanji[n % 10] : "");
    return kanji[Math.floor(n / 10)] + "十" + (n % 10 ? kanji[n % 10] : "");
  };
  const base = `${num(m)}月${num(d)}日`;
  if (day === today) return `今日 ${base}`;
  const thisYear = Number(today.slice(0, 4));
  return y === thisYear ? base : `${y}年 ${base}`;
}

export function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}
