<template>
  <div class="container py-5 text-center">
    <i class="bi bi-shield-exclamation display-1 text-danger"></i>
    <h1 class="mt-3">Access Denied</h1>
    <p class="text-muted fs-5">
      You don't have permission to access this page.
    </p>
    <div class="d-flex justify-content-center gap-3 mt-4">
      <RouterLink to="/" class="btn btn-greenroots">
        <i class="bi bi-house me-1"></i>Return to Home
      </RouterLink>
      <RouterLink to="/login" class="btn btn-outline-secondary">
        <i class="bi bi-box-arrow-in-right me-1"></i>Sign In
      </RouterLink>
    </div>
  </div>
</template>
