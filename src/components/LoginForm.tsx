'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { localePath, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { OTP_RESEND_SECONDS } from '@/lib/auth'
import { requestOtp, saveName, verifyOtp, type RequestOtpResult, type VerifyResult } from '@/server/auth-actions'
import { savedActions, useSaved } from './cart-store'

type Step = 'phone' | 'code' | 'name'

const box = 'h-13 w-full rounded-ui border border-border bg-surface px-4 aria-invalid:border-2 aria-invalid:border-kumkum'
const button = 'press h-13 rounded-ui bg-kumkum px-6 font-semibold text-white disabled:opacity-60'

/**
 * Phone, then the 6-digit code (then the first name, the first time). `next` is a path without the language prefix.
 * Inside checkout, `onDone` replaces the redirect so the page just reloads as signed in.
 */
export function LoginForm({ locale, t, next = '/account', onDone }: { locale: Locale; t: Dictionary['login']; next?: string; onDone?: () => void }) {
  const router = useRouter()
  const saved = useSaved()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [adult, setAdult] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [testCode, setTestCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(0)
  const field = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])
  // Move to the first box of each step, and to the message when something went wrong.
  useEffect(() => field.current?.focus(), [step])
  const alertRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (error) alertRef.current?.focus()
  }, [error])

  const finish = () => {
    if (onDone) return onDone()
    router.push(localePath(locale, next))
    router.refresh()
  }

  async function send(e?: FormEvent) {
    e?.preventDefault()
    if (!adult) return setError(t.under18)
    setBusy(true)
    setError(null)
    let r: RequestOtpResult
    try {
      r = await requestOtp(phone)
    } catch {
      r = { status: 'failed' }
    }
    setBusy(false)
    if (r.status === 'sent') {
      setTestCode(r.testCode ?? null)
      setCode('')
      setWait(OTP_RESEND_SECONDS)
      return setStep('code')
    }
    setError(t.errors[r.status])
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) return setError(t.errors.codeInvalid)
    setBusy(true)
    setError(null)
    let r: VerifyResult
    try {
      r = await verifyOtp(phone, code, saved)
    } catch {
      r = { status: 'failed' }
    }
    setBusy(false)
    if (r.status !== 'ok') return setError(r.status === 'invalid' ? t.errors.codeInvalid : t.errors[r.status])
    // The device's saved pieces and the account's are now one list.
    savedActions.replace(r.saved)
    if (r.name) return finish()
    setStep('name')
  }

  async function saveFirstName(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await saveName(name).catch(() => null)
    setBusy(false)
    if (r?.status !== 'ok') return setError(t.errors.name)
    finish()
  }

  const errorLine = error && (
    <p ref={alertRef} tabIndex={-1} role="alert" className="font-semibold text-kumkum outline-none">
      {error}
    </p>
  )

  if (step === 'name')
    return (
      <form onSubmit={saveFirstName} className="grid gap-5">
        <h2 className="font-heading text-h2">{t.nameTitle}</h2>
        <div className="grid gap-2">
          <label htmlFor="first-name" className="font-semibold">
            {t.nameLabel}
          </label>
          <input ref={field} id="first-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={60} className={box} />
        </div>
        {errorLine}
        <button type="submit" disabled={busy} className={button}>
          {t.save}
        </button>
        <button type="button" onClick={finish} className="min-h-12 font-semibold text-peacock underline underline-offset-4">
          {t.skip}
        </button>
      </form>
    )

  if (step === 'code')
    return (
      <form onSubmit={verify} noValidate className="grid gap-5">
        <p>{t.sentTo.replace('{phone}', phone)}</p>
        {testCode && (
          // Development only: the server never sends this in production.
          <p role="status" className="rounded-ui border-2 border-marigold bg-surface p-3 font-semibold">
            {t.testMode.replace('{code}', testCode)}
          </p>
        )}
        <div className="grid gap-2">
          <label htmlFor="otp" className="font-semibold">
            {t.codeLabel}
          </label>
          <input
            ref={field}
            id="otp"
            name="otp"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            aria-invalid={!!error}
            className={`${box} text-center text-h3 tracking-[0.5em]`}
          />
        </div>
        {errorLine}
        <button type="submit" disabled={busy} className={button}>
          {busy ? t.verifying : t.verify}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-x-6">
          <button type="button" onClick={() => (setStep('phone'), setError(null))} className="min-h-12 font-semibold text-peacock underline underline-offset-4">
            {t.change}
          </button>
          <button type="button" disabled={wait > 0 || busy} onClick={() => send()} className="min-h-12 font-semibold text-peacock underline underline-offset-4 disabled:text-muted disabled:no-underline">
            {wait > 0 ? t.resendIn.replace('{s}', String(wait)) : t.resend}
          </button>
        </div>
      </form>
    )

  return (
    <form onSubmit={send} noValidate className="grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="phone" className="font-semibold">
          {t.phone}
        </label>
        <div className="flex">
          <span aria-hidden="true" className="grid h-13 place-items-center rounded-l-ui border border-r-0 border-border bg-placeholder px-3 font-semibold">
            +91
          </span>
          <input
            ref={field}
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            autoComplete="tel-national"
            aria-invalid={!!error}
            className={`${box} rounded-l-none`}
          />
        </div>
      </div>
      <label className="flex min-h-11 items-start gap-3">
        <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-1 size-5 shrink-0 accent-kumkum" />
        {t.age}
      </label>
      {errorLine}
      <button type="submit" disabled={busy} className={button}>
        {busy ? t.sending : t.send}
      </button>
      <p className="text-muted">{t.privacy}</p>
    </form>
  )
}
