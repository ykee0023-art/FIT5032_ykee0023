<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import BHeader from "./components/BHeader.vue";

const route = useRoute();

// Hide the header on the JSON API pages so they show only the data
const apiPages = ["CountBookAPI", "GetAllBookAPI"];
const showHeader = computed(() => {
  const name = String(route.name ?? "");
  return !apiPages.some((page) => name.includes(page));
});
</script>

<template>
  <BHeader v-if="showHeader" />
  <router-view></router-view>
</template>
