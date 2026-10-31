<template>
  <div class="sky" :data-theme="theme" aria-hidden="true">
    <div class="sky-base"></div>
    <div class="glow glow-a"></div>
    <div class="glow glow-b"></div>

    <div v-if="showSun" class="sun"></div>
    <div v-if="theme === 'night'" class="moon"></div>

    <div class="cloud cloud-a"></div>
    <div class="cloud cloud-b"></div>

    <div v-if="theme === 'rain'" class="rain">
      <span v-for="drop in drops" :key="drop.id" :style="drop.style"></span>
    </div>
    <div v-if="theme === 'snow'" class="snow">
      <span v-for="flake in flakes" :key="flake.id" :style="flake.style"></span>
    </div>
    <div v-if="theme === 'night'" class="stars">
      <span v-for="star in stars" :key="star.id" :style="star.style"></span>
    </div>

    <div class="sky-grain"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  theme: { type: String, default: 'day' }
})

const showSun = computed(() => ['day', 'dawn', 'dusk'].includes(props.theme))

function seeded(seed) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

const random = seeded(7274)

const drops = Array.from({ length: 22 }).map((_, index) => {
  const left = random() * 100
  const delay = random() * 2.4
  const duration = 1.4 + random() * 1.2
  const height = 12 + random() * 18
  return {
    id: index,
    style: {
      left: `${left}%`,
      height: `${height}px`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`
    }
  }
})

const flakes = Array.from({ length: 20 }).map((_, index) => {
  const left = random() * 100
  const delay = random() * 4
  const duration = 6 + random() * 5
  const size = 2 + random() * 3
  return {
    id: index,
    style: {
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`
    }
  }
})

