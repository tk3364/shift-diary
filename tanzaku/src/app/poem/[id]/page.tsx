import Link from "next/link";
import { notFound } from "next/navigation";
import PoemBody from "@/components/PoemBody";
import { AnnotateForm } from "@/components/forms";
import { currentUser } from "@/lib/auth";
import { annotationsOf, poemById, repliesTo } from "@/lib/db";
import { timeLabel } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function PoemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poem = poemById(Number(id));
  if (!poem) notFound();

  const user = await currentUser();
  const motoUta = poem.reply_to_poem_id !== null ? poemById(poem.reply_to_poem_id) : undefined;
  const henka = repliesTo(poem.id);
  const layers = annotationsOf(poem.id);

  return (
    <main>
      <section className="poemStage">
        <PoemBody body={poem.body} />
        <p className="attrib">
          {poem.handle}
          {"　"}
          {timeLabel(poem.created_at)}
        </p>
      </section>

      {motoUta && (
        <section className="motoUta">
          <p className="label">元歌</p>
          <Link href={`/poem/${motoUta.id}`}>
            <PoemBody body={motoUta.body} scale={0.45} />
          </Link>
          <p className="attrib">{motoUta.handle}</p>
        </section>
      )}

      <nav className="actRow">
        {user ? (
          <Link href={`/yomu?reply=${poem.id}`}>この歌に返す</Link>
        ) : (
          <Link href="/nanoru">名乗ると、返歌と解凍ができます</Link>
        )}
      </nav>

      {henka.length > 0 && (
        <section>
          <h2 className="sectionTitle">返歌</h2>
          {henka.map((reply) => (
            <article key={reply.id} className="henka">
              <Link href={`/poem/${reply.id}`} aria-label="返歌の詳細へ">
                <PoemBody body={reply.body} scale={0.6} />
              </Link>
              <p className="attrib">{reply.handle}</p>
            </article>
          ))}
        </section>
      )}

      <section>
        <h2 className="sectionTitle">解凍</h2>
        {layers.length === 0 ? (
          <p className="quietNote">まだ誰も読み解いていません。最初の層をどうぞ。</p>
        ) : (
          layers.map((layer) => (
            <article key={layer.id} className="layer">
              <p className="meta">
                {layer.handle}
                {"　"}
                {timeLabel(layer.created_at)}
              </p>
              <p className="prose">{layer.body}</p>
            </article>
          ))
        )}
        {user && <AnnotateForm poemId={poem.id} />}
      </section>
    </main>
  );
}
