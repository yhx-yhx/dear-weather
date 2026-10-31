<template>
  <section class="forecast-card">
    <div class="section-head">
      <div class="section-title">
        <span class="section-spark">✦</span>
        <span>未来几天</span>
        <span class="section-sub">{{ cityName }}</span>
      </div>
      <button v-if="days.length > 4" type="button" class="expand-btn" @click="expanded = !expanded">
        {{ expanded ? '收起' : `展开 ${days.length} 天` }}
      </button>
    </div>

    <div class="forecast-list">
      <div v-for="(day, index) in visibleDays" :key="day.fxDate" class="forecast-row">
        <div class="day-label">
          <b>{{ formatDayLabel(day.fxDate, index) }}</b>
          <span>{{ formatShortDate(day.fxDate) }}</span>
        </div>
        <WeatherIcon
          :code="day.iconDay"
          :text="day.textDay"
          :size="26"
          tone="her"
          :animated="false"
        />
        <span class="day-text">{{ day.textDay }}</span>
        <div class="temp-bar">
          <div class="bar-track">
            <span
              class="bar-fill"
              :style="{ left: `${barLeft(day)}%`, width: `${barWidth(day)}%` }"
            ></span>
          </div>
          <div class="temp-labels">
            <span>{{ Math.round(num(day.tempMin)) }}°</span>
            <span>{{ Math.round(num(day.tempMax)) }}°</span>
          </div>
        </div>
        <span class="day-pop">{{ num(day.precip) > 0 ? '雨' : '' }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import WeatherIcon from './WeatherIcon.vue'
import {
  cityTitle,
  formatDayLabel,
  formatShortDate,
  num
} from '../lib/format'

const props = defineProps({
  bundle: { type: Object, default: null },
  city: { type: Object, default: null }
})

const expanded = ref(false)
const days = computed(() => (props.bundle && props.bundle.daily) || [])
const visibleDays = computed(() => (expanded.value ? days.value : days.value.slice(0, 4)))
const cityName = computed(() => cityTitle(props.city) || '她的城市')

const bounds = computed(() => {
  const list = days.value
  if (!list.length) return { min: 0, max: 1 }
  const mins = list.map((day) => num(day.tempMin))
  const maxs = list.map((day) => num(day.tempMax))
  return {
    min: Math.min(...mins),
    max: Math.max(...maxs)
  }
})

function barLeft(day) {
  const { min, max } = bounds.value
  const span = Math.max(1, max - min)
  return ((num(day.tempMin) - min) / span) * 100
}

function barWidth(day) {
  const { min, max } = bounds.value
  const span = Math.max(1, max - min)
  return Math.max(8, ((num(day.tempMax) - num(day.tempMin)) / span) * 100)
}
</script>

<style scoped>
.forecast-card {
  margin-top: 12px;
  padding: 15px 16px 10px;
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.92);
  background: linear-gradient(158deg, rgba(255, 255, 255, 0.74), rgba(250, 247, 253, 0.54));
  box-shadow: 0 14px 32px -28px rgba(79, 67, 88, 0.4);
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
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
}
.expand-btn {
  font-size: 10px;
  font-weight: 600;
  color: #b26791;
  letter-spacing: 0.3px;
}
.forecast-list {
  display: flex;
  flex-direction: column;
}
.forecast-row {
  display: grid;
  grid-template-columns: 52px 26px 1fr 92px 16px;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px dashed rgba(139, 124, 150, 0.12);
}
.forecast-row:first-child {
  border-top: 0;
}
.day-label {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.day-label b {
  font-size: 11px;
  font-weight: 700;
  color: #5b4c63;
}
.day-label span {
  font-size: 9px;
  color: #b3a2bd;
  font-variant-numeric: tabular-nums;
}
.day-text {
  font-size: 10.5px;
  color: #8b7c96;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.temp-bar {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.bar-track {
  position: relative;
  height: 4px;
  border-radius: 999px;
  background: rgba(139, 124, 150, 0.1);
  overflow: hidden;
}
.bar-fill {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #a9cbe8, #e9a3c0);
}
.temp-labels {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #9b8aa5;
  font-variant-numeric: tabular-nums;
}
.day-pop {
  font-size: 9px;
  color: #8fb0cd;
  text-align: center;
}
</style>
