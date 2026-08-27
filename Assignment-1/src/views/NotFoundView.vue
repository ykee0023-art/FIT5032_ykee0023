<template>
  <div class="container py-5">
    <div class="row justify-content-center text-center">
      <div class="col-12 col-md-8 col-lg-6">
        <i class="bi bi-signpost-split display-1 text-greenroots" aria-hidden="true"></i>
        <p class="display-4 fw-bold mt-3 mb-2">404</p>
        <h1 class="h3 mb-3">This page has not taken root</h1>
        <p class="text-muted mb-4">
          The page you are looking for does not exist or may have been moved. Let's get you back to
          familiar ground.
        </p>
        <div class="d-flex justify-content-center gap-3 flex-wrap">
          <RouterLink to="/" class="btn btn-greenroots btn-lg">
            <i class="bi bi-house me-2" aria-hidden="true"></i>Back to Home
          </RouterLink>
          <RouterLink to="/events" class="btn btn-outline-greenroots btn-lg">
            <i class="bi bi-calendar-event me-2" aria-hidden="true"></i>Browse Events
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
