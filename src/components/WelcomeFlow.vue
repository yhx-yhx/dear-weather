<template>
  <div class="welcome">
    <div class="welcome-inner">
      <div class="welcome-brand">
        <BrandMark />
      </div>
      <span class="welcome-eyebrow">两 座 城 市</span>
      <h1 class="welcome-title">Dear Weather</h1>
      <p class="welcome-lede">
        先告诉我，你在哪，对方在哪。
        <br />
        以后每天先看对方那边。
      </p>

      <div v-if="!keyReady" class="key-warning">
        还没有配置和风天气 key。搜索会失败，先看看 README 里的环境变量说明。
      </div>

      <section class="step">
        <span class="step-num">01</span>
        <div class="step-head">
          <h2>你在哪？</h2>
          <span>用来对比两地温差</span>
        </div>
        <CityPicker
          v-model="meCity"
          placeholder="搜索你的城市…"
          :settings="settings"
        />
      </section>

      <section class="step">
        <span class="step-num">02</span>
        <div class="step-head">
          <h2>对方在哪？</h2>
          <span>每天先看对方那边</span>
        </div>
        <CityPicker
          v-model="herCity"
          placeholder="搜索对方城市…"
          :settings="settings"
        />
      </section>

      <button type="button" class="start-btn" :disabled="!meCity || !herCity" @click="start">
        <span v-if="meCity && herCity">开始看天气</span>
        <span v-else>选好两个城市就可以开始</span>
      </button>

      <p class="privacy">
        城市只保存在这台设备上，不会上传。
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import BrandMark from './BrandMark.vue'
import CityPicker from './CityPicker.vue'
import { hasApiKey } from '../lib/qweather'

const props = defineProps({
  settings: { type: Object, required: true }
})

const emit = defineEmits(['done'])

const meCity = ref(props.settings.me && props.settings.me.city ? props.settings.me.city : null)
const herCity = ref(props.settings.her && props.settings.her.city ? props.settings.her.city : null)
const keyReady = computed(() => hasApiKey(props.settings))

function start() {
  if (!meCity.value || !herCity.value) return
  emit('done', { me: meCity.value, her: herCity.value })
}
</script>

<style scoped>
.welcome {
  position: relative;
  width: 100%;
  max-width: 480px;
  min-height: 100dvh;
  margin: 0 auto;
  overflow: hidden;
  background: transparent;
}
.welcome-inner {
  position: relative;
  z-index: 2;
  padding: calc(28px + env(safe-area-inset-top, 0px)) 24px calc(24px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.welcome-brand {
  width: 58px;
  height: 58px;
  margin: 0 auto;
  filter: drop-shadow(0 10px 20px rgba(201, 106, 146, 0.2));
}
.welcome-eyebrow {
  margin-top: 16px;
  text-align: center;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 2.4px;
  color: #c08ca4;
}
.welcome-title {
  margin: 7px 0 0;
  text-align: center;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #4f4358;
}
.welcome-lede {
  margin: 10px 0 0;
  text-align: center;
  font-size: 12px;
  line-height: 1.8;
  color: #9b8aa5;
  letter-spacing: 0.3px;
}
.key-warning {
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 244, 235, 0.9);
  border: 1px solid rgba(240, 210, 180, 0.7);
  font-size: 10.5px;
  line-height: 1.6;
  color: #a8754b;
}
.step {
  position: relative;
  margin-top: 18px;
  padding: 16px 15px 14px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.96);
  background: linear-gradient(158deg, rgba(255, 255, 255, 0.78), rgba(255, 250, 253, 0.6));
  box-shadow:
    0 18px 40px -30px rgba(79, 67, 88, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}
.step-num {
  position: absolute;
  top: 15px;
  right: 16px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.4px;
  color: #d5c3dd;
}
.step-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}
.step-head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: #4f4358;
}
.step-head span {
  font-size: 9.5px;
  color: #b3a2bd;
  letter-spacing: 0.2px;
}
.start-btn {
  margin-top: 20px;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, #e9a3c0, #c9b2e8);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: 0 16px 30px -18px rgba(201, 106, 146, 0.75);
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.start-btn:active {
  transform: scale(0.985);
}
.start-btn:disabled {
  opacity: 0.45;
  box-shadow: none;
}
.privacy {
  margin: 14px 0 0;
  text-align: center;
  font-size: 9.5px;
  line-height: 1.7;
  color: #b9a9c2;
  letter-spacing: 0.2px;
}
</style>
