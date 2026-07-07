import { poemStyle } from "@/lib/size";

/** 縦書き・可変サイズの歌本体。scale で控えめ表示(返歌一覧など)にできる。 */
export default function PoemBody({ body, scale = 1 }: { body: string; scale?: number }) {
  return (
    <div className="body">
      <p className="vert" style={poemStyle(body, scale)}>
        {body}
      </p>
    </div>
  );
}
