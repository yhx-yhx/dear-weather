<template>
  <Transition name="toast">
    <div v-if="message" class="toast" role="status" aria-live="polite">
      {{ message }}
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  message: { type: String, default: '' }
})
</script>

<style scoped>
.toast {
  position: fixed;
  left: 50%;
  bottom: calc(26px + env(safe-area-inset-bottom, 0px));
  z-index: 90;
  max-width: min(86vw, 360px);
  transform: translateX(-50%);
  padding: 9px 15px;
  border-radius: 999px;
  background: rgba(79, 67, 88, 0.88);
  color: #fff;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.2px;
  text-align: center;
  box-shadow: 0 12px 28px -14px rgba(79, 67, 88, 0.6);
  backdrop-filter: blur(10px);
  pointer-events: none;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
