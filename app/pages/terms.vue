<script setup lang="ts">
useSeoMeta({ title: 'Terms of service', description: 'The terms for ordering from Byte3D: prices, payment, custom work, delivery and returns.' })
useCanonical()
</script>

<template>
  <ContentLegalPage title="Terms of service" intro="Plain terms for ordering from Byte3D." updated="4 November 2026">
    <h2>Orders</h2>
    <p>
      An order is a request until we confirm it, usually by phone or message. We may decline or cancel an order, for example if an item is out
      of stock or the details are unclear, and we will tell you. Please give a correct phone number and address.
    </p>

    <h2>Prices and payment</h2>
    <ul>
      <li>All prices are in Bangladeshi Taka (৳). The price you see at checkout, including delivery, is the price you pay.</li>
      <li>You can pay by cash on delivery or, when offered, online by card or mobile banking.</li>
      <li>Custom and prototype work is priced per job. We confirm the price with you before we start.</li>
    </ul>

    <h2>Custom and made-to-order items</h2>
    <ul>
      <li>Items with your own text, image or design are made for you. Please check spelling and details before you order.</li>
      <li>You must have the right to use any image, logo or file you send us. We may decline designs that infringe someone else’s rights or that are unlawful.</li>
      <li>3D printed parts can differ slightly in colour, surface and size from photos and previews. This is normal for the process.</li>
    </ul>

    <h2>Delivery</h2>
    <p>
      Production time and delivery time shown on a product are estimates, not guarantees. Delivery is by courier across Bangladesh. You are responsible
      for being reachable at the phone number and address you gave us.
    </p>

    <h2>Returns and refunds</h2>
    <p>See our <NuxtLink to="/returns">returns and refund policy</NuxtLink>.</p>

    <h2>Liability</h2>
    <p>
      Our products are decorative or general-purpose items. Parts we print for prototypes and robotics are made to your specification; you are
      responsible for testing that they fit your use. To the extent the law allows, our liability for an order is limited to the amount you paid for it.
    </p>

    <h2>Changes and law</h2>
    <p>We may update these terms; the version on this page applies to new orders. These terms follow the laws of Bangladesh.</p>

    <p>Questions? <NuxtLink to="/contact">Contact us</NuxtLink>.</p>
  </ContentLegalPage>
</template>
