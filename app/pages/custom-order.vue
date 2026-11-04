<script setup lang="ts">
import {
  QUOTE_DETAILS_MAX, QUOTE_DETAILS_MIN, QUOTE_FILE_ACCEPT, QUOTE_MAX_FILES, QUOTE_SERVICE_TYPES,
  formatFileSize, quoteFileProblem, type QuoteServiceType,
} from '~/utils/quote'

const { t } = useLocale()
useSeoMeta({
  title: () => t('quote.seoTitle'),
  description: () => t('quote.seoDescription'),
})
useCanonical()
const { track, context: trackingContext } = useTracking()
const { data: settings } = await useSettings()
const s = computed(() => settings.value?.data)
const phoneHref = computed(() => `tel:${(s.value?.contact.phone ?? '+8801812209019').replace(/[^+\d]/g, '')}`)

const steps = computed(() => [
  { n: '1', title: t('quote.step1Title'), text: t('quote.step1Text') },
  { n: '2', title: t('quote.step2Title'), text: t('quote.step2Text') },
  { n: '3', title: t('quote.step3Title'), text: t('quote.step3Text') },
])

const emptyForm = () => ({ service_type: '' as QuoteServiceType | '', name: '', phone: '', description: '', email: '', quantity: '', material_preference: '', deadline: '' })
const form = reactive(emptyForm())
const files = ref<File[]>([])
const fileProblem = ref<string | null>(null)
const today = new Date().toISOString().slice(0, 10)

function addFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const picked = Array.from(input.files ?? [])
  input.value = '' // picking the same file again must fire `change`
  fileProblem.value = null

  for (const file of picked) {
    const problem = quoteFileProblem(file, t)
    if (problem) { fileProblem.value = problem; continue }
    if (files.value.length >= QUOTE_MAX_FILES) { fileProblem.value = t('quote.errMaxFiles', { max: QUOTE_MAX_FILES }); break }
    if (!files.value.some(f => f.name === file.name && f.size === file.size)) files.value.push(file)
  }
}

function removeFile(index: number) {
  files.value.splice(index, 1)
  fileProblem.value = null
}
const errors = ref<Record<string, string>>({})
const generalError = ref<string | null>(null)
const loading = ref(false)
const sent = ref<{ number: string, name: string } | null>(null)

function validate() {
  const e: Record<string, string> = {}
  if (!form.service_type) e.service_type = t('quote.errType')
  if (form.name.trim().length < 2) e.name = t('checkout.errName')
  if (!isValidPhone(form.phone)) e.phone = t('quote.errPhone')
  if (form.description.trim().length < QUOTE_DETAILS_MIN) e.description = t('quote.errDetails', { min: QUOTE_DETAILS_MIN })
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = t('quote.errEmail')
  if (form.quantity.trim() && !(Number.isInteger(Number(form.quantity)) && Number(form.quantity) >= 1)) e.quantity = t('quote.errQuantity')
  if (form.deadline && form.deadline < today) e.deadline = t('quote.errDeadline')
  return e
}

