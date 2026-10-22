<template>
  <pre>{{ jsondata }}</pre>
</template>

<script setup>
import axios from 'axios';
import { ref, onMounted } from 'vue';

const jsondata = ref(null);
const error = ref(null);

const getAllBookAPI = async () => {
  try {
    // getAllBooks cloud function URL (returns every book in Firestore)
    const response = await axios.get('https://getallbooks-tnmo2o5yuq-uc.a.run.app');
    jsondata.value = JSON.stringify(response.data, null, 2);
    error.value = null;
  } catch (err) {
    console.error(err);
    error.value = 'Error fetching books';
    jsondata.value = null;
  }
};

onMounted(() => {
  getAllBookAPI();
});
</script>
