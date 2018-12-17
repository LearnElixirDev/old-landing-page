export const sendEvent = (category, event, label = '', value = null) => {
  if (process.env.NODE_ENV === 'production') {
    console.info(`
    Sending google analytics event
    Category: ${category}
    Event: ${event}
    Label: ${label}
    Value: ${value}
    `)

    if (ga) {
       const tracker = ga.getAll()[0]

      if (tracker)
        tracker.send('event', category, event, label, value)

    } else {
      console.error(`GA not found - Couldn't emit ${category} - ${event} - ${label}`)
    }
  } else {
    console.debug(`
    If was in PROD would send google analytics event
    Category: ${category}
    Event: ${event}
    Label: ${label}
    Value: ${value}
    `)
  }
}
