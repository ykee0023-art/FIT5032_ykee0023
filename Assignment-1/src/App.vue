<script setup>
import NavBar from './components/layout/NavBar.vue'
import FooterBar from './components/layout/FooterBar.vue'
</script>

<template>
  <div id="app">
    <NavBar />
    <main>
      <RouterView />
    </main>
    <FooterBar />
  </div>
</template>
