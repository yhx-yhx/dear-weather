<template>
  <section class="map-card">
    <div class="map-head">
      <span class="map-eyebrow">
        <span class="map-spark">✦</span>
        两座城市
      </span>
      <span class="map-distance">{{ distanceText }}</span>
    </div>

    <div ref="canvasEl" class="map-canvas" :style="{ height: `${height}px` }">
      <div class="map-placeholder"></div>

      <template v-if="ready && !failed">
        <img
          v-for="tile in tiles"
          :key="tile.key"
          class="map-tile"
          :src="tile.url"
          :style="tile.style"
          alt=""
          draggable="false"
          @error="onTileError"
        />
        <div class="map-tint"></div>

        <svg
          class="map-lines"
          :viewBox="`0 0 ${size.w} ${size.h}`"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            :d="layout.arc"
            fill="none"
            stroke="rgba(233, 143, 178, 0.62)"
            stroke-width="1.5"
            stroke-dasharray="4 6"
            stroke-linecap="round"
          />
          <circle v-if="motion" r="2.4" fill="#e98fb2" opacity="0.9">
            <animateMotion :dur="'7s'" repeatCount="indefinite" :path="layout.arc" />
          </circle>
        </svg>

        <div class="map-pin pin-me" :style="mePinStyle">
          <span class="pin-halo"></span>
          <span class="pin-core"></span>
          <span class="pin-tag">
            <b>{{ meTitle }}</b>
            <em v-if="hasTemps">{{ meTemp }}°</em>
          </span>
        </div>

        <div class="map-pin pin-her" :style="herPinStyle">
          <span class="pin-halo"></span>
          <span class="pin-core"></span>
          <span class="pin-tag">
            <b>{{ herTitle }}</b>
            <em v-if="hasTemps">{{ herTemp }}°</em>
          </span>
        </div>

        <div v-if="hasTemps" class="map-gap" :style="gapStyle">
          <span v-if="gap > 0">温差 {{ gap }}℃</span>
          <span v-else>同一座城市</span>
        </div>
      </template>

      <GapBridge
        v-else-if="ready"
        :me-city="meCity"
        :her-city="herCity"
        :me-bundle="meBundle"
        :her-bundle="herBundle"
        :distance="distance"
      />

      <span class="map-credit">© 天地图</span>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GapBridge from './GapBridge.vue'
import { tdtKey } from '../lib/qweather'
import { layoutMap } from '../lib/map'
import {
  cityTitle,
  distanceKm,
  formatDistance,
  num
} from '../lib/format'

const props = defineProps({
  meCity: { type: Object, default: null },
  herCity: { type: Object, default: null },
  meBundle: { type: Object, default: null },
  herBundle: { type: Object, default: null },
  motion: { type: Boolean, default: true }
})

const canvasEl = ref(null)
const size = ref({ w: 0, h: 0 })
const failed = ref(false)
const tileErrors = ref(0)
let observer = null

const key = tdtKey()

const ready = computed(
  () =>
    size.value.w > 0 &&
    props.meCity &&
    props.herCity &&
    Number.isFinite(Number(props.meCity.lat)) &&
    Number.isFinite(Number(props.herCity.lat))
)

const height = computed(() => {
  const w = size.value.w || 360
  return Math.max(176, Math.min(196, Math.round(w * 0.46)))
})

const distance = computed(() => distanceKm(props.meCity, props.herCity))
const distanceText = computed(() => formatDistance(distance.value))
const meTitle = computed(() => cityTitle(props.meCity) || '我')
const herTitle = computed(() => cityTitle(props.herCity) || '对方')
const hasTemps = computed(
  () => Boolean(props.meBundle && props.meBundle.now) && Boolean(props.herBundle && props.herBundle.now)
)
const meTemp = computed(() =>
  props.meBundle && props.meBundle.now ? Math.round(num(props.meBundle.now.temp)) : '—'
)
const herTemp = computed(() =>
  props.herBundle && props.herBundle.now ? Math.round(num(props.herBundle.now.temp)) : '—'
)
const gap = computed(() => {
  const a = Number(meTemp.value)
  const b = Number(herTemp.value)
  return Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) : 0
})

const layout = computed(() => {
  if (!ready.value) {
    return {
      tiles: [],
      mePoint: { x: 0, y: 0 },
      herPoint: { x: 0, y: 0 },
      mid: { x: 0, y: 0 },
      arc: ''
    }
  }
  return layoutMap(props.meCity, props.herCity, size.value.w, height.value, {
    key,
    padding: 50
  })
})

const tiles = computed(() => {
  if (!key) return []
  return layout.value.tiles || []
})

const mePinStyle = computed(() => ({
  left: `${layout.value.mePoint.x}px`,
  top: `${layout.value.mePoint.y}px`
}))
const herPinStyle = computed(() => ({
  left: `${layout.value.herPoint.x}px`,
  top: `${layout.value.herPoint.y}px`
}))
const gapStyle = computed(() => ({
  left: `${Math.min(size.value.w - 46, Math.max(46, layout.value.mid.x))}px`,
  top: `${Math.min(height.value - 24, Math.max(24, layout.value.mid.y))}px`
}))

