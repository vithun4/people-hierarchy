<template>
  <div class="legend bg-white shadow-lg rounded-lg p-4">
    <h2 class="legend-title text-2xl font-bold text-center mb-2">Legend</h2>
    <p class="subtitle">Zoom & drag to look at descendants.</p>
    <p class="subtitle">Click subordinates to display below</p>
    <div class="legend-items">
      <div v-for="(color, department) in departmentColors" :key="department"
        class="legend-item hover:bg-gray-100 transition duration-300 ease-in-out rounded-md">
        <div :class="['w-6 h-6 rounded-full flex-shrink-0', color]"></div>
        <span class="flex-grow min-w-0 ml-2">{{ department }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    departmentColors: {
      type: Object,
      required: true,
    },
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

.legend-title {
  position: sticky;
  top: 0;
  background-color: white;
  padding-top: 0.5rem;
  z-index: 1;
}

.legend-items {
  display: flex;
  flex-direction: column;
}

.legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  transition: background-color 0.3s;
  border-radius: 0.25rem;
  word-wrap: break-word;
}

.legend-item span {
  word-wrap: break-word;
  text-align: left;
}

.subtitle {
  font-size: 0.875rem;
  color: #555;
  text-align: center;
  margin-top: -0.25rem; /* Reduced margin */
  margin-bottom: 0.25rem; /* Reduced margin */
}
</style>
