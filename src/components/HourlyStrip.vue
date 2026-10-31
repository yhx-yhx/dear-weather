<template>
  <section class="hourly-card">
    <div class="section-head">
      <div class="section-title">
        <span class="section-spark">✦</span>
        <span>未来 24 小时</span>
        <span class="section-sub">{{ cityName }}</span>
      </div>
      <span class="section-note">她的城市</span>
    </div>

    <div class="hourly-scroll">
      <div v-for="item in items" :key="item.key" class="hour-item" :class="{ now: item.now }">
        <span class="hour-time">{{ item.time }}</span>
        <WeatherIcon :kind="item.kind" :size="28" tone="her" :animated="false" />
        <span class="hour-temp">{{ item.temp }}°</span>
        <span class="hour-pop" :class="{ empty: !item.pop }">
          {{ item.pop ? `${item.pop}%` : '—' }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import WeatherIcon from './WeatherIcon.vue'
import { cityTitle, formatHour, num } from '../lib/format'
import { weatherKind } from '../lib/icons'

const props = defineProps({
  bundle: { type: Object, default: null },
  city: { type: Object, default: null }
})

const cityName = computed(() => cityTitle(props.city) || '她的城市')

const items = computed(() => {
  if (!props.bundle) return []
  const now = props.bundle.now || {}
  const hourly = props.bundle.hourly || []
  const list = [
    {
      key: 'now',
      now: true,
      time: '现在',
      kind: weatherKind(now.icon, now.text),
      temp: Math.round(num(now.temp)),
      pop: Math.round(num(hourly[0] && hourly[0].pop))
    }
  ]
  hourly.slice(0, 23).forEach((hour, index) => {
    list.push({
      key: `${hour.fxTime}-${index}`,
      now: false,
      time: formatHour(hour.fxTime),
      kind: weatherKind(hour.icon, hour.text),
      temp: Math.round(num(hour.temp)),
      pop: Math.round(num(hour.pop))
    })
  })
  return list
})
</script>

<style scoped>
.hourly-card {
  margin-top: 12px;
  padding: 15px 0 12px;
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.92);
  background: linear-gradient(158deg, rgba(255, 255, 255, 0.74), rgba(250, 247, 253, 0.54));
  box-shadow: 0 14px 32px -28px rgba(79, 67, 88, 0.4);
  overflow: hidden;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 10px;
}
.section-title {
  display: flex;
  align-items: baseline;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #7c6888;
}
.section-spark {
  color: #dc9cbd;
  font-size: 8px;
}
.section-sub {
  font-size: 10px;
  font-weight: 500;
  color: #b3a2bd;
  letter-spacing: 0.2px;
}
.section-note {
  font-size: 9.5px;
  color: #c1b2ca;
  letter-spacing: 0.3px;
}
.hourly-scroll {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 0 14px 4px;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.hourly-scroll::-webkit-scrollbar {
  display: none;
}
.hour-item {
  flex: none;
  width: 50px;
  padding: 8px 3px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  border-radius: 16px;
  scroll-snap-align: start;
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.66);
}
.hour-item.now {
  background: linear-gradient(160deg, rgba(255, 244, 249, 0.94), rgba(255, 252, 247, 0.8));
  border-color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 6px 16px -12px rgba(201, 106, 146, 0.5);
}
.hour-time {
  font-size: 9.5px;
  font-weight: 600;
  color: #9b8aa5;
  font-variant-numeric: tabular-nums;
}
.hour-item.now .hour-time {
  color: #c96a92;
}
.hour-temp {
  font-size: 13px;
  font-weight: 600;
  color: #5b4c63;
  font-variant-numeric: tabular-nums;
}
.hour-pop {
  font-size: 8.5px;
  font-weight: 600;
  color: #8fb0cd;
  font-variant-numeric: tabular-nums;
}
.hour-pop.empty {
  color: #d3c7da;
}
</style>