async function submit() {
  generalError.value = null
  errors.value = validate()
  if (Object.keys(errors.value).length) return

  loading.value = true
  try {
    // Multipart, so files can ride along. Empty optional fields are left out.
    const body = new FormData()
    const values: Record<string, string> = { ...form, name: form.name.trim(), phone: normalizePhone(form.phone), description: form.description.trim(), email: form.email.trim(), material_preference: form.material_preference.trim() }
    for (const [key, value] of Object.entries(values)) if (value !== '') body.append(key, value)
    for (const [key, value] of Object.entries(trackingContext())) if (value) body.append(`tracking[${key}]`, value)
    for (const file of files.value) body.append('files[]', file)

    const res = await $api<{ quote_number: string }>('/custom-quotes', { method: 'POST', body })
    track('Lead', { name: form.service_type, eventId: res.quote_number })
    sent.value = { number: res.quote_number, name: form.name.trim() }
    Object.assign(form, emptyForm())
    files.value = []
    fileProblem.value = null
    await nextTick()
    document.getElementById('quote-sent')?.focus()
  }
  catch (e) {
    const err = toApiError(e)
    if (err.status === 422) {
      for (const [k, v] of Object.entries(err.errors)) {
        // `files.0` etc. belong to the file picker.
        if (k.startsWith('files')) fileProblem.value = v[0]!
        else errors.value[k] = v[0]!
      }
    }
    else generalError.value = err.message
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container-page py-10 sm:py-16">
    <UiBreadcrumbs :items="[{ label: t('nav.home'), to: '/' }, { label: t('nav.customOrder') }]" />
    <div class="mt-6 max-w-2xl">
      <h1 class="text-4xl font-bold sm:text-5xl">{{ t('quote.title') }}</h1>
      <p class="mt-4 text-lg text-muted">
        {{ t('quote.intro') }}
      </p>
    </div>

    <ol class="mt-10 grid gap-4 sm:grid-cols-3">
      <li v-for="st in steps" :key="st.n" class="rounded-lg border border-border bg-surface p-5">
        <span class="grid size-9 place-items-center rounded-full bg-accent/15 font-display font-bold text-accent">{{ st.n }}</span>
        <h2 class="mt-4 text-lg font-semibold">{{ st.title }}</h2>
        <p class="mt-1 text-sm text-muted">{{ st.text }}</p>
      </li>
    </ol>

    <div class="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="quote-form-heading">
        <div
          v-if="sent" id="quote-sent" tabindex="-1" role="status"
          class="rounded-xl border border-success/40 bg-success/10 p-6 focus:outline-none"
        >
          <span class="grid size-10 place-items-center rounded-full bg-success text-white"><UiIcon name="check" :size="20" /></span>
          <h2 id="quote-form-heading" class="mt-4 text-2xl font-bold">{{ t('quote.thanks', { name: sent.name }) }}</h2>
          <p class="mt-2 text-muted">
            {{ t('quote.received', { number: sent.number }) }}
          </p>
          <div class="mt-5 flex flex-col gap-3 sm:flex-row">
            <UiButton :href="phoneHref" variant="secondary"><UiIcon name="phone" :size="18" /> {{ t('quote.callNow') }}</UiButton>
            <UiButton variant="ghost" @click="sent = null">{{ t('quote.another') }}</UiButton>
          </div>
        </div>

        <form v-else class="space-y-5 rounded-xl border border-border bg-surface p-5 sm:p-6" novalidate @submit.prevent="submit">
          <h2 id="quote-form-heading" class="text-xl font-semibold">{{ t('quote.formTitle') }}</h2>

          <fieldset>
            <legend class="mb-2 text-sm font-medium">{{ t('quote.kind') }} <span class="text-accent" aria-hidden="true">*</span></legend>
            <div class="grid gap-2 sm:grid-cols-2" :aria-describedby="errors.service_type ? 'q-type-msg' : undefined">
              <label v-for="st in QUOTE_SERVICE_TYPES" :key="st.value" class="group relative block cursor-pointer">
                <input v-model="form.service_type" type="radio" name="service_type" :value="st.value" class="peer sr-only">
                <span
                  class="block min-h-14 rounded-md border bg-surface-2 px-4 py-3 transition peer-checked:border-accent peer-checked:bg-accent/10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:border-accent/60"
                  :class="errors.service_type ? 'border-danger' : 'border-border'"
                >
                  <span class="block text-sm font-semibold">{{ t(st.key) }}</span>
                  <span class="mt-0.5 block text-xs text-muted">{{ t(st.hintKey) }}</span>
                </span>
              </label>
            </div>
            <p id="q-type-msg" class="mt-1 min-h-4 text-xs text-danger" :role="errors.service_type ? 'alert' : undefined">{{ errors.service_type }}</p>
          </fieldset>

          <div class="grid gap-x-4 sm:grid-cols-2">
            <UiField id="q-name" :label="t('quote.name')" required :error="errors.name">
              <template #default="{ invalid, describedBy }">
                <input
                  id="q-name" v-model="form.name" type="text" autocomplete="name" maxlength="100" :placeholder="t('quote.namePlaceholder')"
                  :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy"
                >
              </template>
            </UiField>
            <UiField id="q-phone" :label="t('checkout.mobile')" required :error="errors.phone" :hint="t('quote.mobileHint')">
              <template #default="{ invalid, describedBy }">
                <input
                  id="q-phone" v-model="form.phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX"
                  :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy"
                >
              </template>
            </UiField>
          </div>

          <UiField id="q-details" :label="t('quote.details')" required :error="errors.description" :hint="`${form.description.length} / ${QUOTE_DETAILS_MAX}`">
            <template #default="{ invalid, describedBy }">
              <textarea
                id="q-details" v-model="form.description" rows="6" :maxlength="QUOTE_DETAILS_MAX"
                :placeholder="t('quote.detailsPlaceholder')"
                class="w-full rounded-md border bg-surface-2 px-4 py-3 text-base placeholder:text-muted/70 focus:outline-none"
                :class="invalid ? 'border-danger' : 'border-border focus:border-accent'" :aria-invalid="invalid" :aria-describedby="describedBy"
              />
            </template>
          </UiField>

          <fieldset class="space-y-1">
            <legend class="mb-2 text-sm font-medium">{{ t('quote.files') }} <span class="text-xs font-normal text-muted">{{ t('common.optional') }}</span></legend>
            <label
              for="q-files"
              class="flex min-h-16 cursor-pointer items-center gap-3 rounded-md border border-dashed bg-surface-2/50 p-4 text-sm transition focus-within:outline-2 focus-within:outline-accent hover:border-accent"
              :class="fileProblem ? 'border-danger' : 'border-border'"
            >
              <UiIcon name="upload" :size="22" class="shrink-0 text-muted" />
              <span class="min-w-0 flex-1">
                <span class="block font-medium">{{ t('quote.attach') }}</span>
                <span class="block text-xs text-muted">{{ t('quote.attachRules', { max: QUOTE_MAX_FILES }) }}</span>
              </span>
              <input id="q-files" type="file" multiple class="sr-only" :accept="QUOTE_FILE_ACCEPT" :disabled="files.length >= QUOTE_MAX_FILES" aria-describedby="q-files-msg" @change="addFiles">
            </label>
            <ul v-if="files.length" class="space-y-1.5 pt-1">
              <li v-for="(f, i) in files" :key="f.name + f.size" class="flex items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
                <span class="min-w-0 flex-1 truncate">{{ f.name }}</span>
                <span class="shrink-0 text-xs text-muted">{{ formatFileSize(f.size) }}</span>
                <button type="button" class="grid size-8 shrink-0 place-items-center rounded-md text-muted transition hover:text-danger" :aria-label="t('quote.removeFile', { name: f.name })" @click="removeFile(i)">
                  <UiIcon name="close" :size="16" />
                </button>
              </li>
            </ul>
            <p id="q-files-msg" class="min-h-4 text-xs text-danger" :role="fileProblem ? 'alert' : undefined">{{ fileProblem }}</p>
          </fieldset>

          <details class="group rounded-md border border-border bg-surface-2/30 open:bg-surface-2/30">
            <summary class="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-medium">
              <span>{{ t('quote.more') }} <span class="text-xs font-normal text-muted">{{ t('quote.moreHint') }}</span></span>
              <UiIcon name="chevron-down" :size="16" class="text-muted transition group-open:rotate-180" />
            </summary>
            <div class="grid gap-x-4 px-4 pb-2 pt-1 sm:grid-cols-2">
              <UiField id="q-email" :label="t('checkout.email')" :error="errors.email">
                <template #default="{ invalid, describedBy }">
                  <input id="q-email" v-model="form.email" type="email" inputmode="email" autocomplete="email" maxlength="150" placeholder="you@example.com" :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy">
                </template>
              </UiField>
              <UiField id="q-qty" :label="t('quote.howMany')" :error="errors.quantity">
                <template #default="{ invalid, describedBy }">
                  <input id="q-qty" v-model="form.quantity" type="number" inputmode="numeric" min="1" max="100000" placeholder="1" :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy">
                </template>
              </UiField>
              <UiField id="q-material" :label="t('quote.material')" :error="errors.material_preference">
                <template #default="{ invalid, describedBy }">
                  <input id="q-material" v-model="form.material_preference" type="text" maxlength="100" :placeholder="t('quote.materialPlaceholder')" :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy">
                </template>
              </UiField>
              <UiField id="q-deadline" :label="t('quote.neededBy')" :error="errors.deadline">
                <template #default="{ invalid, describedBy }">
                  <input id="q-deadline" v-model="form.deadline" type="date" :min="today" :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy">
                </template>
              </UiField>
            </div>
          </details>

          <p v-if="generalError" class="flex items-start gap-2 rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger" role="alert">
            <UiIcon name="alert" :size="18" class="mt-0.5" /> {{ generalError }}
          </p>

          <UiButton type="submit" size="lg" block :disabled="loading">{{ loading ? (files.length ? t('quote.uploading') : t('quote.sending')) : t('quote.send') }}</UiButton>
          <p class="text-center text-xs text-muted">{{ t('quote.noPayment') }}</p>
        </form>
      </section>

      <aside class="h-fit rounded-xl border border-accent/30 bg-accent/5 p-5">
        <h2 class="text-lg font-semibold">{{ t('quote.talkNow') }}</h2>
        <p class="mt-1 text-sm text-muted">{{ t('quote.talkNowText') }}</p>
        <div class="mt-4 flex flex-col gap-2">
          <UiButton :href="phoneHref" variant="secondary" block>
            <UiIcon name="phone" :size="18" /> {{ s?.contact.phone ?? '+880 1812-209019' }}
          </UiButton>
          <UiButton :href="s?.socials.facebook ?? 'https://facebook.com/Byte3D'" variant="secondary" block target="_blank" rel="noopener noreferrer">
            <UiIcon name="facebook" :size="18" /> {{ t('quote.facebook') }}
          </UiButton>
          <UiButton :href="`mailto:${s?.contact.email ?? 'hello@byte3d.store'}`" variant="ghost" block>
            <UiIcon name="mail" :size="18" /> {{ s?.contact.email ?? 'hello@byte3d.store' }}
          </UiButton>
        </div>
      </aside>
    </div>
  </div>
</template>
