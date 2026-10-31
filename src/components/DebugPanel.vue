<template>
  <div class="debug-panel">
    <span class="debug-label">DEBUG</span>
    <button
      v-for="item in scenes"
      :key="item.key"
      type="button"
      :class="{ active: scene === item.key }"
      @click="$emit('set', item.key)"
    >
      {{ item.label }}
    </button>
    <button type="button" :class="{ active: !scene }" @click="$emit('set', '')">真实</button>
  </div>
</template>

<script setup>
defineProps({
  scene: { type: String, default: '' }
})

defineEmits(['set'])

const scenes = [
  { key: 'rain', label: '雨' },
  { key: 'cold', label: '冷' },
  { key: 'hot', label: '热' },
  { key: 'gap', label: '温差' },
  { key: 'clear', label: '晴' },
  { key: 'warning', label: '预警' },
  { key: 'aqi', label: '空气' }
]
</script>

<style scoped>
.debug-panel {
  position: fixed;
  left: 10px;
  bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  z-index: 80;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 180px;
  padding: 6px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.98);
  box-shadow: 0 10px 24px -16px rgba(79, 67, 88, 0.5);
  backdrop-filter: blur(8px);
}
.debug-label {
  width: 100%;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #b3a2bd;
  padding-left: 3px;
}
.debug-panel button {
  padding: 3px 6px;
  border-radius: 6px;
  font-size: 8.5px;
  font-weight: 600;
  color: #8b7c96;
  background: rgba(245, 241, 249, 0.8);
}
.debug-panel button.active {
  background: linear-gradient(135deg, #e9a3c0, #c9b2e8);
  color: #fff;
}
</style>
