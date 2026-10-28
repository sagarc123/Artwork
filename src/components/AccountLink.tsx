'use client'

import { User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isSignedIn } from '@/server/auth-actions'

/**
 * Header link: "Account" when signed in, "Sign in" when not.
 * The pages are cached for everyone, so whether this visitor is signed in is asked after load (and again on each page change).
 */
export function AccountLink({ account, signIn, accountHref, loginHref, className }: { account: string; signIn: string; accountHref: string; loginHref: string; className: string }) {
  const path = usePathname()
  const [on, setOn] = useState<boolean | null>(null)
  useEffect(() => {
    let live = true
    isSignedIn()
      .then((v) => live && setOn(v))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [path])
  return (
    <Link href={on === false ? loginHref : accountHref} className={className}>
      <User aria-hidden="true" className="size-6" />
      {on === false ? signIn : account}
    </Link>
  )
}
