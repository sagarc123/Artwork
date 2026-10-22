import { MessageCircle } from 'lucide-react'
import { whatsappLink } from '@/lib/site'

/** Floating help button. Sits above the mobile tab bar. Leaf green keeps white text readable (6.4:1). */
export function WhatsAppButton({ label, aria, message }: { label: string; aria: string; message: string }) {
  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria}
      className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-45 inline-flex h-13 items-center gap-2 rounded-full bg-leaf px-5 font-semibold text-white shadow-md hover:bg-leaf/90 xl:right-6 xl:bottom-6"
    >
      <MessageCircle aria-hidden="true" className="size-6" />
      {label}
    </a>
  )
}
