"use client"

import React from "react"

// Polyfill for useEffectEvent
if (typeof React !== "undefined" && !React.useEffectEvent) {
  React.useEffectEvent = function useEffectEvent(callback) {
    const callbackRef = React.useRef(callback)

    React.useEffect(() => {
      callbackRef.current = callback
    })

    return React.useCallback((...args) => {
      return callbackRef.current(...args)
    }, [])
  }
}
