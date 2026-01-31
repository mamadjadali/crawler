// src/utils/site.ts
import { SITES } from '@/constants/sites'
import type { SiteKey } from '@/types/site'

export function isSiteKey(value: string): value is SiteKey {
  return value in SITES
}

export function toSiteKey(site: string | null): SiteKey | null {
  if (!site) return null
  return isSiteKey(site) ? site : null
}

export function getSiteLabel(site?: SiteKey | null) {
  return site ? SITES[site].label : '-'
}

export function getSiteClass(site?: SiteKey | null) {
  return SITES[site ?? 'torob']?.className
}

export function getSiteTextClass(site?: SiteKey | null) {
  if (!site) return 'text-rose-400 text-sm font-medium'
  const cls = SITES[site].className
  // Keep only the text color (text-*) and font size/weight if needed
  const textCls = cls
    .split(' ')
    .filter((c) => c.startsWith('text-'))
    .join(' ')
  return textCls || 'text-rose-400'
}
