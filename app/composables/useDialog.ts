import type { Ref } from 'vue'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessible modal behaviour for drawers: focus moves in, Tab is trapped, Esc closes,
 * background scroll is locked, focus returns to the trigger on close.
 */
export function useDialog(panel: Ref<HTMLElement | null>, open: Ref<boolean>, close: () => void) {
  let previouslyFocused: HTMLElement | null = null

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    if (e.key !== 'Tab' || !panel.value) return
    const items = [...panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null)
    if (!items.length) return
    const first = items[0]!
    const last = items[items.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    }
    else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  function release() {
    document.removeEventListener('keydown', onKeydown)
    document.documentElement.style.removeProperty('overflow')
    previouslyFocused?.focus?.()
    previouslyFocused = null
  }

  watch(open, async (isOpen) => {
    if (!import.meta.client) return
    if (isOpen) {
      previouslyFocused = document.activeElement as HTMLElement | null
      document.documentElement.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      panel.value?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    }
    else {
      release()
    }
  })

  onBeforeUnmount(() => {
    if (open.value) release()
  })
}
