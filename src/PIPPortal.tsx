import React, {useEffect, useState} from 'react'
import {createPortal} from 'react-dom'

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: {
        width?: number
        height?: number
        disallowReturnToOpener?: boolean
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
  disallowReturnToOpener?: boolean
  children: React.ReactNode
  /**
   * Called when the PIP window is closed.
   */
  onClose?: () => void
  /**
   * Whether to copy stylesheets from the main window to the PIP window.
   * @default true
   */
  shouldCopyStyles?: boolean
}

/**
 * A React component that renders its children in a Picture-in-Picture window.
 */
export const PIPPortal: React.FC<PIPPortalProps> = ({
  children,
  onClose,
  shouldCopyStyles = true,
  ...requestWindowOptions
}) => {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  const setup = async () => {
    const pipWindow: Window =
      await window.documentPictureInPicture!.requestWindow(requestWindowOptions)
    setContainer(pipWindow.document.body)
    if (shouldCopyStyles) {
      copyStyles(pipWindow)
    }
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
