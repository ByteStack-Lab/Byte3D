<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-on-accent"
    >
      Skip to content
    </a>
    <LayoutAppHeader />
    <main id="main" class="flex-1">
      <slot />
    </main>
    <LayoutAppFooter />
  </div>
</template>
