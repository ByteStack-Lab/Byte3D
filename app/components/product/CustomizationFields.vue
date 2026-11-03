<script setup lang="ts">
import type { CustomizationField } from '~/types/api'

defineProps<{ schema: CustomizationField[] }>()
const values = defineModel<Record<string, string>>({ required: true })

const touched = reactive<Record<string, boolean>>({})
const isUrl = (v: string) => /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(v)

function error(f: CustomizationField): string | null {
  if (!touched[f.key]) return null
  const v = (values.value[f.key] ?? '').trim()
  if (f.required && f.type !== 'image' && !v) return `${f.label} is required.`
  if (f.type === 'url' && v && !isUrl(v)) return 'Enter a full link starting with https://'
  return null
}

function set(key: string, value: string) {
  values.value = { ...values.value, [key]: value }
}

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
        <!-- Real upload arrives with phase 4 (POST /uploads/customization). -->
        <div :id="`cf-${f.key}`" class="flex items-center gap-3 rounded-md border border-dashed border-border bg-surface-2/50 p-4 text-sm text-muted" role="note">
          <UiIcon name="upload" :size="20" class="shrink-0 text-muted" />
          <span>Image upload opens soon. For now, send your file when you order on Facebook.</span>
        </div>
      </template>
    </div>
  </fieldset>
</template>
