<script setup>
import { onMounted } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import EventCard from '@/components/common/EventCard.vue'

const store = useEventStore()

onMounted(() => {
  store.loadEvents()
})
</script>

<template>
  <div>
    <section class="hero-section text-center">
      <div class="container">
        <h1 class="display-4 fw-bold mb-3">Growing a Greener Melbourne</h1>
        <p class="lead mb-4 mx-auto fw-semibold" style="max-width: 600px">
          GreenRoots Melbourne is a not-for-profit dedicated to urban greening, community tree
          planting, and biodiversity conservation across Greater Melbourne.
        </p>
        <div class="d-flex justify-content-center gap-3 flex-wrap">
          <RouterLink to="/get-involved" class="btn btn-light btn-lg">
            <i class="bi bi-hand-thumbs-up me-2" aria-hidden="true"></i>Volunteer Now
          </RouterLink>
          <RouterLink to="/events" class="btn btn-outline-light btn-lg">
            <i class="bi bi-calendar-event me-2" aria-hidden="true"></i>View Events
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="py-5">
      <div class="container">
        <div class="row g-4 text-center">
          <div class="col-6 col-md-3">
            <div class="p-3">
              <i class="bi bi-tree fs-1 text-greenroots" aria-hidden="true"></i>
              <h3 class="fw-bold mt-2">{{ store.totalEvents }}</h3>
              <p class="text-muted mb-0">Active Events</p>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-3">
              <i class="bi bi-people fs-1 text-greenroots" aria-hidden="true"></i>
              <h3 class="fw-bold mt-2">{{ store.totalSpots }}</h3>
              <p class="text-muted mb-0">Spots Available</p>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-3">
              <i class="bi bi-star fs-1 text-greenroots" aria-hidden="true"></i>
              <h3 class="fw-bold mt-2">{{ store.averageRating }}</h3>
              <p class="text-muted mb-0">Avg Rating</p>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-3">
              <i class="bi bi-geo-alt fs-1 text-greenroots" aria-hidden="true"></i>
              <h3 class="fw-bold mt-2">Melbourne</h3>
              <p class="text-muted mb-0">Victoria, AU</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-5 bg-light">
      <div class="container">
        <h2 class="text-center mb-4">Upcoming Events</h2>
        <div class="row g-4">
          <div
            v-for="event in store.events.slice(0, 3)"
            :key="event.id"
            class="col-12 col-sm-6 col-lg-4"
          >
            <EventCard :event="event" />
          </div>
        </div>
        <div class="text-center mt-4">
          <RouterLink to="/events" class="btn btn-outline-greenroots btn-lg">
            View All Events <i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="py-5">
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-12 col-md-6">
            <h2>Why Urban Greening Matters</h2>
            <p>
              Melbourne's urban canopy faces increasing pressure from development, climate change,
              and population growth. GreenRoots works with communities to plant native trees, restore
              biodiversity corridors, and create green spaces that benefit both people and wildlife.
            </p>
            <ul class="list-unstyled">
              <li class="mb-2">
                <i class="bi bi-check-circle text-greenroots me-2" aria-hidden="true"></i>Reduce urban heat island
                effect
              </li>
              <li class="mb-2">
                <i class="bi bi-check-circle text-greenroots me-2" aria-hidden="true"></i>Support native wildlife
                habitat
              </li>
              <li class="mb-2">
                <i class="bi bi-check-circle text-greenroots me-2" aria-hidden="true"></i>Improve air quality and
                wellbeing
              </li>
              <li class="mb-2">
                <i class="bi bi-check-circle text-greenroots me-2" aria-hidden="true"></i>Build stronger communities
              </li>
            </ul>
          </div>
          <div class="col-12 col-md-6">
            <div class="bg-success bg-opacity-10 rounded-3 p-4 text-center">
              <i class="bi bi-globe-americas display-1 text-greenroots" aria-hidden="true"></i>
              <h4 class="mt-3">Join the Movement</h4>
              <p class="text-muted">Every tree planted makes a difference.</p>
              <RouterLink to="/get-involved" class="btn btn-greenroots">
                Get Involved Today
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
