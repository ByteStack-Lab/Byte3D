<script setup lang="ts">
import { QUOTE_DETAILS_MAX, QUOTE_DETAILS_MIN, QUOTE_SERVICE_TYPES, type QuoteServiceType } from '~/utils/quote'

useSeoMeta({
  title: 'Custom 3D printing order',
  description: 'Tell us your project — custom 3D print, prototype, robotics part or laser engraving — and we will call you to confirm.',
})
useCanonical()
const { data: settings } = await useSettings()
const s = computed(() => settings.value?.data)
const phoneHref = computed(() => `tel:${(s.value?.contact.phone ?? '+8801812209019').replace(/[^+\d]/g, '')}`)

const steps = [
  { n: '1', title: 'Tell us your project', text: 'Pick the type, leave your name, number and a few details.' },
  { n: '2', title: 'We call you', text: 'We phone you to confirm the details, price and timeline.' },
  { n: '3', title: 'We print & deliver', text: 'Printed, finished and delivered across Bangladesh.' },
]

const form = reactive({ service_type: '' as QuoteServiceType | '', name: '', phone: '', description: '' })
const errors = ref<Record<string, string>>({})
const generalError = ref<string | null>(null)
const loading = ref(false)
const sent = ref<{ number: string, name: string } | null>(null)

function validate() {
  const e: Record<string, string> = {}
  if (!form.service_type) e.service_type = 'Choose what kind of project this is.'
  if (form.name.trim().length < 2) e.name = 'Enter your name.'
  if (!isValidPhone(form.phone)) e.phone = 'Use your mobile number, like 01XXXXXXXXX.'
  if (form.description.trim().length < QUOTE_DETAILS_MIN) e.description = `Tell us a little more (at least ${QUOTE_DETAILS_MIN} characters).`
  return e
}

