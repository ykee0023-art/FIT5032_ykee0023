<template>
  <footer class="py-4 mt-5">
    <div class="container">
      <div class="row g-4">
        <div class="col-12 col-md-4">
          <h5><i class="bi bi-tree me-2"></i>GreenRoots Melbourne</h5>
          <p class="small">
            A not-for-profit dedicated to urban greening, community tree planting,
            and biodiversity conservation across Greater Melbourne.
          </p>
        </div>
        <div class="col-6 col-md-4">
          <h6>Quick Links</h6>
          <ul class="list-unstyled small">
            <li><RouterLink to="/about">About Us</RouterLink></li>
            <li><RouterLink to="/events">Events</RouterLink></li>
            <li><RouterLink to="/get-involved">Get Involved</RouterLink></li>
            <li><RouterLink to="/contact">Contact Us</RouterLink></li>
          </ul>
        </div>
        <div class="col-6 col-md-4">
          <h6>Connect</h6>
          <ul class="list-unstyled small">
            <li><i class="bi bi-envelope me-1"></i> info@greenroots.org.au</li>
            <li><i class="bi bi-telephone me-1"></i> (03) 9000 1234</li>
            <li><i class="bi bi-geo-alt me-1"></i> Melbourne, VIC</li>
          </ul>
        </div>
      </div>
      <hr class="my-3 border-light" />
      <p class="text-center small mb-0">
        &copy; 2026 GreenRoots Melbourne. All rights reserved.
      </p>
    </div>
  </footer>
</template>
