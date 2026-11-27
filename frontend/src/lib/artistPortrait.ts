export function artistPortrait(slug: string) {
  return (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/artists/' + slug + '.webp';
}
