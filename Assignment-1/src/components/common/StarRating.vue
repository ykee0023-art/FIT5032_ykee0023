<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  readonly: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
})

const emit = defineEmits(['update:modelValue'])

const hoverRating = ref(0)

function getStarClass(index) {
  const active = hoverRating.value || props.modelValue
  return index <= active ? 'bi-star-fill star-active' : 'bi-star star-inactive'
}

function handleClick(index) {
  if (props.readonly) return
  emit('update:modelValue', index)
}

function handleMouseEnter(index) {
  if (props.readonly) return
  hoverRating.value = index
}

function handleMouseLeave() {
  if (props.readonly) return
  hoverRating.value = 0
}
</script>

<template>
  <span
    class="star-rating"
    :class="[`star-${size}`, { 'star-readonly': readonly }]"
  >
    <i
      v-for="i in 5"
      :key="i"
      class="bi"
      :class="getStarClass(i)"
      @click="handleClick(i)"
      @mouseenter="handleMouseEnter(i)"
      @mouseleave="handleMouseLeave"
    ></i>
  </span>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  gap: 2px;
}

.star-rating .bi {
  transition: color 0.15s, transform 0.15s;
}

.star-active {
  color: #ffc107;
}

.star-inactive {
  color: #dee2e6;
}

.star-rating:not(.star-readonly) .bi {
  cursor: pointer;
}

.star-rating:not(.star-readonly) .bi:hover {
  transform: scale(1.15);
}

.star-sm .bi {
  font-size: 0.875rem;
}

.star-md .bi {
  font-size: 1.25rem;
}

.star-lg .bi {
  font-size: 1.5rem;
}
</style>
