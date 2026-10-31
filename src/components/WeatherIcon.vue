<template>
  <svg
    class="weather-icon"
    :class="[`kind-${resolvedKind}`, `tone-${tone}`, { animated }]"
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`sun-${uid}`" x1="20" y1="16" x2="46" y2="48" gradientUnits="userSpaceOnUse">
        <stop stop-color="#f8d07c" />
        <stop offset="1" stop-color="#efa07a" />
      </linearGradient>
      <linearGradient :id="`cloud-${uid}`" x1="18" y1="30" x2="48" y2="52" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" />
        <stop offset="1" stop-color="#e4edf8" />
      </linearGradient>
      <linearGradient :id="`rain-${uid}`" x1="22" y1="42" x2="42" y2="60" gradientUnits="userSpaceOnUse">
        <stop stop-color="#a9cbe8" />
        <stop offset="1" stop-color="#78a8d2" />
      </linearGradient>
      <linearGradient :id="`moon-${uid}`" x1="28" y1="14" x2="44" y2="46" gradientUnits="userSpaceOnUse">
        <stop stop-color="#f6e7b8" />
        <stop offset="1" stop-color="#e7c98d" />
      </linearGradient>
    </defs>

    <!-- 太阳 -->
    <g v-if="resolvedKind === 'sun' || resolvedKind === 'hot'">
      <g class="sun-rays" :stroke="`url(#sun-${uid})`" stroke-width="2.2" stroke-linecap="round">
        <path v-for="ray in rays" :key="ray.id" :d="ray.d" />
      </g>
      <circle class="sun-core" cx="32" cy="32" r="11.5" :fill="`url(#sun-${uid})`" />
      <path
        v-if="resolvedKind === 'hot'"
        class="heat"
        d="M18 52c3-3 6-3 9 0s6 3 9 0 6-3 9 0"
        stroke="#eaa07a"
        stroke-width="2"
        stroke-linecap="round"
      />
    </g>

    <!-- 月亮 -->
    <g v-else-if="resolvedKind === 'moon'">
      <path
        class="moon-core"
        d="M41.5 15.5c-7.6 2-13 9-13 17.1 0 7.2 4.2 13.4 10.3 16.2-1.9.5-3.9.8-6 .8-10.5 0-19-8.5-19-19s8.5-19 19-19c3.2 0 6.2.8 8.7 2.1z"
        :fill="`url(#moon-${uid})`"
      />
      <g class="stars" fill="#e7c98d">
        <circle cx="46" cy="18" r="1.2" />
        <circle cx="51" cy="27" r="0.9" />
        <circle cx="45" cy="32" r="0.7" />
      </g>
    </g>

    <!-- 多云 -->
    <g v-else-if="resolvedKind === 'partly' || resolvedKind === 'partly-night'">
      <g v-if="resolvedKind === 'partly'" class="small-sun">
        <circle cx="23" cy="23" r="8" :fill="`url(#sun-${uid})`" />
        <g :stroke="`url(#sun-${uid})`" stroke-width="1.8" stroke-linecap="round">
          <path d="M23 10.5v3M23 32.5v3M10.5 23h3M32.5 23h3M14.2 14.2l2.1 2.1M29.7 29.7l2.1 2.1M31.8 14.2l-2.1 2.1M16.3 29.7l-2.1 2.1" />
        </g>
      </g>
      <path
        v-else
        class="small-moon"
        d="M28 14.5c-4.6 1.6-7.9 6-7.9 11.1 0 4.3 2.2 8.1 5.6 10.3-1.2.3-2.5.5-3.8.5-6.6 0-12-5.4-12-12s5.4-12 12-12c2.1 0 4.1.5 5.9 1.5z"
        :fill="`url(#moon-${uid})`"
      />
      <g class="cloud-body">
        <path
          d="M22 47c-4.4 0-8-3.4-8-7.6 0-3.9 3-7.2 6.9-7.6 1.3-4.4 5.4-7.6 10.2-7.6 5.9 0 10.7 4.6 10.7 10.3 0 .4 0 .8-.1 1.2 2.9.6 5.1 3.1 5.1 6.1 0 3.4-2.9 6.2-6.4 6.2H22z"
          :fill="`url(#cloud-${uid})`"
          stroke="#ffffff"
          stroke-width="1.2"
        />
      </g>
    </g>

    <!-- 阴 -->
    <g v-else-if="resolvedKind === 'overcast'">
      <path
        class="cloud-back"
        d="M18 39c-3.6 0-6.5-2.8-6.5-6.2 0-3.2 2.4-5.8 5.6-6.2 1.1-3.6 4.4-6.2 8.3-6.2 4.8 0 8.7 3.7 8.7 8.4 0 .3 0 .7-.1 1 2.4.5 4.2 2.5 4.2 5 0 2.8-2.4 5.1-5.2 5.1H18z"
        :fill="`url(#cloud-${uid})`"
        opacity="0.72"
      />
      <path
        class="cloud-body"
        d="M27 51c-4.4 0-8-3.4-8-7.6 0-3.9 3-7.2 6.9-7.6 1.3-4.4 5.4-7.6 10.2-7.6 5.9 0 10.7 4.6 10.7 10.3 0 .4 0 .8-.1 1.2 2.9.6 5.1 3.1 5.1 6.1 0 3.4-2.9 6.2-6.4 6.2H27z"
        :fill="`url(#cloud-${uid})`"
        stroke="#ffffff"
        stroke-width="1.2"
      />
    </g>

    <!-- 雨 / 雷 / 雨夹雪 -->
    <g v-else-if="['rain', 'thunder', 'sleet'].includes(resolvedKind)">
      <path
        class="cloud-body"
        d="M20 42c-4.2 0-7.6-3.2-7.6-7.2 0-3.7 2.8-6.8 6.5-7.2C20.1 23.4 24 20.4 28.6 20.4c5.6 0 10.2 4.4 10.2 9.8 0 .4 0 .7-.1 1.1 2.8.6 4.9 3 4.9 5.8 0 3.2-2.7 5.9-6.1 5.9H20z"
        :fill="`url(#cloud-${uid})`"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <g v-if="resolvedKind === 'thunder'" class="bolt" fill="#e0a24a">
        <path d="M33 41l-5.4 10h5.1L30.5 60l9-12.2h-5.4L38 41h-5z" />
      </g>
      <g v-else-if="resolvedKind === 'sleet'">
        <g :stroke="`url(#rain-${uid})`" stroke-width="2" stroke-linecap="round">
          <path class="drop drop-a" d="M21 47l-2 6" />
          <path class="drop drop-b" d="M31 47l-2 6" />
        </g>
        <g stroke="#9fc6e6" stroke-width="1.4" stroke-linecap="round">
          <path d="M43 47v7M39.5 50.5h7M40.5 48l5 5M45.5 48l-5 5" />
        </g>
      </g>
      <g v-else :stroke="`url(#rain-${uid})`" stroke-width="2.2" stroke-linecap="round">
        <path class="drop drop-a" d="M20 47l-2.2 6.4" />
        <path class="drop drop-b" d="M30 47l-2.2 6.4" />
        <path class="drop drop-c" d="M40 47l-2.2 6.4" />
      </g>
    </g>

    <!-- 雪 -->
    <g v-else-if="resolvedKind === 'snow'">
      <path
        class="cloud-body"
        d="M20 41c-4.2 0-7.6-3.2-7.6-7.2 0-3.7 2.8-6.8 6.5-7.2C20.1 22.4 24 19.4 28.6 19.4c5.6 0 10.2 4.4 10.2 9.8 0 .4 0 .7-.1 1.1 2.8.6 4.9 3 4.9 5.8 0 3.2-2.7 5.9-6.1 5.9H20z"
        :fill="`url(#cloud-${uid})`"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <g class="flakes" stroke="#9fc6e6" stroke-width="1.5" stroke-linecap="round">
        <g class="flake flake-a" transform="translate(20 51)">
          <path d="M0-4V4M-3.5-2L3.5 2M-3.5 2L3.5-2" />
        </g>
        <g class="flake flake-b" transform="translate(32 55)">
          <path d="M0-4V4M-3.5-2L3.5 2M-3.5 2L3.5-2" />
        </g>
        <g class="flake flake-c" transform="translate(44 51)">
          <path d="M0-4V4M-3.5-2L3.5 2M-3.5 2L3.5-2" />
        </g>
      </g>
    </g>

    <!-- 雾 / 风 -->
    <g v-else-if="resolvedKind === 'fog' || resolvedKind === 'wind'">
      <g :stroke="resolvedKind === 'fog' ? '#b9c6d6' : '#9fc0dc'" stroke-width="3" stroke-linecap="round">
        <path d="M14 24h27" />
        <path d="M18 33h31" />
        <path d="M12 42h24" />
        <path d="M22 51h28" />
      </g>
      <path
        v-if="resolvedKind === 'wind'"
        d="M48 20c4 0 6 2.2 6 5s-2.4 5-5.4 5H42"
        stroke="#9fc0dc"
        stroke-width="3"
        stroke-linecap="round"
      />
    </g>

    <!-- 冷 -->
    <g v-else-if="resolvedKind === 'cold'">
      <g stroke="#9fc6e6" stroke-width="2.4" stroke-linecap="round">
        <path d="M32 12v40M14.7 22l34.6 20M49.3 22L14.7 42" />
        <path d="M32 20l-5-5M32 20l5-5M32 44l-5 5M32 44l5 5" />
        <path d="M22 27l-7-1M22 27l-1-7M42 37l7 1M42 37l1 7" />
        <path d="M42 27l7-1M42 27l1-7M22 37l-7 1M22 37l-1 7" />
      </g>
    </g>

    <!-- 预警 -->
    <g v-else-if="resolvedKind === 'warning'">
      <path
        d="M32 9l23 43H9L32 9z"
        fill="rgba(233, 143, 178, 0.14)"
        stroke="#d9799f"
        stroke-width="2.4"
        stroke-linejoin="round"
      />
      <path d="M32 24v17" stroke="#d9799f" stroke-width="3" stroke-linecap="round" />
      <circle cx="32" cy="47" r="2" fill="#d9799f" />
    </g>

    <!-- 双城 -->
    <g v-else-if="resolvedKind === 'gap'">
      <circle cx="16" cy="34" r="5" fill="#6f9ec7" />
      <circle cx="48" cy="34" r="5" fill="#d9799f" />
      <path
        d="M24 34c4-10 12-10 16 0"
        stroke="#b8a8c4"
        stroke-width="2"
        stroke-linecap="round"
        stroke-dasharray="2 5"
      />
      <path d="M29 46h6" stroke="#c9b9d2" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- 信 -->
    <g v-else-if="resolvedKind === 'letter'">
      <rect x="9" y="18" width="46" height="31" rx="6" fill="rgba(255,255,255,0.9)" stroke="#c9b9d2" stroke-width="2" />
      <path d="M11 22l21 15 21-15" stroke="#c9b9d2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path
        d="M32 31c-3.6-3.4-9-1.2-9 2.8 0 3.8 5.4 6.8 9 9.2 3.6-2.4 9-5.4 9-9.2 0-4-5.4-6.2-9-2.8z"
        fill="#e98fb2"
        opacity="0.9"
      />
    </g>

    <!-- 兜底 -->
    <g v-else>
      <path
        class="cloud-body"
        d="M22 47c-4.4 0-8-3.4-8-7.6 0-3.9 3-7.2 6.9-7.6 1.3-4.4 5.4-7.6 10.2-7.6 5.9 0 10.7 4.6 10.7 10.3 0 .4 0 .8-.1 1.2 2.9.6 5.1 3.1 5.1 6.1 0 3.4-2.9 6.2-6.4 6.2H22z"
        :fill="`url(#cloud-${uid})`"
        stroke="#ffffff"
        stroke-width="1.2"
      />
    </g>
  </svg>
