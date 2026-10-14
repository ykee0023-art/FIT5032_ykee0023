<script setup>
import NavBar from './components/layout/NavBar.vue'
import FooterBar from './components/layout/FooterBar.vue'

// After moving to another page, put focus on its main heading so screen readers announce the
// new page and keyboard users continue from the top of the content (WCAG 2.4.3).
// The first page also "enters", but there focus stays at the top so the skip link comes first.
let isFirstPage = true

function focusPageHeading() {
  if (isFirstPage) {
    isFirstPage = false
    return
  }
  const heading = document.querySelector('#main-content h1')
  if (!heading) return
  heading.setAttribute('tabindex', '-1')
  heading.focus({ preventScroll: true })
}
</script>

<template>
  <a href="#main-content" class="skip-link visually-hidden-focusable">Skip to main content</a>
  <NavBar />
  <main id="main-content" tabindex="-1">
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in" @after-enter="focusPageHeading">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>
  <FooterBar />
</template>
