/** 歌本体。どの歌も同じ大きさで載せる(字数で扱いを変えない)。 */
export default function PoemBody({
  body,
  size = "regular",
}: {
  body: string;
  size?: "large" | "regular" | "small";
}) {
  const cls = size === "regular" ? "poemText" : `poemText ${size}`;
  return <p className={cls}>{body}</p>;
}
