import Link from "next/link";
import PoemBody from "@/components/PoemBody";
import { adjacentDays, latestDayWithPoems, poemsOfDay } from "@/lib/db";
import { dayLabel, todayJst } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Timeline({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const today = todayJst();
  // 指定がなければ「今日」。今日にまだ歌がなければ、歌のある直近の日へ。
  const day =
    d && /^\d{4}-\d{2}-\d{2}$/.test(d)
      ? d
      : poemsOfDay(today).length > 0
        ? today
        : (latestDayWithPoems(today) ?? today);

  const poems = poemsOfDay(day);
  const { prev, next } = adjacentDays(day);

  return (
    <main>
      <nav className="dayNav">
        {prev ? <Link href={`/?d=${prev}`}>← 前の日</Link> : <span className="mute">←</span>}
        <span className="day">{dayLabel(day)}</span>
        {next ? <Link href={`/?d=${next}`}>次の日 →</Link> : <span className="mute">→</span>}
      </nav>

      {poems.length === 0 ? (
        <p className="empty">この日はまだ、何も詠まれていません。</p>
      ) : (
        <section>
          {poems.map((poem) => (
            <article key={poem.id} className="strip">
              <Link href={`/poem/${poem.id}`} aria-label="歌の詳細へ">
                <PoemBody body={poem.body} />
              </Link>
              <footer className="attrib">
                {poem.handle}
                {poem.reply_to_poem_id !== null && (
                  <>
                    {"　"}
                    <Link href={`/poem/${poem.reply_to_poem_id}`}>返歌</Link>
                  </>
                )}
              </footer>
            </article>
          ))}
        </section>
      )}

      {poems.length > 0 && <p className="dayEnd">この日は、ここまで。</p>}
    </main>
  );
}
