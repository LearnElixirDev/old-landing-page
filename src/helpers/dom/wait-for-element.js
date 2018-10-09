const findItem = (findFnc, checkTime, timeout, resolve, reject, timeWaiting = 0) => {
  const element = findFnc()

  if (element)
    resolve(element)
  else
    setTimeout(() => {
      timeWaiting += checkTime

      if (timeWaiting > timeout)
        reject('Not Found')
      else
        findItem(findFnc, checkTime, timeout, resolve, reject, timeWaiting)
    }, checkTime)
}

export const waitForElement = (findFnc, checkTime = 200, timeout = 5000) => {
  return new Promise((resolve, reject) => findItem(
    findFnc, checkTime, timeout,
    resolve, reject
  ))
}
