<template>
  <div class="gap-bridge" :class="{ compact }">
    <div class="bridge-glow bridge-glow-a"></div>
    <div class="bridge-glow bridge-glow-b"></div>

    <svg class="bridge-lines" viewBox="0 0 100 62" preserveAspectRatio="none" aria-hidden="true">
      <path d="M20 38 Q 50 20 80 38" fill="none" stroke="rgba(139,124,150,0.28)" stroke-width="0.6" stroke-dasharray="1.2 2.2" />
      <circle cx="20" cy="38" r="1.5" fill="#8fb8de" />
      <circle cx="80" cy="38" r="1.5" fill="#e98fb2" />
    </svg>

    <div class="bridge-pin pin-me">
      <span class="pin-dot"></span>
      <span class="pin-label">
        <b>{{ meTitle || '我' }}</b>
        <em v-if="meTemp !== null">{{ meTemp }}°</em>
      </span>
    </div>

    <div class="bridge-pin pin-her">
      <span class="pin-dot"></span>
      <span class="pin-label">
        <b>{{ herTitle || '对方' }}</b>
        <em v-if="herTemp !== null">{{ herTemp }}°</em>
      </span>
    </div>

    <div class="bridge-center">
      <span class="bridge-distance">{{ distanceText }}</span>
      <span v-if="gap !== null" class="bridge-gap">温差 {{ gap }}℃</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { cityTitle, formatDistance, num } from '../lib/format'

const props = defineProps({
  meCity: { type: Object, default: null },
  herCity: { type: Object, default: null },
  meBundle: { type: Object, default: null },
  herBundle: { type: Object, default: null },
  distance: { type: Number, default: 0 },
  compact: { type: Boolean, default: false }
})

const meTitle = computed(() => cityTitle(props.meCity))
const herTitle = computed(() => cityTitle(props.herCity))
const meTemp = computed(() =>
  props.meBundle && props.meBundle.now ? Math.round(num(props.meBundle.now.temp)) : null
)
const herTemp = computed(() =>
  props.herBundle && props.herBundle.now ? Math.round(num(props.herBundle.now.temp)) : null
)
const gap = computed(() =>
  meTemp.value !== null && herTemp.value !== null ? Math.abs(meTemp.value - herTemp.value) : null
)
const distanceText = computed(() => formatDistance(props.distance))
</script>

<style scoped>
.gap-bridge {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 168px;
  overflow: hidden;
  border-radius: inherit;
  background:
    radial-gradient(180px 120px at 18% 70%, rgba(214, 232, 249, 0.7), rgba(214, 232, 249, 0) 70%),
    radial-gradient(180px 120px at 82% 30%, rgba(255, 218, 232, 0.7), rgba(255, 218, 232, 0) 70%),
    linear-gradient(155deg, #fbfdff, #f7f3fb 52%, #fff7fa);
}
.gap-bridge.compact {
  min-height: 128px;
}
.bridge-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(16px);
}
.bridge-glow-a {
  width: 120px;
  height: 120px;
  left: 8%;
  bottom: 4%;
  background: rgba(143, 184, 222, 0.24);
}
.bridge-glow-b {
  width: 130px;
  height: 130px;
  right: 6%;
  top: 0;
  background: rgba(233, 143, 178, 0.22);
}
.bridge-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.bridge-pin {
  position: absolute;
  top: 61%;
  display: flex;
  align-items: center;
  gap: 6px;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}
.pin-me {
  left: 20%;
}
.pin-her {
  left: 80%;
}
.pin-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #8fb8de;
  border: 2px solid #fff;
  box-shadow: 0 0 0 4px rgba(143, 184, 222, 0.18);
  flex: none;
}
.pin-her .pin-dot {
  background: #e98fb2;
  box-shadow: 0 0 0 4px rgba(233, 143, 178, 0.18);
}
.pin-label {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 10px;
  color: #8b7c96;
  line-height: 1.2;
}
.pin-label b {
  font-size: 10.5px;
  font-weight: 700;
  color: #5b4c63;
}
.pin-label em {
  font-style: normal;
  font-weight: 600;
  color: #8b7c96;
  font-variant-numeric: tabular-nums;
}
.bridge-center {
  position: absolute;
  left: 50%;
  top: 39%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 20px -12px rgba(79, 67, 88, 0.35);
  backdrop-filter: blur(8px);
}
.bridge-distance {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #6d5c77;
  font-variant-numeric: tabular-nums;
}
.bridge-gap {
  font-size: 9.5px;
  color: #b08a9d;
  letter-spacing: 0.3px;
}
</style>
