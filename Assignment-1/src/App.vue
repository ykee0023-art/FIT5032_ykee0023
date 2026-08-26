<script setup>
import NavBar from './components/layout/NavBar.vue'
import FooterBar from './components/layout/FooterBar.vue'
</script>

<template>
  <div id="app">
    <NavBar />
    <main>
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <FooterBar />
  </div>
</template>
