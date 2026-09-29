interface ScrollLockState {
  count: number
  bodyOverflow: string
  root: HTMLElement | null
  rootOverflow: string
}

const lockStates = new WeakMap<Document, ScrollLockState>()

export function acquireAppScrollLock(documentRef: Document): () => void {
  let state = lockStates.get(documentRef)

  if (!state) {
    const root = documentRef.querySelector<HTMLElement>("[data-app-scroll-root]")
    state = {
      count: 0,
      bodyOverflow: documentRef.body.style.overflow,
      root,
      rootOverflow: root?.style.overflow ?? "",
    }
    lockStates.set(documentRef, state)
  }

  if (state.count === 0) {
    state.bodyOverflow = documentRef.body.style.overflow
    state.root = documentRef.querySelector<HTMLElement>("[data-app-scroll-root]")
    state.rootOverflow = state.root?.style.overflow ?? ""
    documentRef.body.style.overflow = "hidden"
    if (state.root) state.root.style.overflow = "hidden"
  }

  state.count += 1
  let released = false

  return () => {
    if (released) return
    released = true

    const current = lockStates.get(documentRef)
    if (!current) return

    current.count = Math.max(0, current.count - 1)
    if (current.count > 0) return

    documentRef.body.style.overflow = current.bodyOverflow
    if (current.root) current.root.style.overflow = current.rootOverflow
    lockStates.delete(documentRef)
  }
}
