<template>
  <svg
    class="brand-mark"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`brand-${uid}`" x1="8" y1="12" x2="40" y2="42" gradientUnits="userSpaceOnUse">
        <stop stop-color="#f4c6d8" />
        <stop offset="0.55" stop-color="#e9a3c0" />
        <stop offset="1" stop-color="#c7b2e6" />
      </linearGradient>
      <linearGradient :id="`cloud-${uid}`" x1="12" y1="18" x2="36" y2="34" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" />
        <stop offset="1" stop-color="#f2ecfa" />
      </linearGradient>
    </defs>
    <rect x="5" y="12" width="38" height="28" rx="9" :fill="`url(#brand-${uid})`" />
    <path
      d="M8 17.5L24 29l16-11.5"
      stroke="#ffffff"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.9"
    />
    <path
      d="M15.5 17.5c-2.6 0-4.7 2-4.7 4.5 0 2.3 1.8 4.2 4.1 4.5.8 2.6 3.2 4.5 6.1 4.5 3.5 0 6.4-2.7 6.4-6.1 0-.2 0-.5-.1-.7 1.7-.4 3-1.8 3-3.6 0-2-1.7-3.6-3.8-3.6H15.5z"
      :fill="`url(#cloud-${uid})`"
      opacity="0.96"
    />
    <path
      d="M24 38.5c-1.8-1.7-4.5-.6-4.5 1.4 0 1.9 2.7 3.4 4.5 4.6 1.8-1.2 4.5-2.7 4.5-4.6 0-2-2.7-3.1-4.5-1.4z"
      fill="#ffffff"
      opacity="0.92"
    />
  </svg>
</template>

<script setup>
import { useId } from 'vue'

const uid = useId()
</script>

<style scoped>
.brand-mark {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
