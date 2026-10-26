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