</template>

<script setup>
import { computed, useId } from 'vue'
import { weatherKind } from '../lib/icons'

const props = defineProps({
  kind: { type: String, default: '' },
  code: { type: [String, Number], default: '' },
  text: { type: String, default: '' },
  size: { type: [Number, String], default: 56 },
  tone: { type: String, default: 'her' },
  animated: { type: Boolean, default: true }
})

const uid = useId()
const resolvedKind = computed(() => props.kind || weatherKind(props.code, props.text))

const rays = [
  { id: 0, d: 'M32 9v5' },
  { id: 1, d: 'M32 50v5' },
  { id: 2, d: 'M9 32h5' },
  { id: 3, d: 'M50 32h5' },
  { id: 4, d: 'M15.7 15.7l3.5 3.5' },
  { id: 5, d: 'M44.8 44.8l3.5 3.5' },
  { id: 6, d: 'M48.3 15.7l-3.5 3.5' },
  { id: 7, d: 'M19.2 44.8l-3.5 3.5' }
]
</script>

<style scoped>
.weather-icon {
  display: block;
  overflow: visible;
}
.tone-her {
  --icon-accent: #e98fb2;
}
.tone-me {
  --icon-accent: #8fb8de;
}
.animated .sun-rays {
  transform-origin: 32px 32px;
  animation: ray-turn 26s linear infinite;
}
.animated .cloud-body,
.animated .cloud-back {
  animation: cloud-float 7s ease-in-out infinite;
}
.animated .drop {
  animation: drop-fall 1.6s ease-in infinite;
}
.animated .drop-b {
  animation-delay: 0.45s;
}
.animated .drop-c {
  animation-delay: 0.9s;
}
.animated .flake {
  animation: flake-drift 3.4s ease-in-out infinite;
}
.animated .flake-b {
  animation-delay: 0.8s;
}
.animated .flake-c {
  animation-delay: 1.6s;
}
.animated .bolt {
  animation: bolt-flash 3.8s ease-in-out infinite;
}
.animated .stars circle {
  animation: twinkle 3s ease-in-out infinite;
}
.animated .stars circle:nth-child(2) {
  animation-delay: 0.8s;
}
.animated .stars circle:nth-child(3) {
  animation-delay: 1.5s;
}
.animated .heat {
  animation: heat-wave 3s ease-in-out infinite;
}

@keyframes ray-turn {
  to {
    transform: rotate(360deg);
  }
}
@keyframes cloud-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-1.6px);
  }
}
@keyframes drop-fall {
  0% {
    opacity: 0;
    transform: translateY(-3px);
  }
  30% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(5px);
  }
}
@keyframes flake-drift {
  0%,
  100% {
    opacity: 0.35;
    transform: translate(0, -2px);
  }
  50% {
    opacity: 1;
    transform: translate(2px, 3px);
  }
}
@keyframes bolt-flash {
  0%,
  86%,
  100% {
    opacity: 1;
  }
  88%,
  92% {
    opacity: 0.25;
  }
}
@keyframes twinkle {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}
@keyframes heat-wave {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animated .sun-rays,
  .animated .cloud-body,
  .animated .cloud-back,
  .animated .drop,
  .animated .flake,
  .animated .bolt,
  .animated .stars circle,
  .animated .heat {
    animation: none;
  }
}
</style>
