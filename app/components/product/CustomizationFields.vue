<script setup lang="ts">
import type { CustomizationField, CustomizationUpload } from '~/types/api'
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES } from '~/utils/customization'

const props = defineProps<{
  schema: CustomizationField[]
  /** Show every field's error now (the shopper pressed "Add to cart"). */
  showErrors?: boolean
}>()
const values = defineModel<Record<string, string>>({ required: true })

const touched = reactive<Record<string, boolean>>({})
const errors = computed(() => validateCustomization(props.schema, values.value))

function error(f: CustomizationField): string | null {
  return props.showErrors || touched[f.key] ? (errors.value[f.key] ?? null) : null
}

function set(key: string, value: string) {
  values.value = { ...values.value, [key]: value }
}

/** Per image field: what the shopper picked. The token (the field's value) comes back from the server. */
interface ImageState { name: string, preview: string | null, busy: boolean, problem: string | null }
const images = reactive<Record<string, ImageState | undefined>>({})

function dropImage(key: string) {
  const preview = images[key]?.preview
  if (preview) URL.revokeObjectURL(preview)
  images[key] = undefined
  const { [key]: _removed, ...rest } = values.value
  values.value = rest
}

async function pickImage(f: CustomizationField, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // picking the same file again must fire `change`
  if (!file) return

  touched[f.key] = true
  const previous = images[f.key]?.preview
  if (previous) URL.revokeObjectURL(previous)

  if (!IMAGE_ACCEPT.split(',').includes(file.type)) {
    images[f.key] = { name: file.name, preview: null, busy: false, problem: 'Upload a PNG, JPG or WebP image.' }
    return
  }
  if (file.size > IMAGE_MAX_BYTES) {
    images[f.key] = { name: file.name, preview: null, busy: false, problem: 'The image must be 5 MB or smaller.' }
    return
  }

  images[f.key] = { name: file.name, preview: URL.createObjectURL(file), busy: true, problem: null }
  const body = new FormData()
  body.append('file', file)
  try {
    const res = await $api<{ data: CustomizationUpload }>('/uploads/customization', { method: 'POST', body })
    // The shopper may have removed or replaced the image while it was uploading.
    if (images[f.key]?.name === file.name) {
      images[f.key]!.busy = false
      set(f.key, res.data.upload_token)
    }
  }
  catch (e) {
    const err = toApiError(e)
    images[f.key] = { name: file.name, preview: null, busy: false, problem: err.errors.file?.[0] ?? err.message }
  }
}

onBeforeUnmount(() => Object.values(images).forEach(i => i?.preview && URL.revokeObjectURL(i.preview)))

const input = 'h-12 w-full rounded-md border bg-surface-2 px-4 text-base placeholder:text-muted/70 focus:outline-none'
</script>

