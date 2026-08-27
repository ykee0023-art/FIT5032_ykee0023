<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')

const articles = ref([
  {
    id: 1,
    title: 'The Benefits of Native Tree Planting in Urban Areas',
    category: 'Education',
    excerpt:
      'Discover why planting native species is crucial for urban ecosystems and how it benefits local communities.',
    date: '2026-08-15'
  },
  {
    id: 2,
    title: 'How to Start a Community Garden in Melbourne',
    category: 'Guide',
    excerpt:
      'A step-by-step guide to establishing a community garden in your neighbourhood, from planning to planting.',
    date: '2026-08-01'
  },
  {
    id: 3,
    title: "Understanding Melbourne's Urban Biodiversity",
    category: 'Research',
    excerpt:
      "An overview of the diverse plant and animal species that call Melbourne's green spaces home.",
    date: '2026-07-20'
  },
  {
    id: 4,
    title: 'Volunteer Safety: What You Need to Know',
    category: 'Guide',
    excerpt:
      'Essential safety tips for volunteers participating in outdoor planting and conservation events.',
    date: '2026-07-10'
  },
  {
    id: 5,
    title: 'Climate Resilience Through Urban Greening',
    category: 'Research',
    excerpt:
      'How strategic tree planting helps cities adapt to rising temperatures and extreme weather events.',
    date: '2026-06-25'
  }
])

const filteredArticles = computed(() => {
  if (!searchQuery.value) return articles.value
  const query = searchQuery.value.toLowerCase()
  return articles.value.filter(
    (a) => a.title.toLowerCase().includes(query) || a.category.toLowerCase().includes(query)
  )
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="container py-5">
    <h1 class="mb-2">Resources &amp; Articles</h1>
    <p class="text-muted mb-4">
      Learn about urban greening, native species, and how you can make a difference.
    </p>

    <div class="row mb-4">
      <div class="col-12 col-md-6">
        <label for="article-search" class="visually-hidden">
          Search articles by title or category
        </label>
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>
          <input
            id="article-search"
            v-model="searchQuery"
            type="search"
            class="form-control"
            placeholder="Search articles..."
          />
        </div>
      </div>
    </div>

    <p class="text-muted small" role="status" aria-live="polite">
      Showing {{ filteredArticles.length }} of {{ articles.length }} articles
    </p>

    <div class="row g-4">
      <div v-for="article in filteredArticles" :key="article.id" class="col-12 col-md-6">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge bg-success-subtle text-success">{{ article.category }}</span>
              <small class="text-muted">{{ formatDate(article.date) }}</small>
            </div>
            <h5 class="card-title">{{ article.title }}</h5>
            <p class="card-text text-muted">{{ article.excerpt }}</p>
            <button
              class="btn btn-sm btn-outline-greenroots"
              :aria-label="`Read more about ${article.title}`"
            >
              Read More
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredArticles.length === 0" class="text-center py-5">
      <i class="bi bi-journal-text display-4 text-muted" aria-hidden="true"></i>
      <p class="text-muted fs-5 mt-3">No articles found matching your search.</p>
      <button class="btn btn-greenroots" @click="searchQuery = ''">View all articles</button>
    </div>

    <section class="mt-5 p-4 bg-light rounded-3">
      <h3>Frequently Asked Questions</h3>
      <div class="accordion mt-3" id="faqAccordion">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button
              class="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#faq1"
            >
              Do I need experience to volunteer?
            </button>
          </h2>
          <div id="faq1" class="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
            <div class="accordion-body">
              No experience is needed! We provide all training, tools, and guidance on the day.
              Everyone is welcome regardless of skill level.
            </div>
          </div>
        </div>
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button
              class="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#faq2"
            >
              What should I bring to an event?
            </button>
          </h2>
          <div id="faq2" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
            <div class="accordion-body">
              Wear comfortable clothing you don't mind getting dirty, closed-toe shoes, a hat, and
              sunscreen. We provide gloves, tools, and refreshments.
            </div>
          </div>
        </div>
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button
              class="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#faq3"
            >
              Can I volunteer as a group?
            </button>
          </h2>
          <div id="faq3" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
            <div class="accordion-body">
              Absolutely! We welcome corporate teams, school groups, and community organisations.
              Contact us to arrange a group booking.
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
