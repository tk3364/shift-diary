"use client";

import { useActionState, useState } from "react";
import { register, login, composePoem, annotate, type ActionState } from "@/lib/actions";

export function AuthForms() {
  const [regState, regAction, regPending] = useActionState<ActionState, FormData>(register, null);
  const [logState, logAction, logPending] = useActionState<ActionState, FormData>(login, null);

  return (
    <div className="authGrid">
      <section className="authBlock">
        <h2>はじめての方</h2>
        <form action={regAction} className="formCol">
          <label>
            名(ハンドル)
            <input type="text" name="handle" maxLength={16} autoComplete="username" required />
          </label>
          <label>
            合言葉
            <input
              type="password"
              name="password"
              minLength={4}
              autoComplete="new-password"
              required
            />
          </label>
          {regState?.error && <p className="errorNote">{regState.error}</p>}
          <button type="submit" disabled={regPending}>
            名乗る
          </button>
        </form>
      </section>

      <section className="authBlock">
        <h2>ふたたびの方</h2>
        <form action={logAction} className="formCol">
          <label>
            名
            <input type="text" name="handle" maxLength={16} autoComplete="username" required />
          </label>
          <label>
            合言葉
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
          {logState?.error && <p className="errorNote">{logState.error}</p>}
          <button type="submit" disabled={logPending}>
            戻る
          </button>
        </form>
      </section>
    </div>
  );
}

export function ComposeForm({ replyTo }: { replyTo?: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(composePoem, null);
  const [count, setCount] = useState(0);

  return (
    <form action={action} className="formCol">
      {replyTo !== undefined && <input type="hidden" name="reply_to" value={replyTo} />}
      <textarea
        className="vertInput"
        name="body"
        maxLength={60}
        autoFocus
        onChange={(e) => setCount([...e.target.value.trim()].length)}
        aria-label="歌の本文"
      />
      <p className="fieldNote">{count === 0 ? "六十字まで。削るほど、大きく載ります。" : `${count} 字`}</p>
      {state?.error && <p className="errorNote">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {replyTo !== undefined ? "返す" : "詠む"}
      </button>
    </form>
  );
}

export function AnnotateForm({ poemId }: { poemId: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await annotate(prev, formData);
      if (result === null) {
        // 送信成功。フォームを空に戻す。
        (document.getElementById(`annotate-${poemId}`) as HTMLTextAreaElement | null)?.form?.reset();
      }
      return result;
    },
    null
  );

  return (
    <form action={action} className="formCol">
      <input type="hidden" name="poem_id" value={poemId} />
      <textarea
        id={`annotate-${poemId}`}
        className="proseInput"
        name="body"
        maxLength={2000}
        placeholder="この歌の読みを、散文で。"
        aria-label="解凍の本文"
      />
      {state?.error && <p className="errorNote">{state.error}</p>}
      <button type="submit" disabled={pending}>
        層を足す
      </button>
    </form>
  );
}

export function LogoutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action} className="formCol">
      <button type="submit">立ち去る</button>
    </form>
  );
}
