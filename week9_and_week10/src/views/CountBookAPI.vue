<template>
  <pre>{{ jsondata }}</pre>
</template>

<script setup>
import axios from 'axios';
import { ref, onMounted } from 'vue';

const jsondata = ref(null);
const error = ref(null);

const getBookCountAPI = async () => {
  try {
    // countBooks cloud function URL (written and deployed in 9.4)
    const response = await axios.get('https://countbooks-tnmo2o5yuq-uc.a.run.app');
    jsondata.value = JSON.stringify(response.data, null, 2);
    error.value = null;
  } catch (err) {
    console.error(err);
    error.value = 'Error fetching book count';
    jsondata.value = null;
  }
};

onMounted(() => {
  getBookCountAPI();
});
</script>
