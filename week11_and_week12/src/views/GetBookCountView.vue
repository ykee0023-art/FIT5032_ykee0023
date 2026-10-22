<template>
  <div id="app">
    <h1>Book Counter</h1>
    <button @click="getBookCount">Get Book Count</button>
    <p v-if="count !== null">Total number of books: {{ count }}</p>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import axios from 'axios';
import { ref } from 'vue';

const count = ref(null);
const error = ref(null);

const getBookCount = async () => {
  try {
    // countBooks cloud function URL (written and deployed in 9.4)
    const response = await axios.get('https://countbooks-tnmo2o5yuq-uc.a.run.app');
    count.value = response.data.count;
    error.value = null;
  } catch (err) {
    console.error(err);
    error.value = 'Error fetching book count';
    count.value = null;
  }
};
</script>
