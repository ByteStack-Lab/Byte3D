<script setup lang="ts">
useSeoMeta({ title: 'Returns and refunds', description: 'How returns, exchanges and refunds work for ready products and custom orders at Byte3D.' })
useCanonical()
</script>

<template>
  <ContentLegalPage title="Returns and refunds" intro="If something is wrong with your order, we will make it right." updated="4 November 2026">
    <h2>Ready products</h2>
    <p>
      If your item arrives damaged, broken or different from what you ordered, tell us within <strong>3 days</strong> of delivery. Send a photo
      or short video, with your order number, through the <NuxtLink to="/contact">contact page</NuxtLink>. We will replace the item or refund you.
    </p>

    <h2>Custom and made-to-order items</h2>
    <p>
      Items made with your name, text, image or design cannot be returned just because you changed your mind, because they cannot be sold to anyone
      else. If we made a mistake (wrong spelling we were given correctly, wrong colour, broken in delivery), we will remake it or refund you.
    </p>

    <h2>Prototypes and quoted work</h2>
    <p>Work quoted for you is made to the specification we agreed. If it does not match that specification, contact us and we will fix or remake it.</p>

    <h2>How refunds are paid</h2>
    <ul>
      <li><strong>Online payments</strong> are refunded to the same card or wallet. Banks and wallets can take several working days to show it.</li>
      <li><strong>Cash on delivery</strong> orders are refunded by bKash or bank transfer; we will ask for your number or account.</li>
    </ul>

    <h2>Cancelling an order</h2>
    <p>You can cancel before we start production by calling us. Once production has started on a custom item, it cannot be cancelled.</p>
  </ContentLegalPage>
</template>
