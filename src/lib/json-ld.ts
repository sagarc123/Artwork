/** JSON for a JSON-LD script tag. A "<" is written as the six characters backslash-u-0-0-3-c, so CMS text can never close the tag. */
export const jsonLdText = (data: object) => JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c')
