/** Load the saved cart once, then save it on every change. */
export default defineNuxtPlugin(() => {
  const cart = useCartStore()
  cart.hydrate()
  cart.$subscribe(() => cart.persist(), { detached: true })
})
