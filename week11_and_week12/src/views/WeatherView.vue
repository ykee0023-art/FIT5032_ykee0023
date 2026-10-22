<template>
  <div class="container">
    <div class="header">
      <h1>WEATHER APP</h1>
      <div class="search-bar">
        <input
          type="text"
          v-model="city"
          placeholder="Enter city name"
          class="search-input"
        />
        <button @click="searchByCity"
                class="search-button">Search</button>
      </div>
    </div>

    <!--The <main> tag in HTML is used to specify the main content of a document
    More info about main, check https://www.w3schools.com/tags/tag_main.asp-->
    <main>
      <!--If there are no data returned, then skip rendering the information-->
      <div v-if="weatherData">
        <!--Display the weather data attribute returned from API
        Example of API data: https://openweathermap.org/current-->
        <h2>
          {{ weatherData.name }}, {{ weatherData.sys.country }}
        </h2>
        <div>
          <!--The image source of the weather icon will be coming from a function called iconUrl
              which will be shared in script later-->
          <img :src="iconUrl" alt="Weather Icon" />
          <p>{{ temperature }} °C</p>
        </div>
        <!-- weather[0] means the current weather, the way we need to obtain data depends on how
        the API JSON data looks-->
        <span>{{ weatherData.weather[0].description }}</span>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

// API key from 10.1.2, kept in .env.local (git-ignored) so it is never committed
const apikey = import.meta.env.VITE_OPENWEATHER_API_KEY;

// Reactive state (replacing `data()`)
const city = ref("");
const weatherData = ref(null);
const hourlyForecast = ref([]);
const dailyForecast = ref([]);

// Computed properties (replacing `computed:`)
const temperature = computed(() => {
  return weatherData.value
    ? Math.floor(weatherData.value.main.temp - 273)
    : null;
});

const iconUrl = computed(() => {
  return weatherData.value
    ? `https://openweathermap.org/payload/api/media/file/${weatherData.value.weather[0].icon}.png`
    : null;
});

// Methods (defined as standard JavaScript functions)
const fetchWeatherData = async (url) => {
  try {
    const response = await axios.get(url);
    // Use .value to update ref variables
    weatherData.value = response.data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
};

const fetchCurrentLocationWeather = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apikey}`;
      await fetchWeatherData(url);
    });
  }
};

// Handler for the Search button (not included in the tutorial's script)
const searchByCity = async () => {
  if (!city.value) {
    return;
  }
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.value)}&appid=${apikey}`;
  await fetchWeatherData(url);
};

// Lifecycle hook (replacing `mounted()`)
onMounted(() => {
  fetchCurrentLocationWeather();
});
</script>
