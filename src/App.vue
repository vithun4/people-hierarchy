<template>
  <div id="app" class="p-4">
    <div class="header-container">
      <h1 class="text-3xl font-bold text-center my-6">People Hierarchy</h1>
      <button @click="toggleLegend"
        class="legend-toggle font-semibold text-sm px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ease-in-out hover:bg-gray-200">
        {{ isLegendVisible ? 'Hide Legend ▲' : 'Show Legend ▼' }}
      </button>
    </div>

    <div class="people-container p-4" ref="peopleContainer">
      <div v-for="(person, index) in topLevelEmployees" :key="index" class="person-node">
        <PersonNode :person="person" :level="1" :departmentColors="departmentColors"
          :loadSubordinatesCallback="fetchSubordinates"
          @incrementDisplayedDescendants="incrementDisplayedDescendants" />
      </div>
    </div>

    <LegendCard v-if="isLegendVisible" :departmentColors="departmentColors" />
  </div>
</template>

<script>
import Papa from 'papaparse';
import PersonNode from './components/PersonNode.vue';
import LegendCard from './components/LegendCard.vue';
import { hierarchy } from 'd3-hierarchy';

export default {
  name: 'App',
  components: {
    PersonNode,
    LegendCard
  },
  data() {
    return {
      allEmployees: [],
      topLevelEmployees: [],
      loading: true,
      departmentColors: {
        'Unknown Department': 'bg-gray-100 border-gray-500'
      },
      defaultColors: [
        'bg-green-100 border-green-500', 'bg-blue-100 border-blue-500',
        'bg-yellow-100 border-yellow-500', 'bg-red-100 border-red-500',
        'bg-purple-100 border-purple-500', 'bg-pink-100 border-pink-500',
        'bg-teal-100 border-teal-500', 'bg-indigo-100 border-indigo-500',
        'bg-orange-100 border-orange-500', 'bg-lime-100 border-lime-500',
        'bg-cyan-100 border-cyan-500', 'bg-fuchsia-100 border-fuchsia-500',
        'bg-amber-100 border-amber-500', 'bg-violet-100 border-violet-500',
        'bg-rose-100 border-rose-500', 'bg-gray-100 border-gray-500'
      ],
      colorIndex: 0,
      scale: 1,
      translateX: 0,
      translateY: 0,
      isDragging: false,
      startX: 0,
      startY: 0,
      displayedDescendants: 0,
      isLegendVisible: true
    };
  },
  created() {
    this.loadCSV();
  },
  mounted() {
    this.initZoomAndDrag();
  },
  methods: {
    loadCSV() {
      Papa.parse('/peopleData.csv', {
        download: true,
        header: true,
        complete: this.processData,
        error: (err) => console.error('Error loading CSV:', err)
      });
    },
    processData(result) {
      const cleanedData = result.data.map(row => {
        row.Salary = parseFloat(row.Salary?.replace(/[$,]/g, '')) || 0;
        row.Manager = row.Manager ? parseInt(row.Manager, 10) : -1;
        row.EmployeeId = parseInt(row["Employee Id"], 10) || 0;
        row.Department = row.Department || 'Unknown Department';
        row.subordinates = [];
        this.assignDepartmentColor(row.Department);
        return row;
      });

      this.allEmployees = cleanedData;
      this.buildHierarchy(cleanedData);
    },
    buildHierarchy(data) {
      const hierarchyMap = {};
      data.forEach(employee => {
        hierarchyMap[employee.EmployeeId] = employee;
        if (employee.EmployeeId === employee.Manager || this.detectCycle(employee, hierarchyMap)) {
          console.warn(`Invalid hierarchy for employee ${employee.EmployeeId}`);
          return;
        }
        if (employee.Manager !== -1 && hierarchyMap[employee.Manager]) {
          hierarchyMap[employee.Manager].subordinates.push(employee);
        }
      });
      this.topLevelEmployees = data.filter(employee => employee.Manager === -1);
      this.setupD3Hierarchy();
      this.loading = false;
    },
    detectCycle(employee, hierarchyMap) {
      let currentManagerId = employee.Manager;
      const path = new Set();
      while (currentManagerId !== -1) {
        if (path.has(currentManagerId)) return true;
        path.add(currentManagerId);
        currentManagerId = hierarchyMap[currentManagerId]?.Manager || -1;
      }
      return false;
    },
    setupD3Hierarchy() {
      this.topLevelEmployees.forEach(topEmployee => {
        const root = hierarchy(topEmployee, d => d.subordinates);
        root.each(node => {
          node.sum(d => d.Salary);
          node.data.totalCost = node.value;
          node.data.managementCost = this.calculateManagementCostD3(node);
          node.data.icCost = this.calculateIcCostD3(node);
          node.data.descendantCount = node.descendants().length - 1;
        });
      });
    },
    fetchSubordinates(managerId, callback) {
      const subordinates = this.allEmployees.filter(employee => employee.Manager === managerId);
      callback(subordinates);
    },
    calculateManagementCostD3(node) {
      return node.descendants()
        .filter(d => d.children && d.children.length > 0)
        .reduce((sum, d) => sum + d.data.Salary, 0);
    },
    calculateIcCostD3(node) {
      return node.descendants()
        .filter(d => !d.children || d.children.length === 0)
        .reduce((sum, d) => sum + d.data.Salary, 0);
    },
    assignDepartmentColor(department) {
      if (!this.departmentColors[department]) {
        const color = this.defaultColors[this.colorIndex % this.defaultColors.length];
        this.colorIndex++;
        this.departmentColors = { [department]: color, ...this.departmentColors };
      }
    },
    initZoomAndDrag() {
      const container = this.$refs.peopleContainer;
      container.addEventListener('wheel', this.handleZoom);
      container.addEventListener('mousedown', this.startDrag);
      container.addEventListener('mousemove', this.handleDrag);
      container.addEventListener('mouseup', this.endDrag);
      container.addEventListener('mouseleave', this.endDrag);
      container.addEventListener('touchstart', this.startTouch);
      container.addEventListener('touchmove', this.handleTouchMove);
      container.addEventListener('touchend', this.endTouch);
    },
    startTouch(event) {
      if (event.touches.length === 2) {
        this.isPinching = true;
        this.initialPinchDistance = this.getPinchDistance(event);
        this.initialScale = this.scale;
      } else if (event.touches.length === 1) {
        this.startTouchDrag(event);
      }
    },
    startTouchDrag(event) {
      this.isDragging = true;
      const touch = event.touches[0];
      this.startX = touch.clientX - this.translateX;
      this.startY = touch.clientY - this.translateY;
    },
    handleTouchMove(event) {
      if (this.isPinching && event.touches.length === 2) {
        const pinchDistance = this.getPinchDistance(event);
        const scaleChange = pinchDistance / this.initialPinchDistance;
        this.scale = Math.min(Math.max(this.initialScale * scaleChange, 0.2), 3);
        this.applyTransform();
      } else if (event.touches.length === 1) {
        this.handleTouchDrag(event);
      }
    },
    handleTouchDrag(event) {
      if (!this.isDragging) return;
      const touch = event.touches[0];
      this.translateX = touch.clientX - this.startX;
      this.translateY = touch.clientY - this.startY;
      this.applyTransform();
    },
    endTouch() {
      this.isPinching = false;
      this.isDragging = false;
    },
    getPinchDistance(event) {
      const [touch1, touch2] = event.touches;
      const deltaX = touch1.clientX - touch2.clientX;
      const deltaY = touch1.clientY - touch2.clientY;
      return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    },
    handleZoom(event) {
      event.preventDefault();
      const scaleChange = event.deltaY < 0 ? 0.1 : -0.1;
      this.scale = Math.min(Math.max(this.scale + scaleChange, 0.2), 3);
      this.applyTransform();
    },
    startDrag(event) {
      this.isDragging = true;
      this.startX = event.clientX - this.translateX;
      this.startY = event.clientY - this.translateY;
    },
    handleDrag(event) {
      if (!this.isDragging) return;
      this.translateX = event.clientX - this.startX;
      this.translateY = event.clientY - this.startY;
      this.applyTransform();
    },
    endDrag() {
      this.isDragging = false;
    },
    applyTransform() {
      this.$refs.peopleContainer.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    },
    incrementDisplayedDescendants(count) {
      this.displayedDescendants += count;
    },
    toggleLegend() {
      this.isLegendVisible = !this.isLegendVisible;
    }
  }
};
</script>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  overflow: hidden;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  z-index: 10;
}

.legend-toggle {
  background-color: #f3f3f3;
  border: 1px solid #ccc;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

.people-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin: 1rem;
  cursor: grab;
  flex-grow: 1;
  position: relative;
  touch-action: none;
}

.people-container:active {
  cursor: grabbing;
}

.person-node {
  margin: 1rem;
  min-width: 200px;
  max-width: 300px;
  padding: 1rem;
  transition: all 0.3s ease-in-out;
}

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

h1 {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 0;
  margin: 0;
  z-index: 1;
}
</style>
