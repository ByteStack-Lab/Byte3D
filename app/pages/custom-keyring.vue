<script setup lang="ts">
useSeoMeta({
  title: 'Custom name keyring — design it online',
  description: 'Type a name, pick a font and colours, and see your 3D printed keyring or bag tag live. Made in Bangladesh, cash on delivery.',
  ogTitle: 'Design your custom name keyring — Byte3D',
})
useCanonical()

const { data: settings } = await useSettings()
const s = computed(() => settings.value?.data)

// ---- Builder state -------------------------------------------------------------------------
const type = ref<KeyringType>('keyring')
const lines = ref<string[]>([''])
const badChar = ref<number | null>(null)
const fontId = ref(KEYRING_FONTS[0]!.id)
const keyColor = ref('Black')
const letterColor = ref('White')
const qty = ref(1)

const hex = (name: string) => KEYRING_COLORS.find(c => c.name === name)?.hex ?? '#000'
const typeInfo = computed(() => KEYRING_TYPES.find(t => t.id === type.value)!)
const fontInfo = computed(() => KEYRING_FONTS.find(f => f.id === fontId.value)!)

const filled = computed(() => lines.value.map(l => l.trim()).filter(Boolean))
const hasText = computed(() => filled.value.length > 0)
const previewLines = computed(() => (hasText.value ? filled.value : ['Your Name']))
const size = computed(() => keyringSizeCm(previewLines.value, type.value))
const sameColor = computed(() => keyColor.value === letterColor.value)

function onInput(i: number, e: Event) {
  const el = e.target as HTMLInputElement
  const clean = sanitizeKeyringText(el.value)
  badChar.value = /[^A-Za-z0-9 ]/.test(el.value) ? i : null
  el.value = clean
  lines.value[i] = clean
}
function addLine() {
  if (lines.value.length < KEYRING_MAX_LINES) lines.value.push('')
  nextTick(() => document.getElementById(`kr-line-${lines.value.length - 1}`)?.focus())
}
function removeLine(i: number) {
  lines.value.splice(i, 1)
  badChar.value = null
}
function step(by: number) {
  qty.value = Math.min(KEYRING_MAX_QTY, Math.max(1, qty.value + by))
}

// Display estimate only — the team confirms the real price when the order is confirmed (rule 1).
const unit = computed(() => typeInfo.value.price)
const total = computed(() => unit.value * qty.value)

// ---- Order hand-off (no cart until phase 3: copy the details, open Messenger) ---------------
const fbHandle = computed(() => {
  try {
    return new URL(s.value?.socials.facebook ?? '').pathname.replace(/\//g, '') || 'Byte3D'
  }
  catch {
    return 'Byte3D'
  }
})
const summary = computed(() => [
  `Hi Byte3D! I'd like to order a custom ${typeInfo.value.label.toLowerCase()}:`,
  `• Text: ${filled.value.join(' / ') || '—'}`,
  `• Font: ${fontInfo.value.label}`,
  `• ${typeInfo.value.label} colour: ${keyColor.value}`,
  `• Letter colour: ${letterColor.value}`,
  `• Quantity: ${qty.value}`,
  `• Estimated: ${formatTaka(total.value)} (delivery extra)`,
].join('\n'))

const notice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | undefined
async function order() {
  if (!hasText.value) return
  let copied = false
  try {
    await navigator.clipboard.writeText(summary.value)
    copied = true
  }
  catch { /* clipboard blocked — the summary stays visible on the page */ }
  notice.value = copied
    ? 'Order details copied — paste them in Messenger.'
    : 'Open Messenger and send the order summary shown above.'
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 8000)
  window.open(`https://m.me/${fbHandle.value}`, '_blank', 'noopener')
}
onBeforeUnmount(() => clearTimeout(noticeTimer))

const input = 'h-12 w-full rounded-md border border-border bg-surface-2 px-4 text-base placeholder:text-muted/70 transition focus:border-accent focus:outline-none'
</script>