const stars = Array.from({ length: 26 }).map((_, index) => {
  const left = random() * 100
  const top = random() * 55
  const delay = random() * 4
  const size = 1 + random() * 1.8
  return {
    id: index,
    style: {
      left: `${left}%`,
      top: `${top}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDelay: `${delay}s`
    }
  }
})
</script>

<style scoped>
.sky {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.sky-base {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(520px 420px at 82% 6%, rgba(255, 232, 240, 0.72), rgba(255, 232, 240, 0) 68%),
    radial-gradient(560px 480px at 6% 42%, rgba(226, 235, 250, 0.8), rgba(226, 235, 250, 0) 72%),
    linear-gradient(166deg, #fbf8fd 0%, #f7f3fb 44%, #f2f6fc 100%);
  transition: background 1.2s ease;
}
.sky[data-theme='dawn'] .sky-base {
  background:
    radial-gradient(520px 420px at 78% 8%, rgba(255, 222, 214, 0.72), rgba(255, 222, 214, 0) 68%),
    radial-gradient(560px 480px at 8% 46%, rgba(231, 226, 250, 0.82), rgba(231, 226, 250, 0) 72%),
    linear-gradient(166deg, #fff8f5 0%, #fdf2f3 44%, #f4effb 100%);
}
.sky[data-theme='dusk'] .sky-base {
  background:
    radial-gradient(520px 420px at 82% 8%, rgba(255, 213, 196, 0.68), rgba(255, 213, 196, 0) 68%),
    radial-gradient(560px 480px at 8% 44%, rgba(232, 218, 246, 0.82), rgba(232, 218, 246, 0) 72%),
    linear-gradient(166deg, #fff9f4 0%, #fdf0ec 44%, #f2edfa 100%);
}
.sky[data-theme='rain'] .sky-base {
  background:
    radial-gradient(520px 420px at 80% 6%, rgba(216, 230, 244, 0.75), rgba(216, 230, 244, 0) 68%),
    radial-gradient(560px 480px at 8% 46%, rgba(224, 230, 242, 0.85), rgba(224, 230, 242, 0) 72%),
    linear-gradient(166deg, #f7f9fc 0%, #f0f4f9 44%, #eaf0f7 100%);
}
.sky[data-theme='snow'] .sky-base {
  background:
    radial-gradient(520px 420px at 82% 6%, rgba(232, 242, 252, 0.9), rgba(232, 242, 252, 0) 68%),
    radial-gradient(560px 480px at 8% 46%, rgba(238, 242, 250, 0.9), rgba(238, 242, 250, 0) 72%),
    linear-gradient(166deg, #fbfdff 0%, #f4f8fd 44%, #edf3fa 100%);
}
.sky[data-theme='night'] .sky-base {
  background:
    radial-gradient(520px 420px at 80% 8%, rgba(224, 228, 246, 0.82), rgba(224, 228, 246, 0) 68%),
    radial-gradient(560px 480px at 8% 46%, rgba(226, 226, 244, 0.85), rgba(226, 226, 244, 0) 72%),
    linear-gradient(166deg, #f7f7fd 0%, #f0f1fa 44%, #e9ecf7 100%);
}
.sky[data-theme='fog'] .sky-base {
  background:
    radial-gradient(520px 420px at 80% 6%, rgba(234, 232, 238, 0.8), rgba(234, 232, 238, 0) 68%),
    radial-gradient(560px 480px at 8% 46%, rgba(230, 230, 238, 0.85), rgba(230, 230, 238, 0) 72%),
    linear-gradient(166deg, #faf9fb 0%, #f4f3f6 44%, #eeeef4 100%);
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(18px);
  opacity: 0.7;
}
.glow-a {
  width: 260px;
  height: 260px;
  top: -80px;
  right: -60px;
  background: radial-gradient(circle, rgba(255, 214, 228, 0.7), rgba(255, 214, 228, 0) 70%);
}
.glow-b {
  width: 320px;
  height: 320px;
  left: -120px;
  top: 32%;
  background: radial-gradient(circle, rgba(208, 226, 248, 0.7), rgba(208, 226, 248, 0) 70%);
}

.sun {
  position: absolute;
  top: 54px;
  right: 34px;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 34%, #fff3cf, #f8d38a 62%, #f0b47c);
  box-shadow:
    0 0 0 12px rgba(248, 211, 138, 0.14),
    0 0 46px 18px rgba(248, 195, 124, 0.24);
  animation: sun-breathe 7s ease-in-out infinite;
}
.sky[data-theme='dawn'] .sun {
  top: 84px;
  right: 26px;
  opacity: 0.86;
}
.sky[data-theme='dusk'] .sun {
  top: 70px;
  right: 30px;
  background: radial-gradient(circle at 38% 34%, #ffe3c4, #f5b98c 62%, #e99b7c);
  opacity: 0.9;
}

.moon {
  position: absolute;
  top: 58px;
  right: 38px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #f8edc9;
  box-shadow:
    inset -15px -7px 0 0 rgba(243, 244, 251, 0.94),
    0 0 40px 10px rgba(248, 237, 201, 0.25);
}

.cloud {
  position: absolute;
  height: 46px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
  filter: blur(8px);
  opacity: 0.72;
}
.cloud-a {
  width: 180px;
  top: 118px;
  right: -60px;
  animation: cloud-drift 24s ease-in-out infinite;
}
.cloud-b {
  width: 230px;
  top: 300px;
  left: -110px;
  opacity: 0.48;
  animation: cloud-drift 32s ease-in-out infinite reverse;
}
.sky[data-theme='rain'] .cloud,
.sky[data-theme='fog'] .cloud {
  opacity: 0.42;
  filter: blur(12px);
}
.sky[data-theme='night'] .cloud {
  opacity: 0.32;
}

.rain {
  position: absolute;
  inset: 0;
  opacity: 0.5;
}
.rain span {
  position: absolute;
  top: -30px;
  width: 1px;
  border-radius: 2px;
  background: linear-gradient(180deg, rgba(150, 183, 215, 0), rgba(132, 168, 205, 0.7));
  animation-name: rain-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.snow {
  position: absolute;
  inset: 0;
  opacity: 0.8;
}
.snow span {
  position: absolute;
  top: -10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 4px rgba(190, 214, 238, 0.7);
  animation-name: snow-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.stars {
  position: absolute;
  inset: 0;
}
.stars span {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 5px rgba(246, 231, 184, 0.8);
  animation: twinkle 4s ease-in-out infinite;
}

.sky-grain {
  position: absolute;
  inset: 0;
  opacity: 0.24;
  background-image: radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1.2px);
  background-size: 8px 8px;
  mask-image: radial-gradient(600px 600px at 50% 24%, #000, transparent 74%);
  -webkit-mask-image: radial-gradient(600px 600px at 50% 24%, #000, transparent 74%);
}

@keyframes sun-breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.92;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}
@keyframes cloud-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(-14px, 8px, 0);
  }
}
@keyframes rain-fall {
  0% {
    transform: translate3d(0, -20px, 0);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-24px, 120vh, 0);
    opacity: 0;
  }
}
@keyframes snow-fall {
  0% {
    transform: translate3d(0, -10px, 0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translate3d(26px, 110vh, 0);
    opacity: 0;
  }
}
@keyframes twinkle {
  0%,
  100% {
    opacity: 0.28;
  }
  50% {
    opacity: 0.95;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sun,
  .cloud,
  .rain span,
  .snow span,
  .stars span {
    animation: none;
  }
}
</style>
