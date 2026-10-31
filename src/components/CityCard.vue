<template>
  <article class="city-card" :class="[role, { loading: !bundle }]">
    <div class="card-head">
      <div class="who">
        <span class="who-dot"></span>
        <span class="who-name">{{ personName }}</span>
        <span class="who-sep">·</span>
        <span class="who-city">{{ cityTitle(city) || '还没选城市' }}</span>
      </div>
      <span class="local-time">{{ localClock }}</span>
    </div>

    <template v-if="bundle">
      <div class="card-main">
        <div class="temp-block">
          <span class="temp">{{ temp }}</span>
          <span class="degree">°</span>
        </div>
        <div class="weather-block">
          <span class="weather-text">{{ now.text || '天气' }}</span>
          <span class="feels">体感 {{ feels }}℃</span>
          <span class="range">{{ min }}° <span class="slash">/</span> {{ max }}°</span>
        </div>
        <div class="icon-wrap">
          <WeatherIcon
            :code="now.icon"
            :text="now.text"
            :size="role === 'her' ? 96 : 76"
            :tone="role"
            :animated="motion"
          />
        </div>
      </div>

      <div class="chips">
        <span class="chip">
          <span class="chip-label">风</span>
          {{ now.windScale || '—' }} 级
        </span>
        <span class="chip">
          <span class="chip-label">湿度</span>
          {{ now.humidity || '—' }}%
        </span>
        <span v-if="pop > 0" class="chip">
          <span class="chip-label">降水</span>
          {{ pop }}%
        </span>
        <span v-if="role === 'her' && bundle.air" class="chip" :class="`tone-${aqiTone(bundle.air.aqi)}`">
          <span class="chip-label">AQI</span>
          {{ bundle.air.aqi }} {{ aqiLabel(bundle.air.aqi) }}
        </span>
        <span v-if="role === 'her' && uvText" class="chip">
          <span class="chip-label">紫外线</span>
          {{ uvText }}
        </span>
      </div>

      <div class="card-foot">
        <span class="foot-place">{{ role === 'her' ? `${personName}那边` : '你这边' }} {{ localClock }}</span>
        <span v-if="diffTz" class="foot-tz">异地时区</span>
        <span v-else class="foot-tz">{{ weekday }}</span>
      </div>
    </template>

    <template v-else>
      <div class="skeleton-main">
        <div class="skeleton temp-skeleton"></div>
        <div class="skeleton text-skeleton"></div>
      </div>
      <div class="skeleton chip-skeleton"></div>
    </template>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import WeatherIcon from './WeatherIcon.vue'
import {
  aqiLabel,
  aqiTone,
  cityTitle,
  clockIn,
  num,
  weekdayCN
} from '../lib/format'

const props = defineProps({
  role: { type: String, default: 'her' },
  personName: { type: String, default: '她' },
  city: { type: Object, default: null },
  bundle: { type: Object, default: null },
  motion: { type: Boolean, default: true }
})

const now = computed(() => (props.bundle && props.bundle.now) || {})
const today = computed(() => (props.bundle && props.bundle.daily && props.bundle.daily[0]) || {})
const temp = computed(() => Math.round(num(now.value.temp)))
const feels = computed(() => Math.round(num(now.value.feelsLike, num(now.value.temp))))
const min = computed(() => Math.round(num(today.value.tempMin)))
const max = computed(() => Math.round(num(today.value.tempMax)))
const localClock = computed(() => clockIn(props.city && props.city.tz))
const weekday = computed(() => weekdayCN(new Date(), props.city && props.city.tz))
const diffTz = computed(() => {
  if (!props.city || !props.city.tz) return false
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone !== props.city.tz
  } catch (e) {
    return false
  }
})

const pop = computed(() => {
  const hourly = (props.bundle && props.bundle.hourly) || []
  return Math.max(0, ...hourly.slice(0, 8).map((hour) => num(hour.pop)))
})

const uvText = computed(() => {
  const value = num(today.value.uvIndex, -1)
  if (value < 0) return ''
  if (value <= 2) return '弱'
  if (value <= 5) return '中等'
  if (value <= 7) return '较强'
  return '很强'
})
</script>