function measure() {
  if (!canvasEl.value) return
  const width = canvasEl.value.clientWidth
  if (!width) return
  size.value = { w: width, h: height.value }
}

function onTileError() {
  tileErrors.value += 1
  if (tileErrors.value >= Math.max(4, Math.ceil(tiles.value.length * 0.4))) {
    failed.value = true
  }
}

function reset() {
  failed.value = false
  tileErrors.value = 0
  measure()
}

watch(() => [props.meCity && props.meCity.id, props.herCity && props.herCity.id], reset)
watch(
  () => [props.meCity && props.meCity.lat, props.herCity && props.herCity.lat],
  () => {
    if (!key) failed.value = true
  }
)

onMounted(() => {
  measure()
  if (!key) failed.value = true
  if (typeof ResizeObserver !== 'undefined' && canvasEl.value) {
    observer = new ResizeObserver(() => {
      const width = canvasEl.value ? canvasEl.value.clientWidth : 0
      if (width && width !== size.value.w) {
        size.value = { w: width, h: height.value }
      }
    })
    observer.observe(canvasEl.value)
  }
})

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
.map-card {
  position: relative;
  margin: 14px 0;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.95);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.78), rgba(250, 247, 253, 0.6));
  box-shadow: 0 16px 36px -28px rgba(79, 67, 88, 0.42);
  animation: map-in 0.7s cubic-bezier(0.22, 0.9, 0.28, 1) 0.08s both;
}
.map-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 9px;
}
.map-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #9a76a5;
}
.map-spark {
  color: #dc9cbd;
  font-size: 8px;
}
.map-distance {
  font-size: 10.5px;
  font-weight: 600;
  color: #8b7c96;
  letter-spacing: 0.3px;
  font-variant-numeric: tabular-nums;
}
.map-canvas {
  position: relative;
  overflow: hidden;
  background: #eef3f8;
  isolation: isolate;
}
.map-placeholder {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(220px 160px at 20% 70%, rgba(206, 226, 244, 0.9), rgba(206, 226, 244, 0) 70%),
    radial-gradient(220px 160px at 80% 30%, rgba(249, 218, 232, 0.9), rgba(249, 218, 232, 0) 70%),
    linear-gradient(150deg, #f8fbfe, #f1f4f9 55%, #faf4f7);
}
.map-tile {
  position: absolute;
  width: 256px;
  height: 256px;
  max-width: none;
  filter: saturate(0.16) contrast(0.94) brightness(1.05);
  user-select: none;
  pointer-events: none;
}
.map-tint {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(120% 90% at 50% 0%, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0) 62%),
    linear-gradient(180deg, rgba(252, 248, 253, 0.12), rgba(248, 246, 252, 0.16) 55%, rgba(255, 255, 255, 0.4));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.42),
    inset 0 -34px 70px rgba(255, 255, 255, 0.22);
}
.map-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.map-pin {
  position: absolute;
  z-index: 3;
  width: 0;
  height: 0;
  pointer-events: none;
}
.pin-halo {
  position: absolute;
  left: -13px;
  top: -13px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(143, 184, 222, 0.2);
  animation: halo 3.4s ease-out infinite;
}
.pin-her .pin-halo {
  background: rgba(233, 143, 178, 0.22);
}
.pin-core {
  position: absolute;
  left: -5px;
  top: -5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6f9ec7;
  border: 2px solid #fff;
  box-shadow: 0 1px 5px rgba(79, 67, 88, 0.28);
}
.pin-her .pin-core {
  background: #e98fb2;
}
.pin-tag {
  position: absolute;
  left: 10px;
  top: -8px;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 4px 7px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px -8px rgba(79, 67, 88, 0.4);
  backdrop-filter: blur(6px);
  white-space: nowrap;
}
.pin-her .pin-tag {
  left: auto;
  right: 10px;
}
.pin-tag b {
  font-size: 10px;
  font-weight: 700;
  color: #5b4c63;
}
.pin-tag em {
  font-style: normal;
  font-size: 10px;
  font-weight: 600;
  color: #8b7c96;
  font-variant-numeric: tabular-nums;
}
.map-gap {
  position: absolute;
  z-index: 3;
  transform: translate(-50%, -50%);
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.96);
  box-shadow: 0 5px 14px -8px rgba(79, 67, 88, 0.38);
  font-size: 9.5px;
  font-weight: 600;
  color: #9a6d83;
  letter-spacing: 0.3px;
  white-space: nowrap;
  backdrop-filter: blur(6px);
}
.map-credit {
  position: absolute;
  right: 8px;
  bottom: 6px;
  z-index: 4;
  font-size: 8px;
  letter-spacing: 0.3px;
  color: rgba(79, 67, 88, 0.5);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  pointer-events: none;
}

@keyframes halo {
  0% {
    transform: scale(0.6);
    opacity: 0.75;
  }
  70% {
    transform: scale(1.8);
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}
@keyframes map-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .map-card {
    animation: none;
  }
  .pin-halo {
    animation: none;
  }
}
</style>