<template>
  <div>
    <div class="container-page py-6 sm:py-10">
      <UiBreadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Custom Keyring' }]" />

      <div class="mt-5 max-w-2xl">
        <h1 class="text-3xl font-bold sm:text-5xl">Make your keyring</h1>
        <p class="mt-3 text-base text-muted sm:text-lg">
          Type a name, pick a font and colours — watch it take shape. We 3D print it and deliver across Bangladesh.
        </p>
      </div>

      <div class="mt-6 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-12">
        <!-- Live preview: pinned under the header on mobile so changes stay visible while scrolling -->
        <div class="sticky top-16 z-30 -mx-4 bg-bg/95 px-4 pb-3 pt-2 backdrop-blur sm:-mx-6 sm:px-6 lg:top-24 lg:z-auto lg:mx-0 lg:self-start lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <KeyringPreview
            :lines="previewLines"
            :font-id="fontId"
            :key-color="hex(keyColor)"
            :letter-color="hex(letterColor)"
            :type="type"
          />
          <div class="mt-2 flex items-center justify-between gap-3 px-1 text-xs text-muted sm:text-sm lg:mt-3">
            <span class="inline-flex items-center gap-1.5">
              <UiIcon name="ruler" :size="15" /> About {{ size.w }} × {{ size.h }} cm
            </span>
            <span class="font-display font-semibold text-text">{{ formatTaka(unit) }} <span class="font-sans font-normal text-muted">each</span></span>
          </div>
        </div>

        <!-- Options -->
        <div class="mt-6 space-y-9 lg:mt-0">
          <div class="flex gap-3 rounded-lg border border-border bg-surface p-4">
            <span class="grid size-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent"><UiIcon name="truck" :size="20" /></span>
            <div class="text-sm">
              <p class="font-semibold">Ordering a few? One delivery charge for all.</p>
              <p class="mt-0.5 text-muted">
                <template v-if="s">Inside Dhaka {{ formatTaka(s.shipping.inside_dhaka) }} · Outside Dhaka {{ formatTaka(s.shipping.outside_dhaka) }} · </template>Cash on delivery
              </p>
            </div>
          </div>

          <!-- 1. Name -->
          <section aria-labelledby="kr-h-name">
            <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
              <h2 id="kr-h-name" class="flex items-center gap-3 text-lg font-semibold whitespace-nowrap">
                <span class="grid size-8 place-items-center rounded-full bg-accent/15 font-display text-sm font-bold text-accent">1</span>
                Write the name
              </h2>
              <div role="radiogroup" aria-label="Product type" class="inline-flex rounded-full border border-border bg-surface-2 p-1">
                <label v-for="t in KEYRING_TYPES" :key="t.id" class="cursor-pointer">
                  <input v-model="type" type="radio" name="kr-type" :value="t.id" class="peer sr-only">
                  <span class="block min-h-9 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-muted transition peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent">{{ t.label }}</span>
                </label>
              </div>
            </div>

            <div class="mt-4 space-y-3">
              <div v-for="(_, i) in lines" :key="i">
                <div class="flex items-center gap-2">
                  <div class="relative flex-1">
                    <label :for="`kr-line-${i}`" class="sr-only">Line {{ i + 1 }}</label>
                    <input
                      :id="`kr-line-${i}`"
                      :value="lines[i]"
                      type="text"
                      :maxlength="KEYRING_MAX_CHARS"
                      autocomplete="off"
                      autocapitalize="words"
                      spellcheck="false"
                      :placeholder="i === 0 ? 'Type a name, e.g. Tanvir' : `Line ${i + 1}`"
                      :aria-describedby="i === 0 ? 'kr-hint' : undefined"
                      :class="[input, 'pr-14', badChar === i && 'border-danger']"
                      @input="onInput(i, $event)"
                    >
                    <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted">{{ lines[i]?.length ?? 0 }}/{{ KEYRING_MAX_CHARS }}</span>
                  </div>
                  <button
                    v-if="i > 0"
                    type="button"
                    class="grid size-12 shrink-0 place-items-center rounded-md border border-border text-muted transition hover:border-danger/60 hover:text-danger"
                    :aria-label="`Remove line ${i + 1}`"
                    @click="removeLine(i)"
                  >
                    <UiIcon name="close" :size="18" />
                  </button>
                </div>
              </div>

              <button
                v-if="lines.length < KEYRING_MAX_LINES"
                type="button"
                class="flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm font-medium text-muted transition hover:border-accent/60 hover:text-accent"
                @click="addLine"
              >
                + Add line {{ lines.length + 1 }}
              </button>

              <p id="kr-hint" class="text-xs" :class="badChar !== null ? 'text-danger' : 'text-muted'" aria-live="polite">
                {{ badChar !== null ? 'Only English letters and numbers can be printed.' : `Up to ${KEYRING_MAX_LINES} lines · English letters and numbers only` }}
              </p>
            </div>
          </section>

          <!-- 2. Font -->
          <section aria-labelledby="kr-h-font">
            <div class="flex items-baseline justify-between gap-3">
              <h2 id="kr-h-font" class="flex items-center gap-3 text-lg font-semibold">
                <span class="grid size-8 place-items-center rounded-full bg-accent/15 font-display text-sm font-bold text-accent">2</span>
                Pick a font
              </h2>
              <span class="text-sm text-muted">{{ fontInfo.label }}</span>
            </div>
            <fieldset class="mt-4">
              <legend class="sr-only">Font</legend>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label
                  v-for="f in KEYRING_FONTS"
                  :key="f.id"
                  class="group relative block cursor-pointer rounded-lg border border-border bg-surface p-3 transition hover:border-muted has-[:checked]:border-accent has-[:checked]:shadow-glow has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
                >
                  <input v-model="fontId" type="radio" name="kr-font" :value="f.id" class="sr-only">
                  <span
