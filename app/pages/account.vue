<script setup lang="ts">
import type { Order, Paginated } from '~/types/api'

useSeoMeta({ title: 'My account', robots: 'noindex' })

const route = useRoute()
const auth = useAuthStore()

const mode = ref<'login' | 'register'>(route.query.mode === 'register' ? 'register' : 'login')
const form = reactive({ login: '', name: '', phone: '', email: '', password: '', password_confirmation: '' })
const errors = ref<Record<string, string>>({})
const generalError = ref<string | null>(null)
const busy = ref(false)

onMounted(() => { if (!auth.checked) void auth.fetchUser() })

const orders = ref<Paginated<Order> | null>(null)
const ordersLoading = ref(false)
const ordersError = ref<string | null>(null)

async function loadOrders(page = 1) {
  ordersLoading.value = true
  ordersError.value = null
  try {
    orders.value = await $send<Paginated<Order>>('GET', `/me/orders?page=${page}`)
  }
  catch (e) {
    ordersError.value = toApiError(e).message
  }
  finally {
    ordersLoading.value = false
  }
}
watch(() => auth.user?.id, (id) => {
  orders.value = null
  if (id) void loadOrders()
}, { immediate: true })

function setMode(next: 'login' | 'register') {
  mode.value = next
  errors.value = {}
  generalError.value = null
}

async function submit() {
  errors.value = {}
  generalError.value = null

  if (mode.value === 'login') {
    if (!form.login.trim()) errors.value.login = 'Enter your phone number or email.'
    if (!form.password) errors.value.password = 'Enter your password.'
  }
  else {
    if (!form.name.trim()) errors.value.name = 'Enter your name.'
    if (!isValidPhone(form.phone)) errors.value.phone = 'Use a Bangladeshi mobile number, like 01XXXXXXXXX.'
    if (form.password.length < 8) errors.value.password = 'Use at least 8 characters.'
    else if (form.password !== form.password_confirmation) errors.value.password_confirmation = 'The passwords do not match.'
  }
  if (Object.keys(errors.value).length) return

  busy.value = true
  try {
    if (mode.value === 'login') {
      await auth.login(form.login.trim(), form.password)
    }
    else {
      await auth.register({
        name: form.name.trim(),
        phone: normalizePhone(form.phone),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        password: form.password,
        password_confirmation: form.password_confirmation,
      })
    }
    form.password = form.password_confirmation = ''
  }
  catch (e) {
    const err = toApiError(e)
    if (Object.keys(err.errors).length) for (const [k, v] of Object.entries(err.errors)) errors.value[k] = v[0]!
    else generalError.value = err.message
  }
  finally {
    busy.value = false
  }
}

