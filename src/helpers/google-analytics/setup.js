const AUTOTRACK_CONFIG = {
  cleanUrlTracker: null,
  impressionTracker: null,
  maxScrollTracker: null,
  mediaQueryTracker: null,
  outboundFormTracker: null,
  outboundLinkTracker: null,
  pageVisibilityTracker: null,
  // socialWidgetTracker: null,
  urlChangeTracker: null
}

export const setupGoogleAnalytics = () => {
  return Object.entries(AUTOTRACK_CONFIG)
    .map(([event, config]) => {
      if (ga)
        ga('require', event, config)
    })
}
