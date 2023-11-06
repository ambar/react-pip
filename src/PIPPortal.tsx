import React, {useEffect, useState} from 'react'
import {createPortal} from 'react-dom'

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: {
        width?: number
        height?: number
      }) => Promise<Window>
    }
  }
}

export const canUsePip =
  typeof window !== 'undefined' &&
  !!window.documentPictureInPicture?.requestWindow

const abortable = <T,>(
  asyncFn: () => Promise<T>,
  signal: AbortSignal,
  scheduleFn = queueMicrotask
) => {
  return new Promise<T>((resolve, reject) => {
    scheduleFn(() => {
      signal.aborted ? reject(signal.reason) : asyncFn().then(resolve, reject)
    })
  })
}

export type PIPPortalProps = {
  width?: number
  height?: number
  children: React.ReactNode
  onClose?: () => void
}

export const PIPPortal: React.FC<PIPPortalProps> = ({
  children,
  onClose,
  width,
  height,
}) => {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  const setup = async () => {
    const pipWindow: Window =
      await window.documentPictureInPicture!.requestWindow({width, height})
    setContainer(pipWindow.document.body)
    copyStyles(pipWindow)
    pipWindow.addEventListener('pagehide', () => {
      onClose?.()
    })
    return () => {
      pipWindow.close()
    }
  }

  useEffect(() => {
    const canUsePip = !!window.documentPictureInPicture?.requestWindow
    if (!canUsePip) {
      return
    }

    const ac = new AbortController()
    // use abort to avoid useEffect (React.StrictMode) being called twice in dev mode
    const setupP = abortable(setup, ac.signal).catch((err) => {
      if (err !== 'aborted') {
        console.error(err)
      }
    })
    return () => {
      ac.abort('aborted')
      setupP.then((x) => x?.())
    }
  }, [])

  return container ? createPortal(children, container) : null
}

// borrowed from https://developer.chrome.com/docs/web-platform/document-picture-in-picture/#copy-style-sheets-to-the-picture-in-picture-window
const copyStyles = (pipWindow: Window) => {
  ;[...document.styleSheets].forEach((styleSheet) => {
    try {
      const cssRules = [...styleSheet.cssRules]
        .map((rule) => rule.cssText)
        .join('')
      const style = document.createElement('style')
      style.textContent = cssRules
      pipWindow.document.head.appendChild(style)
    } catch (e) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.type = styleSheet.type
      // @ts-expect-error error TS2322: Type 'MediaList' is not assignable to type 'string'.
      link.media = styleSheet.media
      link.href = styleSheet.href!
      pipWindow.document.head.appendChild(link)
    }
  })
}
