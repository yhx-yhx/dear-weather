<template>
  <article class="care-card" :class="[event.level, { soft: variant === 'soft' }]">
    <div class="care-icon">
      <WeatherIcon :kind="kind" :size="variant === 'soft' ? 30 : 38" tone="her" :animated="false" />
    </div>

    <div class="care-body">
      <span class="care-eyebrow">{{ label }}</span>
      <h3 class="care-title">{{ event.title }}</h3>
      <p v-if="variant !== 'soft' && event.detail" class="care-detail">{{ event.detail }}</p>
      <blockquote class="care-phrase">「{{ phrase }}」</blockquote>

      <div class="care-actions">
        <button type="button" class="care-action ghost" @click="$emit('cycle')">
          <span class="action-spark">✦</span>
          换一句
        </button>
        <button v-if="hasLetter" type="button" class="care-action letter" @click="$emit('letter')">
          拆信
        </button>
        <button type="button" class="care-action share" @click="$emit('share')">
          生成分享图
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import WeatherIcon from './WeatherIcon.vue'
import { sceneKind } from '../lib/icons'

const props = defineProps({
  event: { type: Object, required: true },
  phrase: { type: String, default: '' },
  hasLetter: { type: Boolean, default: false },
  variant: { type: String, default: 'primary' }
})

defineEmits(['cycle', 'share', 'letter'])

const kind = computed(() => sceneKind(props.event.scene))
const label = computed(() => {
  const map = {
    rain: '下雨了',
    snow: '下雪了',
    thunder: '打雷了',
    cold: '降温和冷',
    hot: '高温',
    wind: '大风',
    fog: '雾和霾',
    aqi: '空气',
    warning: '天气预警',
    gap: '两地温差',
    clear: '好天气',
    night: '深夜',
    daily: '每日一句'
  }
  return map[props.event.scene] || '今天'
})
</script>

<style scoped>
.care-card {
  position: relative;
  display: flex;
  gap: 13px;
  margin-top: 14px;
  padding: 17px 18px 15px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.96);
  background:
    radial-gradient(220px 160px at 96% 0%, rgba(255, 220, 234, 0.55), rgba(255, 220, 234, 0) 72%),
    linear-gradient(152deg, rgba(255, 255, 255, 0.88), rgba(255, 250, 252, 0.68));
  box-shadow:
    0 16px 36px -28px rgba(79, 67, 88, 0.42),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4);
  overflow: hidden;
  animation: care-in 0.7s cubic-bezier(0.22, 0.9, 0.28, 1) 0.12s both;
}
.care-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 18px;
  bottom: 18px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, #e9a3c0, #b9c9ee);
  opacity: 0.8;
}
.care-card.warning::before {
  background: linear-gradient(180deg, #e0a24a, #e98fb2);
}
.care-card.good::before {
  background: linear-gradient(180deg, #a9cbe8, #b7d8b0);
}
.care-card.soft {
  padding: 12px 14px 11px;
  background: linear-gradient(152deg, rgba(255, 255, 255, 0.76), rgba(250, 247, 253, 0.58));
}
.care-icon {
  flex: none;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 18px -14px rgba(201, 106, 146, 0.5);
}
.care-card.soft .care-icon {
  width: 38px;
  height: 38px;
  border-radius: 13px;
}
.care-body {
  flex: 1;
  min-width: 0;
}
.care-eyebrow {
  display: block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.4px;
  color: #c08ca4;
  text-transform: uppercase;
}
.care-title {
  margin: 4px 0 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #4f4358;
  line-height: 1.35;
}
.care-card.soft .care-title {
  font-size: 14px;
  font-weight: 600;
}
.care-detail {
  margin: 5px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: #8b7c96;
  letter-spacing: 0.15px;
}
.care-phrase {
  margin: 9px 0 0;
  font-family: 'Songti SC', 'Noto Serif SC', 'SimSun', serif;
  font-size: 13.5px;
  line-height: 1.65;
  color: #7a5f6d;
  letter-spacing: 0.3px;
}
.care-card.soft .care-phrase {
  margin-top: 5px;
  font-size: 12px;
}
.care-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 11px;
}
.care-action {
  padding: 6px 11px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.3px;
  border: 1px solid rgba(255, 255, 255, 0.95);
  background: rgba(255, 255, 255, 0.62);
  color: #8b7c96;
  transition: transform 0.2s ease, background 0.2s ease;
}
.care-action:active {
  transform: scale(0.96);
}
.care-action.ghost {
  color: #a06d86;
}
.care-action.letter {
  background: linear-gradient(135deg, #f7d7e4, #f3e3f8);
  color: #a85d7e;
}
.care-action.share {
  background: linear-gradient(135deg, #e9a3c0, #c9b2e8);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 8px 16px -10px rgba(201, 106, 146, 0.7);
}
.action-spark {
  font-size: 8px;
  color: #d99ab6;
  margin-right: 2px;
}

@keyframes care-in {
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
  .care-card {
    animation: none;
  }
}
</style>