<template>
  <fieldset class="space-y-5 rounded-lg border border-border bg-surface p-4 sm:p-5">
    <legend class="-ml-1 flex items-center gap-2 px-1 text-sm font-semibold">
      <UiIcon name="sparkle" :size="16" class="text-accent" /> Make it yours
    </legend>

    <div v-for="f in schema" :key="f.key">
      <div class="mb-1.5 flex items-baseline justify-between gap-3">
        <label :for="`cf-${f.key}`" class="text-sm font-medium">
          {{ f.label }}
          <span v-if="f.required" class="text-accent" aria-hidden="true">*</span>
          <span v-else class="text-xs font-normal text-muted">(optional)</span>
        </label>
        <span v-if="f.extra_price" class="shrink-0 text-xs font-semibold text-accent-2">+{{ formatTaka(f.extra_price) }}</span>
      </div>

      <template v-if="f.type === 'text'">
        <input
          :id="`cf-${f.key}`"
          :value="values[f.key] ?? ''"
          type="text"
          :maxlength="f.max"
          :required="f.required"
          :aria-invalid="!!error(f)"
          :aria-describedby="`cf-${f.key}-hint`"
          autocomplete="off"
          :placeholder="f.required ? 'Type here' : 'Optional'"
          :class="[input, error(f) ? 'border-danger' : 'border-border focus:border-accent']"
          @input="set(f.key, ($event.target as HTMLInputElement).value)"
          @blur="touched[f.key] = true"
        >
        <p :id="`cf-${f.key}-hint`" class="mt-1 flex justify-between text-xs" :class="error(f) ? 'text-danger' : 'text-muted'">
          <span>{{ error(f) ?? '' }}</span>
          <span v-if="f.max" class="tabular-nums">{{ (values[f.key] ?? '').length }}/{{ f.max }}</span>
        </p>
      </template>

      <template v-else-if="f.type === 'url'">
        <input
          :id="`cf-${f.key}`"
          :value="values[f.key] ?? ''"
          type="url"
          inputmode="url"
          :required="f.required"
          :aria-invalid="!!error(f)"
          :aria-describedby="`cf-${f.key}-hint`"
          autocomplete="off"
          placeholder="https://facebook.com/yourpage"
          :class="[input, error(f) ? 'border-danger' : 'border-border focus:border-accent']"
          @input="set(f.key, ($event.target as HTMLInputElement).value)"
          @blur="touched[f.key] = true"
        >
        <p :id="`cf-${f.key}-hint`" class="mt-1 text-xs" :class="error(f) ? 'text-danger' : 'text-muted'">
          {{ error(f) ?? 'The page your NFC chip will open when tapped.' }}
        </p>
      </template>

      <template v-else>
        <div class="flex items-center gap-3 rounded-md border bg-surface-2/50 p-3" :class="images[f.key]?.problem || error(f) ? 'border-danger' : 'border-dashed border-border'">
          <img v-if="images[f.key]?.preview" :src="images[f.key]!.preview!" alt="" class="size-14 shrink-0 rounded-md bg-surface object-contain">
          <UiIcon v-else name="upload" :size="22" class="shrink-0 text-muted" />
          <div class="min-w-0 flex-1 text-sm">
            <template v-if="images[f.key] && !images[f.key]!.problem">
              <p class="truncate font-medium">{{ images[f.key]!.name }}</p>
              <p class="text-xs text-muted" aria-live="polite">{{ images[f.key]!.busy ? 'Uploading…' : 'Image attached' }}</p>
            </template>
            <template v-else-if="values[f.key]">
              <p class="font-medium">Image attached</p>
            </template>
            <p v-else class="text-muted">PNG, JPG or WebP, up to 5 MB</p>
          </div>
          <label
            :for="`cf-${f.key}`"
            class="inline-flex min-h-10 shrink-0 cursor-pointer items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold transition hover:border-accent hover:text-accent focus-within:outline-2 focus-within:outline-accent"
          >
            {{ values[f.key] || images[f.key] ? 'Change' : 'Choose image' }}
            <input
              :id="`cf-${f.key}`" type="file" class="sr-only" :accept="IMAGE_ACCEPT" :aria-invalid="!!(images[f.key]?.problem || error(f))"
              :aria-describedby="`cf-${f.key}-hint`" :disabled="images[f.key]?.busy" @change="pickImage(f, $event)"
            >
          </label>
          <button
            v-if="values[f.key] || images[f.key]" type="button" class="grid size-10 shrink-0 place-items-center rounded-md text-muted transition hover:text-danger"
            :aria-label="`Remove ${f.label}`" @click="dropImage(f.key)"
          >
            <UiIcon name="trash" :size="18" />
          </button>
        </div>
        <p :id="`cf-${f.key}-hint`" class="mt-1 text-xs" :class="images[f.key]?.problem || error(f) ? 'text-danger' : 'text-muted'" :role="images[f.key]?.problem ? 'alert' : undefined">
          {{ images[f.key]?.problem ?? error(f) ?? 'Use a clear, high-contrast image. We will check it before engraving.' }}
        </p>
      </template>
    </div>
  </fieldset>
</template>
