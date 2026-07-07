import type React from "react";

/**
 * 「短いほど大きい」の中核。
 * 文字数 n に対する表示フォントサイズ (rem) と、
 * 縦書きコンテナの高さ (rem, CSS 側で vh と min() を取る) を返す。
 */
export function poemLength(body: string): number {
  return [...body.replace(/\s/g, "")].length;
}

export function poemFontRem(body: string, scale = 1): number {
  const n = Math.max(1, poemLength(body));
  const rem = 5.2 * Math.pow(n, -0.42);
  return Math.min(5, Math.max(1.1, rem)) * scale;
}

export function poemHeightRem(body: string, scale = 1): number {
  const n = Math.max(1, poemLength(body));
  const f = poemFontRem(body, scale);
  // 一列あたり最大 16 字。それを超える分は自然に改列させる。
  // 縦書きの一字送りは実測でおよそ 1.3em(字間 0.14em 込み)。
  const column = Math.min(n, 16);
  return Math.max(6, f * 1.32 * column + 1);
}

export function poemStyle(body: string, scale = 1): React.CSSProperties {
  return {
    fontSize: `${poemFontRem(body, scale)}rem`,
    height: `min(${poemHeightRem(body, scale)}rem, 72vh)`,
  };
}