:class="`kr-f-${f.id}`" class="block truncate py-1 leading-tight"
                    :style="{ fontSize: f.width > 0.7 ? '1.125rem' : '1.5rem' }">{{ filled[0] || 'Your Name' }}</span>
                  <span class="mt-1.5 block text-xs text-muted">{{ f.label }}</span>
                  <span class="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-accent text-on-accent opacity-0 transition group-has-[:checked]:opacity-100">
                    <UiIcon name="check" :size="12" />
                  </span>
                </label>
              </div>
            </fieldset>
          </section>

          <!-- 3. Colours -->
          <section aria-labelledby="kr-h-colour">
            <h2 id="kr-h-colour" class="flex items-center gap-3 text-lg font-semibold">
              <span class="grid size-8 place-items-center rounded-full bg-accent/15 font-display text-sm font-bold text-accent">3</span>
              Pick colours
            </h2>

            <div class="mt-4 space-y-5">
              <div>
                <div class="mb-2 flex items-baseline justify-between text-sm">
                  <span id="kr-l-key" class="font-medium">{{ typeInfo.label }} colour</span>
                  <span class="text-muted">{{ keyColor }}</span>
                </div>
                <div role="radiogroup" aria-labelledby="kr-l-key" class="flex flex-wrap gap-2">
                  <UiSwatch
                    v-for="c in KEYRING_COLORS"
                    :key="`k-${c.name}`"
                    :color="c.hex"
                    :label="c.name"
                    :size="44"
                    :selected="keyColor === c.name"
                    @click="keyColor = c.name"
                  />
                </div>
              </div>

              <div>
                <div class="mb-2 flex items-baseline justify-between text-sm">
                  <span id="kr-l-letter" class="font-medium">Letter colour</span>
                  <span class="text-muted">{{ letterColor }}</span>
                </div>
                <div role="radiogroup" aria-labelledby="kr-l-letter" class="flex flex-wrap gap-2">
                  <UiSwatch
                    v-for="c in KEYRING_COLORS"
                    :key="`l-${c.name}`"
                    :color="c.hex"
                    :label="c.name"
                    :size="44"
                    :selected="letterColor === c.name"
                    @click="letterColor = c.name"
                  />
                </div>
                <p v-if="sameColor" class="mt-3 flex items-start gap-2 rounded-md bg-accent/10 p-3 text-sm text-accent" role="status">
                  <UiIcon name="info" :size="18" class="mt-0.5" />
                  Letters and {{ typeInfo.label.toLowerCase() }} are the same colour — the name will blend in. Pick a different letter colour.
                </p>
              </div>
            </div>
          </section>

          <!-- 4. Quantity -->
          <section aria-labelledby="kr-h-qty">
            <div class="flex items-center justify-between gap-3">
              <h2 id="kr-h-qty" class="flex items-center gap-3 text-lg font-semibold">
                <span class="grid size-8 place-items-center rounded-full bg-accent/15 font-display text-sm font-bold text-accent">4</span>
                How many
              </h2>
              <div class="inline-flex items-center rounded-full border border-border bg-surface-2">
                <button type="button" class="grid size-11 place-items-center rounded-full text-lg text-muted transition hover:text-text disabled:opacity-40" aria-label="Decrease quantity" :disabled="qty <= 1" @click="step(-1)">−</button>
                <output class="min-w-8 text-center font-display font-semibold tabular-nums" aria-live="polite">{{ qty }}</output>
                <button type="button" class="grid size-11 place-items-center rounded-full text-lg text-muted transition hover:text-text disabled:opacity-40" aria-label="Increase quantity" :disabled="qty >= KEYRING_MAX_QTY" @click="step(1)">+</button>
              </div>
            </div>
            <p class="mt-2 text-sm text-muted">{{ formatTaka(unit) }} each · pay when it arrives.</p>
          </section>

          <!-- Summary -->
          <section aria-labelledby="kr-h-sum" class="rounded-lg border border-border bg-surface p-4 sm:p-5">
            <h2 id="kr-h-sum" class="flex items-center gap-2 text-sm font-semibold">
              <UiIcon name="sparkle" :size="16" class="text-accent" /> Your order
            </h2>
            <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-sm">
              <dt class="text-muted">Text</dt><dd class="truncate font-medium">{{ filled.join(' / ') || '—' }}</dd>
              <dt class="text-muted">Type</dt><dd class="font-medium">{{ typeInfo.label }}</dd>
              <dt class="text-muted">Font</dt><dd class="font-medium">{{ fontInfo.label }}</dd>
              <dt class="text-muted">Colours</dt><dd class="font-medium">{{ keyColor }} / {{ letterColor }} letters</dd>
              <dt class="text-muted">Quantity</dt><dd class="font-medium">{{ qty }}</dd>
            </dl>
            <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted">
              <li class="inline-flex items-center gap-1.5"><UiIcon name="cube" :size="15" class="text-accent-2" /> 3D printed in PLA</li>
              <li class="inline-flex items-center gap-1.5"><UiIcon name="clock" :size="15" class="text-accent-2" /> Ready in {{ KEYRING_PRODUCTION_DAYS.min }}–{{ KEYRING_PRODUCTION_DAYS.max }} days</li>
              <li class="inline-flex items-center gap-1.5"><UiIcon name="wallet" :size="15" class="text-accent-2" /> Cash on delivery</li>
            </ul>
            <p class="mt-3 text-xs text-muted">
              The preview is a close guide — we confirm the final design and price with you before printing.
            </p>
          </section>

          <p class="flex items-start gap-2 text-sm text-muted">
            <UiIcon name="facebook" :size="18" class="mt-0.5 text-accent-2" />
            <span>
              Problem ordering?
              <a :href="s?.socials.facebook ?? 'https://facebook.com/Byte3D'" target="_blank" rel="noopener noreferrer" class="text-accent-2 underline underline-offset-2">Message us on Facebook</a>
              and we’ll take your order there.
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Order bar -->
    <div class="sticky bottom-0 z-30 border-t border-border bg-bg/90 backdrop-blur-md">
      <div class="container-page flex items-center justify-between gap-4 py-3">
        <div class="min-w-0">
          <p class="font-display text-xl font-bold leading-none sm:text-2xl">{{ formatTaka(total) }}</p>
          <p class="mt-1 truncate text-xs text-muted" aria-live="polite">
            {{ notice || (hasText ? 'Estimate · one delivery charge for all' : 'Write a name to continue') }}
          </p>
        </div>
        <UiButton size="lg" :disabled="!hasText" @click="order">
          <UiIcon name="arrow-right" :size="18" /> Order on Messenger
        </UiButton>
      </div>
    </div>
  </div>
</template>