async function signOut() {
  busy.value = true
  try {
    await auth.logout()
  }
  catch (e) {
    generalError.value = toApiError(e).message
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="container-page py-8 sm:py-12">
    <div v-if="!auth.checked" class="mx-auto max-w-md"><UiSkeleton class="h-72 w-full" /></div>

    <!-- Signed in -->
    <div v-else-if="auth.user" class="mx-auto max-w-3xl">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold sm:text-4xl">Hi, {{ auth.user.name }}</h1>
          <p class="mt-1 text-sm text-muted">{{ [auth.user.phone, auth.user.email].filter(Boolean).join(' · ') }}</p>
        </div>
        <UiButton variant="secondary" :disabled="busy" @click="signOut">Sign out</UiButton>
      </div>
      <p v-if="generalError" class="mt-4 text-sm text-danger" role="alert">{{ generalError }}</p>

      <h2 class="mt-10 text-xl font-bold">My orders</h2>
      <UiSkeleton v-if="ordersLoading && !orders" class="mt-4 h-40 w-full" />
      <p v-else-if="ordersError" class="mt-4 text-sm text-danger" role="alert">{{ ordersError }}</p>
      <UiEmptyState v-else-if="orders && !orders.data.length" class="mt-4" icon="box" title="No orders yet" description="Orders you place while signed in show up here.">
        <UiButton to="/shop">Browse the shop</UiButton>
      </UiEmptyState>
      <div v-else-if="orders" class="mt-4 space-y-4">
        <AccountOrderCard v-for="o in orders.data" :key="o.order_number" :order="o" />
        <div v-if="orders.meta.last_page > 1" class="flex items-center justify-between pt-2 text-sm">
          <UiButton variant="secondary" size="sm" :disabled="ordersLoading || orders.meta.current_page <= 1" @click="loadOrders(orders.meta.current_page - 1)">Newer</UiButton>
          <span class="text-muted">Page {{ orders.meta.current_page }} of {{ orders.meta.last_page }}</span>
          <UiButton variant="secondary" size="sm" :disabled="ordersLoading || orders.meta.current_page >= orders.meta.last_page" @click="loadOrders(orders.meta.current_page + 1)">Older</UiButton>
        </div>
      </div>
      <p class="mt-8 text-sm text-muted">Ordered as a guest? <NuxtLink to="/track" class="font-medium text-accent-2 hover:underline">Track an order</NuxtLink> with its number and phone.</p>
    </div>

    <!-- Signed out -->
    <div v-else class="mx-auto max-w-md">
      <h1 class="text-3xl font-bold">{{ mode === 'login' ? 'Sign in' : 'Create your account' }}</h1>
      <p class="mt-2 text-sm text-muted">An account is optional. You can always check out as a guest.</p>

      <div class="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1" role="tablist">
        <button
          v-for="m in (['login', 'register'] as const)" :key="m" type="button" role="tab" :aria-selected="mode === m"
          class="min-h-10 rounded-md text-sm font-semibold transition"
          :class="mode === m ? 'bg-accent text-on-accent' : 'text-muted hover:text-text'"
          @click="setMode(m)"
        >
          {{ m === 'login' ? 'Sign in' : 'Register' }}
        </button>
      </div>

      <form class="mt-5 space-y-3 rounded-lg border border-border bg-surface p-5" novalidate @submit.prevent="submit">
        <p v-if="generalError" class="text-sm text-danger" role="alert">{{ generalError }}</p>

        <template v-if="mode === 'login'">
          <UiField id="a-login" label="Phone number or email" required :error="errors.login">
            <template #default="{ invalid, describedBy }">
              <input id="a-login" v-model="form.login" type="text" autocomplete="username" :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy">
            </template>
          </UiField>
          <UiField id="a-password" label="Password" required :error="errors.password">
            <template #default="{ invalid, describedBy }">
              <input id="a-password" v-model="form.password" type="password" autocomplete="current-password" :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy">
            </template>
          </UiField>
        </template>

        <template v-else>
          <UiField id="a-name" label="Full name" required :error="errors.name">
            <template #default="{ invalid, describedBy }">
              <input id="a-name" v-model="form.name" type="text" autocomplete="name" :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy">
            </template>
          </UiField>
          <UiField id="a-phone" label="Mobile number" required :error="errors.phone">
            <template #default="{ invalid, describedBy }">
              <input id="a-phone" v-model="form.phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX" :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy">
            </template>
          </UiField>
          <UiField id="a-email" label="Email" :error="errors.email">
            <template #default="{ invalid, describedBy }">
              <input id="a-email" v-model="form.email" type="email" inputmode="email" autocomplete="email" :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy">
            </template>
          </UiField>
          <UiField id="a-new-password" label="Password" required :error="errors.password" hint="At least 8 characters.">
            <template #default="{ invalid, describedBy }">
              <input id="a-new-password" v-model="form.password" type="password" autocomplete="new-password" :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy">
            </template>
          </UiField>
          <UiField id="a-confirm" label="Confirm password" required :error="errors.password_confirmation">
            <template #default="{ invalid, describedBy }">
              <input id="a-confirm" v-model="form.password_confirmation" type="password" autocomplete="new-password" :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy">
            </template>
          </UiField>
        </template>

        <UiButton type="submit" size="lg" block :disabled="busy">
          {{ busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account' }}
        </UiButton>
      </form>
    </div>
  </div>
</template>
