'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { localePath, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { deleteAccount, saveName, signOut } from '@/server/auth-actions'

const input = 'h-13 w-full rounded-ui border border-border bg-surface px-4'

/** Profile tab: name, the verified phone, sign out, and "delete my account". */
export function AccountProfile({ locale, t, name, phone }: { locale: Locale; t: Dictionary['account']; name: string; phone: string }) {
  const router = useRouter()
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function rename(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    const r = await saveName(String(new FormData(e.currentTarget).get('name') ?? '')).catch(() => null)
    setBusy(false)
    setNote(r?.status === 'ok' ? t.nameSaved : t.failed)
    if (r?.status === 'ok') router.refresh()
  }

  async function out() {
    await signOut()
    router.push(localePath(locale, '/'))
    router.refresh()
  }

  async function remove(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const r = await deleteAccount(String(new FormData(e.currentTarget).get('confirm') ?? '')).catch(() => null)
    setBusy(false)
    if (r?.status !== 'ok') return setError(r?.status === 'invalid' ? t.deleteWrong : t.failed)
    router.push(localePath(locale, '/'))
    router.refresh()
  }

  return (
    <div className="grid max-w-xl gap-10">
      <form onSubmit={rename} className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="name" className="font-semibold">
            {t.profileName}
          </label>
          <input id="name" name="name" defaultValue={name} autoComplete="name" maxLength={60} className={input} />
        </div>
        <div className="grid gap-1">
          <p className="font-semibold">{t.phoneLabel}</p>
          <p>+91 {phone}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy} className="press h-13 rounded-ui bg-kumkum px-6 font-semibold text-white disabled:opacity-60">
            {t.saveName}
          </button>
          {note && (
            <p role="status" className="font-semibold">
              {note}
            </p>
          )}
        </div>
      </form>

      <button type="button" onClick={out} className="press h-13 justify-self-start rounded-ui border border-border px-6 font-semibold hover:bg-charcoal/5">
        {t.signOut}
      </button>

      <details className="group rounded-ui border border-border/40 px-4">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 font-semibold">
          {t.deleteTitle}
          <span aria-hidden="true" className="text-xl transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <form onSubmit={remove} className="grid gap-4 pb-4">
          <p className="text-muted">{t.deleteBody}</p>
          <div className="grid gap-2">
            <label htmlFor="confirm" className="font-semibold">
              {t.deleteConfirm}
            </label>
            <input id="confirm" name="confirm" autoComplete="off" className={input} />
          </div>
          {error && (
            <p role="alert" className="font-semibold text-kumkum">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="h-13 justify-self-start rounded-ui border-2 border-kumkum px-6 font-semibold text-kumkum hover:bg-kumkum/5 disabled:opacity-60">
            {t.deleteButton}
          </button>
        </form>
      </details>
    </div>
  )
}
