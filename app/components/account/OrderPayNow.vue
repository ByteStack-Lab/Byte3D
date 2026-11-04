<script setup lang="ts">
/** "Pay now" for an unpaid online order: asks the server for a fresh gateway session and sends the shopper there. */
const props = defineProps<{ orderNumber: string, phone?: string }>()

const { t } = useLocale()
const askedPhone = ref('')
const error = ref<string | null>(null)
const busy = ref(false)
const knownPhone = computed(() => props.phone || '')

async function pay() {
  error.value = null
  const phone = knownPhone.value || askedPhone.value
  if (!isValidPhone(phone)) {
    error.value = t('pay.errPhone')
    return
  }
  busy.value = true
  try {
    const res = await $api<{ data: { redirect_url: string } }>('/orders/pay', {
      method: 'POST',
      body: { order_number: props.orderNumber, phone: normalizePhone(phone) },
    })
    window.location.href = res.data.redirect_url
  }
  catch (e) {
    error.value = toApiError(e).message
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="!knownPhone">
      <label for="pay-phone" class="mb-1.5 block text-left text-sm font-medium">{{ t('pay.yourMobile') }}</label>
      <input id="pay-phone" v-model="askedPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX" :class="inputClass(!!error)" :aria-invalid="!!error">
    </div>
    <UiButton size="lg" block :disabled="busy" @click="pay">{{ busy ? t('pay.opening') : t('pay.now') }}</UiButton>
    <p v-if="error" class="text-left text-sm text-danger" role="alert">{{ error }}</p>
  </div>
</template>