async function submit() {
  generalError.value = null
  errors.value = validate()
  if (Object.keys(errors.value).length) return

  loading.value = true
  try {
    const res = await $api<{ quote_number: string }>('/custom-quotes', {
      method: 'POST',
      body: { ...form, name: form.name.trim(), phone: normalizePhone(form.phone), description: form.description.trim() },
    })
    sent.value = { number: res.quote_number, name: form.name.trim() }
    Object.assign(form, { service_type: '', name: '', phone: '', description: '' })
    await nextTick()
    document.getElementById('quote-sent')?.focus()
  }
  catch (e) {
    const err = toApiError(e)
    if (err.status === 422) for (const [k, v] of Object.entries(err.errors)) errors.value[k] = v[0]!
    else generalError.value = err.message
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container-page py-10 sm:py-16">
    <UiBreadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Custom Order' }]" />
    <div class="mt-6 max-w-2xl">
      <h1 class="text-4xl font-bold sm:text-5xl">Custom order</h1>
      <p class="mt-4 text-lg text-muted">
        Got an idea, a broken part or a prototype? Tell us what you need, leave your number, and we’ll call you to confirm.
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
          <h2 id="quote-form-heading" class="mt-4 text-2xl font-bold">Thank you, {{ sent.name }}!</h2>
          <p class="mt-2 text-muted">
            We got your request <strong class="text-text">{{ sent.number }}</strong>. We will call you soon to confirm the details.
          </p>
          <div class="mt-5 flex flex-col gap-3 sm:flex-row">
            <UiButton :href="phoneHref" variant="secondary"><UiIcon name="phone" :size="18" /> Call us now</UiButton>
            <UiButton variant="ghost" @click="sent = null">Send another request</UiButton>
          </div>
        </div>

        <form v-else class="space-y-5 rounded-xl border border-border bg-surface p-5 sm:p-6" novalidate @submit.prevent="submit">
          <h2 id="quote-form-heading" class="text-xl font-semibold">Tell us about your project</h2>

          <fieldset>
            <legend class="mb-2 text-sm font-medium">What kind of project? <span class="text-accent" aria-hidden="true">*</span></legend>
            <div class="grid gap-2 sm:grid-cols-2" :aria-describedby="errors.service_type ? 'q-type-msg' : undefined">
              <label v-for="t in QUOTE_SERVICE_TYPES" :key="t.value" class="group relative block cursor-pointer">
                <input v-model="form.service_type" type="radio" name="service_type" :value="t.value" class="peer sr-only">
                <span
                  class="block min-h-14 rounded-md border bg-surface-2 px-4 py-3 transition peer-checked:border-accent peer-checked:bg-accent/10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:border-accent/60"
                  :class="errors.service_type ? 'border-danger' : 'border-border'"
                >
                  <span class="block text-sm font-semibold">{{ t.label }}</span>
                  <span class="mt-0.5 block text-xs text-muted">{{ t.hint }}</span>
                </span>
              </label>
            </div>
            <p id="q-type-msg" class="mt-1 min-h-4 text-xs text-danger" :role="errors.service_type ? 'alert' : undefined">{{ errors.service_type }}</p>
          </fieldset>

          <div class="grid gap-x-4 sm:grid-cols-2">
            <UiField id="q-name" label="Your name" required :error="errors.name">
              <template #default="{ invalid, describedBy }">
                <input
                  id="q-name" v-model="form.name" type="text" autocomplete="name" maxlength="100" placeholder="Your full name"
                  :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy"
                >
              </template>
            </UiField>
            <UiField id="q-phone" label="Mobile number" required :error="errors.phone" hint="We will call this number to confirm.">
              <template #default="{ invalid, describedBy }">
                <input
                  id="q-phone" v-model="form.phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX"
                  :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy"
                >
              </template>
            </UiField>
          </div>

          <UiField id="q-details" label="Project details" required :error="errors.description" :hint="`${form.description.length} / ${QUOTE_DETAILS_MAX}`">
            <template #default="{ invalid, describedBy }">
              <textarea
                id="q-details" v-model="form.description" rows="6" :maxlength="QUOTE_DETAILS_MAX"
                placeholder="What do you want made? Size, material or colour, how many, when you need it…"
                class="w-full rounded-md border bg-surface-2 px-4 py-3 text-base placeholder:text-muted/70 focus:outline-none"
                :class="invalid ? 'border-danger' : 'border-border focus:border-accent'" :aria-invalid="invalid" :aria-describedby="describedBy"
              />
            </template>
          </UiField>

          <p v-if="generalError" class="flex items-start gap-2 rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger" role="alert">
            <UiIcon name="alert" :size="18" class="mt-0.5" /> {{ generalError }}
          </p>

          <UiButton type="submit" size="lg" block :disabled="loading">{{ loading ? 'Sending…' : 'Send request' }}</UiButton>
          <p class="text-center text-xs text-muted">No payment now. We call you first, then confirm the price.</p>
        </form>
      </section>

      <aside class="h-fit rounded-xl border border-accent/30 bg-accent/5 p-5">
        <h2 class="text-lg font-semibold">Prefer to talk now?</h2>
        <p class="mt-1 text-sm text-muted">Reach us directly — we usually reply within a few hours. Have an STL file? Send it on Facebook or email.</p>
        <div class="mt-4 flex flex-col gap-2">
          <UiButton :href="phoneHref" variant="secondary" block>
            <UiIcon name="phone" :size="18" /> {{ s?.contact.phone ?? '+880 1812-209019' }}
          </UiButton>
          <UiButton :href="s?.socials.facebook ?? 'https://facebook.com/Byte3D'" variant="secondary" block target="_blank" rel="noopener noreferrer">
            <UiIcon name="facebook" :size="18" /> Message on Facebook
          </UiButton>
          <UiButton :href="`mailto:${s?.contact.email ?? 'hello@byte3d.store'}`" variant="ghost" block>
            <UiIcon name="mail" :size="18" /> {{ s?.contact.email ?? 'hello@byte3d.store' }}
          </UiButton>
        </div>
      </aside>
    </div>
  </div>
</template>
