export const debounceTime = (time, fnc) => {
  let timer

  return (...args) => {
    if (timer)
      clearTimeout(timer)

    timer = setTimeout(() => {
      fnc(...args)

      timer = null
    }, time)
  }
}
