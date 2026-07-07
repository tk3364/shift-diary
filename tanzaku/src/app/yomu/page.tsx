import Link from "next/link";
import { redirect } from "next/navigation";
import PoemBody from "@/components/PoemBody";
import { ComposeForm } from "@/components/forms";
import { currentUser } from "@/lib/auth";
import { poemById, poemCountOn } from "@/lib/db";
import { todayJst } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function YomuPage({
  searchParams,
}: {
  searchParams: Promise<{ reply?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/nanoru");

  const { reply } = await searchParams;
  const motoUta = reply ? poemById(Number(reply)) : undefined;

  if (poemCountOn(user.id, todayJst()) >= 1) {
    return (
      <main>
        <p className="empty">
          今日の一首は、もう詠みました。
          <br />
          続きはまた明日。
        </p>
        <nav className="actRow">
          <Link href="/">今日の歌を眺める</Link>
        </nav>
      </main>
    );
  }

  return (
    <main>
      {motoUta && (
        <section className="motoUta">
          <p className="label">元歌</p>
          <Link href={`/poem/${motoUta.id}`}>
            <PoemBody body={motoUta.body} scale={0.5} />
          </Link>
          <p className="attrib">{motoUta.handle}</p>
        </section>
      )}
      <ComposeForm replyTo={motoUta?.id} />
      <p className="fieldNote">一日に詠めるのは、一首だけです。返歌もその一首に数えます。</p>
    </main>
  );
}
