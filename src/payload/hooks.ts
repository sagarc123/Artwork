import type { CollectionConfig, GlobalConfig } from 'payload'

/** Refresh cached pages right after an edit. Outside Next (CLI, seed script) there is no cache to clear. */
async function refresh(tag: string) {
  try {
    const { revalidateTag } = await import('next/cache')
    revalidateTag(tag, { expire: 0 })
  } catch {
    // Not running inside Next.js.
  }
}

export const refreshOnChange = (tag: string): CollectionConfig['hooks'] => ({
  afterChange: [async ({ doc }) => (await refresh(tag), doc)],
  afterDelete: [async ({ doc }) => (await refresh(tag), doc)],
})

export const refreshGlobalOnChange = (tag: string): GlobalConfig['hooks'] => ({
  afterChange: [async ({ doc }) => (await refresh(tag), doc)],
})

/** Tells the owner about a new enquiry or order. */
// ponytail: does nothing yet. Plug in email (Resend) or SMS/WhatsApp (MSG91) here once their keys exist; until then the Today page shows them.
export const notifyOwner =
  (kind: 'enquiry' | 'order'): NonNullable<NonNullable<CollectionConfig['hooks']>['afterChange']>[number] =>
  ({ doc, operation }) => {
    if (operation === 'create') void kind
    return doc
  }
