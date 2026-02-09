function computeAggregates(productUrls: any[]) {
  const prices = productUrls.map((u) => u.currentPrice).filter((p) => p != null)

  const dates = productUrls
    .map((u) => u.lastCrawledAt)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())

  const hasSuccess = productUrls.some((u) => u.crawlStatus === 'success')
  const hasFailed = productUrls.some((u) => u.crawlStatus === 'failed')

  return {
    lowestPrice: prices.length ? Math.min(...prices) : null,
    lastCrawledAt: dates.length ? new Date(Math.max(...dates)).toISOString() : null,
    crawlStatus: hasSuccess ? 'success' : hasFailed ? 'failed' : 'pending',
  }
}