<style scoped>
.city-card {
  position: relative;
  overflow: hidden;
  margin-top: 14px;
  padding: 18px 19px 14px;
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow:
    0 18px 40px -26px rgba(79, 67, 88, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.45);
  background: linear-gradient(158deg, rgba(255, 255, 255, 0.82), rgba(255, 248, 252, 0.6));
  animation: card-in 0.65s cubic-bezier(0.22, 0.9, 0.28, 1) both;
}
.city-card.her {
  background:
    radial-gradient(260px 180px at 92% 0%, rgba(255, 214, 230, 0.6), rgba(255, 214, 230, 0) 70%),
    linear-gradient(158deg, rgba(255, 255, 255, 0.86), rgba(255, 246, 250, 0.66));
}
.city-card.me {
  background:
    radial-gradient(240px 160px at 92% 0%, rgba(214, 232, 249, 0.6), rgba(214, 232, 249, 0) 70%),
    linear-gradient(158deg, rgba(255, 255, 255, 0.82), rgba(247, 251, 255, 0.64));
  padding-top: 15px;
  padding-bottom: 12px;
}
.city-card::after {
  content: '';
  position: absolute;
  right: -30px;
  top: -40px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0) 70%);
  pointer-events: none;
}

.card-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.who {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.who-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e98fb2;
  box-shadow: 0 0 0 4px rgba(233, 143, 178, 0.14);
  transform: translateY(-1px);
  flex: none;
}
.me .who-dot {
  background: #8fb8de;
  box-shadow: 0 0 0 4px rgba(143, 184, 222, 0.14);
}
.who-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #4f4358;
}
.who-sep {
  color: #c9b9d2;
  font-size: 12px;
}
.who-city {
  font-size: 12px;
  font-weight: 500;
  color: #8b7c96;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.local-time {
  flex: none;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  color: #a896b2;
  font-variant-numeric: tabular-nums;
}

.card-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-top: 8px;
  min-height: 86px;
}
.temp-block {
  display: flex;
  align-items: flex-start;
  line-height: 1;
  flex: none;
}
.temp {
  font-size: 76px;
  font-weight: 200;
  letter-spacing: -4px;
  color: #4a3f54;
  font-variant-numeric: tabular-nums;
}
.me .temp {
  font-size: 58px;
  letter-spacing: -3px;
}
.degree {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 300;
  color: #8b7c96;
}
.me .degree {
  margin-top: 6px;
  font-size: 21px;
}
.weather-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-bottom: 8px;
  min-width: 0;
}
.weather-text {
  font-size: 16px;
  font-weight: 600;
  color: #5b4c63;
  letter-spacing: 0.6px;
}
.me .weather-text {
  font-size: 14px;
}
.feels {
  font-size: 11.5px;
  color: #9b8aa5;
  letter-spacing: 0.2px;
}
.range {
  font-size: 11.5px;
  font-weight: 600;
  color: #8b7c96;
  font-variant-numeric: tabular-nums;
}
.slash {
  color: #cbbcd4;
  margin: 0 1px;
}
.icon-wrap {
  position: absolute;
  right: -4px;
  top: -8px;
  filter: drop-shadow(0 8px 16px rgba(120, 100, 140, 0.12));
}
.me .icon-wrap {
  right: 0;
  top: -2px;
}

.chips {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(255, 255, 255, 0.9);
  font-size: 10.5px;
  font-weight: 600;
  color: #6d5c77;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.chip-label {
  font-weight: 500;
  color: #a896b2;
}
.chip.tone-good {
  color: #4f8a6a;
}
.chip.tone-ok {
  color: #7b8a4f;
}
.chip.tone-warn {
  color: #b07a3f;
}
.chip.tone-bad {
  color: #b25f6f;
}

.card-foot {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px dashed rgba(139, 124, 150, 0.16);
  font-size: 10px;
  color: #ad9cb7;
  letter-spacing: 0.3px;
}
.foot-place {
  font-variant-numeric: tabular-nums;
}
.foot-tz {
  color: #c1b2ca;
}

.skeleton {
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.5));
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
.skeleton-main {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-top: 18px;
}
.temp-skeleton {
  width: 120px;
  height: 62px;
}
.text-skeleton {
  width: 90px;
  height: 34px;
  margin-bottom: 6px;
}
.chip-skeleton {
  width: 70%;
  height: 24px;
  margin-top: 16px;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .city-card {
    animation: none;
  }
  .skeleton {
    animation: none;
  }
}
</style>
