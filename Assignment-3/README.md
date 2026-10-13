# GreenRoots Melbourne

A responsive single-page web application for **GreenRoots Melbourne**, a fictional not-for-profit
organisation dedicated to urban greening, community tree planting, and biodiversity conservation
across Greater Melbourne.

Built with Vue.js 3 for **FIT5032 – Internet Applications Development**, Assignment 1.2.

| | |
|---|---|
| **Student** | Yunpeng Ke |
| **Student ID** | 35366397 |
| **Unit** | FIT5032 – Internet Applications Development |
| **Assessment** | A1.2 – Basic Application Development V1 |

---

## Getting Started

**Prerequisites:** Node.js `^22.18.0` or `>=24.12.0` and npm.

```sh
npm install     # install dependencies
npm run dev     # start the dev server (http://localhost:5173)
```

Other scripts:

```sh
npm run build    # production build into dist/
npm run preview  # preview the production build locally
npm run lint     # run oxlint + ESLint with --fix
npm run format   # format src/ with Prettier
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Vue.js 3.5 (Composition API, `<script setup>`) |
| Build tool | Vite 8 |
| Routing | Vue Router 5 (HTML5 history mode, lazy-loaded routes) |
| State management | Pinia 4 (setup-store syntax) |
| UI framework | Bootstrap 5.3 + Bootstrap Icons |
| Tooling | ESLint, oxlint, Prettier |

---

## Pages

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Hero banner, live impact statistics, featured events |
| `/about` | About Us | Organisation background, values, team profiles |
| `/events` | Events | Full event listing with live search and type filtering |
| `/resources` | Resources | Searchable article library and an FAQ accordion |
| `/get-involved` | Get Involved | Volunteer registration form (6 fields) |
| `/contact` | Contact Us | General enquiry form (4 fields) |
| `*` | Not Found | Friendly 404 fallback for unmatched URLs |

---

## Business Requirements

### BR (A.1) — Development Stack and Coding

- Vue.js 3.5 throughout, using the **Composition API** with `<script setup>` in every component.
- Reactivity via `ref`, `reactive`, and `computed`; lifecycle handled with `onMounted`.
- **Pinia store** (`src/stores/eventStore.js`) written in setup-store syntax, exposing derived state
  as computed getters (`filteredEvents`, `eventTypes`, `totalEvents`, `averageRating`,
  `totalSpots`) and actions (`loadEvents`, `clearFilters`).
- **Reusable composable** (`src/composables/useFormValidation.js`) shared by both forms, removing
  duplicated validation logic.
- **Reusable component** (`EventCard.vue`) with a typed, required prop, rendered from both the Home
  and Events pages.
- **Lazy-loaded routes** so each view ships as its own chunk, plus a `scrollBehavior` that returns
  to the top on navigation and a fade `<Transition>` between views.
- Separation of concerns: `views/` · `components/` · `stores/` · `composables/` · `data/` ·
  `router/` · `assets/styles/`.

### BR (A.2) — Responsiveness

Mobile-first layout built on the Bootstrap 5 grid, with **four custom breakpoints** in
`src/assets/styles/main.css` on top of the framework defaults:

| Breakpoint | Behaviour |
|---|---|
| `< 576px` | Single-column cards, reduced hero padding, smaller hero heading |
| `576px – 768px` | Two-column card grid, intermediate hero padding |
| `992px – 1200px` | Three-column grid, navigation expands inline, adjusted hero padding |
| `> 1400px` | Full desktop layout at maximum container width |

Additional responsive detail:

- Fluid typography with `clamp()` on the hero heading and lead paragraph.
- Collapsible hamburger navigation below `992px`, with the active-link indicator switching from an
  underline to a left border on small screens.
- No horizontal overflow at any width.

### BR (B.1) — Validations

Both forms are validated client-side through the shared `useFormValidation` composable, which
implements **five distinct validation types**:

| Type | Rule | Used by |
|---|---|---|
| `required` | Non-empty after trimming | Name, Subject, Area of Interest |
| `email` | Regex-based address format | Email |
| `minLength` | Configurable minimum character count | Message |
| `phone` | Australian mobile/landline format (`+61` or `0` prefix) | Phone |
| `ageRange` | Numeric value within a configurable min/max | Age |

Feedback design:

- Validation runs on **blur** for immediate, non-intrusive feedback, and again on submit.
- Bootstrap `is-invalid` / `is-valid` states give red and green visual cues alongside a specific
  error message per field.
- The submit button stays disabled until every field is valid.
- A live character counter accompanies the minimum-length field.
- Successful submissions persist to `localStorage` and show a dismissible confirmation alert.

### BR (B.2) — Dynamic Data & Data Structure

- Event data lives in `src/data/events.json` — an array of nine objects, each shaped as:

  ```json
  {
    "id": 1,
    "name": "Merri Creek Planting Day",
    "date": "2026-09-05",
    "time": "9:00 AM - 12:00 PM",
    "suburb": "Coburg North",
    "type": "Tree planting",
    "spots": 14,
    "totalSpots": 30,
    "rating": 4.8,
    "description": "Join us for a morning of native tree planting..."
  }
  ```

- The JSON is loaded into the Pinia store and rendered with `v-for`; **no page hard-codes event
  content**.
- Home page statistics (total events, spots available, average rating) are **computed** from the
  data set rather than written by hand, so they update automatically if the JSON changes.
- The Events page derives its filter dropdown from the data itself (`new Set` over event types) and
  filters reactively on search text and type.
- Dates are stored as ISO `YYYY-MM-DD` strings and formatted for display with
  `toLocaleDateString('en-AU', …)`.
- Conditional rendering reflects data state: full events show a disabled *Waitlist* button, and an
  empty result set shows a dedicated empty state.

---

## Accessibility

- Semantic landmarks (`<nav>`, `<main>`, `<footer>`) and a logical heading hierarchy.
- A **skip-to-main-content link** as the first focusable element on the page.
- Every form control has an associated `<label>`; search and filter controls use visually-hidden
  labels so the design stays clean without losing the accessible name.
- Icon-only and repeated buttons carry descriptive `aria-label`s (for example,
  *"Register for Merri Creek Planting Day"* rather than nine identical *"Register"* buttons).
- Decorative icons are hidden from assistive technology with `aria-hidden="true"`.
- Filter results are announced through an `aria-live="polite"` status region.

---

## Project Structure

```
src/
├── assets/styles/main.css        # Design tokens, custom breakpoints, transitions
├── components/
│   ├── common/EventCard.vue      # Reusable event card (props-driven)
│   └── layout/
│       ├── NavBar.vue            # Responsive navigation with active-route state
│       └── FooterBar.vue         # Site footer
├── composables/
│   └── useFormValidation.js      # Shared validation logic (5 validator types)
├── data/events.json              # Event data set
├── router/index.js               # Route definitions, lazy loading, scroll behaviour
├── stores/eventStore.js          # Pinia store: state, getters, actions
├── views/                        # One component per route
├── App.vue                       # Layout shell, skip link, route transitions
└── main.js                       # App bootstrap
```

---

## Notes

- Form submissions are stored in the browser's `localStorage`; there is no backend in this
  assessment stage.
- Organisation details, events, articles, and team members are fictional and exist solely to
  demonstrate the application.
