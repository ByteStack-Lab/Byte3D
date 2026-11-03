export type ThemeResolved = 'light' | 'dark'
type ThemePref = 'system' | ThemeResolved

const KEY = 'b3d-theme'

/**
 * Visitors only ever see two themes: light and dark. Behind the scenes the default is the device
 * setting (`system`), which keeps following the device. An override is stored only while the visitor's
 * choice differs from the device; switching back to the device's own mode simply drops the override.
 * The inline script in nuxt.config.ts already set `data-theme` before paint; this keeps it in sync.
 */
export function useTheme() {
  const pref = useState<ThemePref>('theme-pref', () => 'system')
  const resolved = useState<ThemeResolved>('theme-resolved', () => 'dark')

  const device = (): ThemeResolved =>
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'

  function apply() {
    const next = pref.value === 'system' ? device() : pref.value
    resolved.value = next
    const root = document.documentElement
    root.setAttribute('data-theme', next)
    root.style.colorScheme = next
  }

  function setTheme(next: ThemeResolved) {
    pref.value = next === device() ? 'system' : next
    try {
      if (pref.value === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, pref.value)
    }
    catch { /* private mode: the choice just lasts for this visit */ }
    apply()
  }

  function toggle() {
    setTheme(resolved.value === 'light' ? 'dark' : 'light')
  }

  /** Client only, once at startup. */
  function init() {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved === 'light' || saved === 'dark') pref.value = saved
    }
    catch { /* ignore */ }
    apply()
    // Device switched (e.g. sunset auto-dark): follow it unless the visitor overrode it.
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (pref.value === 'system') apply()
    })
    // Another tab changed the choice.
    window.addEventListener('storage', (e) => {
      if (e.key !== KEY) return
      pref.value = e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : 'system'
      apply()
    })
  }

  return { resolved, setTheme, toggle, init }
}
