const AUTOTRACK_CONFIG = {
  EventTracker: null,
  CleanUrlTracker: null,
  ImpressionTracker: null,
  MaxScrollTracker: null,
  MediaQueryTracker: null,
  OutboundFormTracker: null,
  OutboundLinkTracker: null,
  PageVisibilityTracker: null,
  // socialWidgetTracker: null,
  UrlChangeTracker: null
}

const getGaId = () => {
  if (window.ga && window.ga.getAll) {
    const [ourGa] = window.ga.getAll()

    return ourGa
  } else {
    return null
  }
}

export const setupGoogleAnalytics = () => {
  const gaId = getGaId()
  if (gaId)
    Object.entries(AUTOTRACK_CONFIG)
      .map(([item, config]) => {
        const plugin = window.gaplugins[item]

        if (item)
          new plugin (gaId, config)
      })
  else
    setTimeout(setupGoogleAnalytics, 100)
}
