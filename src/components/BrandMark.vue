<template>
  <svg
    class="brand-mark"
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`bg-${uid}`" x1="64" y1="48" x2="448" y2="464" gradientUnits="userSpaceOnUse">
        <stop stop-color="#fff7fa" />
        <stop offset="0.48" stop-color="#f7eef9" />
        <stop offset="1" stop-color="#eaf3fc" />
      </linearGradient>
      <radialGradient :id="`glow-${uid}`" cx="0.78" cy="0.12" r="0.72">
        <stop stop-color="#ffd7e4" stop-opacity="0.9" />
        <stop offset="1" stop-color="#ffd7e4" stop-opacity="0" />
      </radialGradient>
      <linearGradient :id="`plane-top-${uid}`" x1="132" y1="150" x2="372" y2="300" gradientUnits="userSpaceOnUse">
        <stop stop-color="#8c759b" />
        <stop offset="1" stop-color="#bd8fac" />
      </linearGradient>
      <linearGradient :id="`plane-bottom-${uid}`" x1="270" y1="300" x2="350" y2="402" gradientUnits="userSpaceOnUse">
        <stop stop-color="#e9a3c0" />
        <stop offset="1" stop-color="#d9799f" />
      </linearGradient>
      <linearGradient :id="`cloud-${uid}`" x1="90" y1="280" x2="250" y2="400" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" />
        <stop offset="1" stop-color="#f4f8fd" />
      </linearGradient>
    </defs>

    <rect width="512" height="512" rx="118" :fill="`url(#bg-${uid})`" />
    <rect width="512" height="512" rx="118" :fill="`url(#glow-${uid})`" />

    <g opacity="0.55" fill="#ffffff">
      <circle cx="104" cy="126" r="6" />
      <circle cx="416" cy="350" r="5" />
      <circle cx="386" cy="104" r="3.5" />
    </g>

    <path
      d="M112 392c-23 0-41-17-41-39 0-19 14-35 33-39 7-27 31-46 60-46 34 0 61 27 61 60 0 4 0 7-1 11 14 4 24 16 24 31 0 18-15 32-34 32H112z"
      :fill="`url(#cloud-${uid})`"
      opacity="0.86"
    />

    <path
      d="M244 326Q292 292 334 258"
      fill="none"
      stroke="#d98aa8"
      stroke-width="7"
      stroke-linecap="round"
      stroke-dasharray="1 18"
      opacity="0.55"
    />

    <path d="M400 132L116 268l134 38z" :fill="`url(#plane-top-${uid})`" />
    <path d="M400 132L250 306l42 90z" :fill="`url(#plane-bottom-${uid})`" />
    <path
      d="M400 132L116 268l134 38 42 90 108-264z"
      fill="none"
      stroke="#ffffff"
      stroke-width="11"
      stroke-linejoin="round"
      stroke-linecap="round"
      opacity="0.92"
    />
    <path
      d="M400 132L250 306"
      stroke="#ffffff"
      stroke-width="11"
      stroke-linecap="round"
      opacity="0.92"
    />

    <circle cx="322" cy="214" r="4" fill="#ffffff" opacity="0.7" />
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
