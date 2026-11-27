import { useEffect, useRef, useState } from 'react'

export function useAsync(asyncFunction, deps = []) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = useRef(0)
  const asyncFunctionRef = useRef(asyncFunction)

  asyncFunctionRef.current = asyncFunction

  useEffect(() => {
    let cancelled = false
    const key = ++requestKey.current

    setLoading(true)
    setError(null)

    Promise.resolve()
      .then(() => asyncFunctionRef.current())
      .then((result) => {
        if (!cancelled && requestKey.current === key) {
          setData(result)
        }
      })
      .catch((requestError) => {
        if (!cancelled && requestKey.current === key) {
          setError(requestError)
        }
      })
      .finally(() => {
        if (!cancelled && requestKey.current === key) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey, ...deps])

  const reload = () => {
    setReloadKey((key) => key + 1)
  }

  return { loading, data, error, reload }
}
