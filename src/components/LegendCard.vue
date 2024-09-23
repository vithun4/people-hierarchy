<template>
  <div class="legend">
    <h2 class="text-xl font-bold">Legend</h2>
    <p class="subtitle">Zoom & drag to look at descendants.</p>
    <p class="subtitle">Click subordinates to display below</p>
    <div class="legend-items">
      <div v-for="(color, department) in departmentColors" :key="department" class="legend-item">
        <div :class="['w-6 h-6 rounded-full', color]"></div>
        <span>{{ department }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    departmentColors: Object,
  },
};
</script>

<style scoped>
.legend {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.8);
  padding: 0.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
  width: 300px;
  max-height: 300px;
  overflow-y: auto;
}

.legend h2 {
  text-align: center;
}

.legend .legend-items {
  display: flex;
  flex-direction: column;
}

.legend .legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.subtitle {
  font-size: 0.875rem;
  color: #555;
  text-align: center;
}
.subtitle+.subtitle {
  margin-top: -0.25rem;
  margin-bottom: 0.5rem;
  /* Adjust this value to control the spacing */
}
</style>