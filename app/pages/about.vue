<script setup lang="ts">
useSeoMeta({
  title: 'About Byte3D',
  description: 'Byte3D is a Bangladesh-based 3D printing studio: custom gifts, keychains, figurines, prototypes and robotics parts, made to order.',
})
useCanonical()
</script>

<template>
  <ContentLegalPage title="About Byte3D" intro="A small 3D printing studio in Bangladesh that turns ideas into real things.">
    <p>
      Byte3D designs and prints custom products for people and businesses across Bangladesh. We started with 3D printed gifts and
      keychains, and grew into prototypes and parts for makers, students and small companies.
    </p>

    <h2>What we make</h2>
    <ul>
      <li><strong>3D Goodies:</strong> figurines, miniatures and personalised gifts.</li>
      <li><strong>Custom keychains:</strong> 3D printed name keychains, laser engraved designs and NFC keychains.</li>
      <li><strong>Fidget toys</strong> and other ready products.</li>
      <li><strong>Print on demand:</strong> send us your idea or your 3D file and we print it.</li>
      <li><strong>Prototypes and robotics parts:</strong> brackets, enclosures, gears and one-off parts, quoted per job.</li>
    </ul>

    <h2>How it works</h2>
    <p>
      Every order is checked by a person. For custom work we call you to confirm the details before we start, so you know the price and
      the delivery time. Ready products ship across Bangladesh, and you can pay with cash on delivery.
    </p>
    <p>
      Have something in mind? <NuxtLink to="/custom-order">Send us your project</NuxtLink> or <NuxtLink to="/contact">get in touch</NuxtLink>.
    </p>
  </ContentLegalPage>
</template>
