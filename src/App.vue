<template>
  <div id="app" class="p-4">
    <div class="header-container">
      <h1 class="text-2xl font-bold text-center mb-6">People Hierarchy</h1>
      <!-- Toggle button for the legend -->
      <button @click="toggleLegend" class="legend-toggle font-semibold">
        {{ isLegendVisible ? 'Hide Legend ▲' : 'Show Legend ▼' }}
      </button>
    </div>

    <div class="people-container" ref="peopleContainer">
      <div v-for="(person, index) in topLevelEmployees" :key="index" class="person-node">
        <PersonNode :person="person" :departmentColors="departmentColors" :loadSubordinatesCallback="fetchSubordinates"
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
      allEmployees: [], // All employee data from the CSV
      topLevelEmployees: [], // Top-level employees (those without managers)
      loading: true, // Loading state for data fetching
      departmentColors: {
        'Unknown Department': 'bg-gray-100 border-gray-500' // Default color for unknown departments
      },
      defaultColors: [ // Default colors for departments
        'bg-green-100 border-green-500',
        'bg-blue-100 border-blue-500',
        'bg-yellow-100 border-yellow-500',
        'bg-red-100 border-red-500',
        'bg-purple-100 border-purple-500',
        'bg-pink-100 border-pink-500',
        'bg-teal-100 border-teal-500',
        'bg-indigo-100 border-indigo-500',
        'bg-orange-100 border-orange-500',
        'bg-lime-100 border-lime-500',
        'bg-cyan-100 border-cyan-500',
        'bg-fuchsia-100 border-fuchsia-500',
        'bg-amber-100 border-amber-500',
        'bg-violet-100 border-violet-500',
        'bg-rose-100 border-rose-500',
        'bg-gray-100 border-gray-500' // Fallback color
      ],
      colorIndex: 0, // Index to track the current color for departments
      scale: 1, // Zoom scale
      translateX: 0, // X-axis translation for dragging
      translateY: 0, // Y-axis translation for dragging
      isDragging: false, // Dragging state
      startX: 0, // Initial X position for dragging
      startY: 0, // Initial Y position for dragging
      displayedDescendants: 0, // Track the number of displayed descendants
      isLegendVisible: true // Track the visibility of the legend
    };
  },
  created() {
    this.loadCSV(); // Load CSV data when the component is created
  },
  mounted() {
    this.initZoomAndDrag(); // Initialize zoom and drag functionality when the component is mounted
  },
  methods: {
    loadCSV() {
      Papa.parse('/peopleData.csv', {
        download: true,
        header: true,
        complete: this.processData,
        error: (err) => {
          console.error('Error loading CSV:', err);
        }
      });
    },
    processData(result) {
      const cleanedData = result.data.map(row => {
        // Ensure salary is a valid number, default to 0 if missing or invalid
        row.Salary = parseFloat(row["Salary"]?.replace(/[$,]/g, '')) || 0;

        // Ensure Manager ID is a valid number, default to -1 if missing (indicating no manager)
        row.Manager = row["Manager"] ? parseInt(row["Manager"], 10) : -1;

        // Ensure EmployeeId is a number, throw an error or set default if invalid
        row.EmployeeId = parseInt(row["Employee Id"], 10) || 0;

        // Default to 'Unknown Department' if department is missing
        row.Department = row["Department"] || 'Unknown Department';

        // Initialize subordinates array
        row.subordinates = [];

        // Assign department color
        this.assignDepartmentColor(row["Department"]);

        return row;
      });

      this.allEmployees = cleanedData;

      // Track employees to validate no circular dependencies exist
      const hierarchyMap = {};

      cleanedData.forEach(employee => {
        hierarchyMap[employee.EmployeeId] = employee;

        // Check if employee is their own manager (circular reference)
        if (employee.EmployeeId === employee.Manager) {
          console.warn(`Circular reference detected: Employee ${employee.EmployeeId} is their own manager.`);
          return; // Skip this employee or handle differently
        }

        // Now validate no cyclic dependencies
        let currentManagerId = employee.Manager;
        const path = new Set(); // Track the path of managers to detect cycles

        while (currentManagerId !== -1) { // While there is a manager
          if (path.has(currentManagerId)) {
            console.warn(`Cyclic dependency detected for employee ${employee.EmployeeId}.`);
            return; // Handle or skip the employee
          }

          path.add(currentManagerId);

          // Move up the hierarchy to the next manager
          currentManagerId = hierarchyMap[currentManagerId]?.Manager || -1;
        }

        // Add subordinates only if no cycles were detected
        if (employee.Manager !== -1 && hierarchyMap[employee.Manager]) {
          hierarchyMap[employee.Manager].subordinates.push(employee);
        }
      });

      // Build a hierarchy using d3-hierarchy
      this.topLevelEmployees = cleanedData.filter(employee => employee.Manager === -1);
      this.topLevelEmployees.forEach(topLevelEmployee => {
        const root = hierarchy(topLevelEmployee, d => d.subordinates);

        root.each(node => {
          node.sum(d => d.Salary);
          node.data.totalCost = node.value;
          node.data.managementCost = this.calculateManagementCostD3(node);
          node.data.icCost = this.calculateIcCostD3(node);
          node.data.descendantCount = node.descendants().length - 1;
        });
      });

      this.loading = false; // Data load complete
    },

    fetchSubordinates(managerId, callback) {
      const subordinates = this.allEmployees.filter(employee => employee.Manager === managerId);
      callback(subordinates); // Pass the subordinates to the `PersonNode` component
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

        // Add the new department color to the front
        this.departmentColors = {
          [department]: color,
          ...this.departmentColors
        };
      }
    },
    initZoomAndDrag() {
      const container = this.$refs.peopleContainer;

      // Mouse Events
      container.addEventListener('wheel', this.handleZoom);
      container.addEventListener('mousedown', this.startDrag);
      container.addEventListener('mousemove', this.handleDrag);
      container.addEventListener('mouseup', this.endDrag);
      container.addEventListener('mouseleave', this.endDrag);

      // Touch Events for pinch-to-zoom and dragging
      container.addEventListener('touchstart', this.startTouch);
      container.addEventListener('touchmove', this.handleTouchMove);
      container.addEventListener('touchend', this.endTouch);
    },
    startTouch(event) {
      if (event.touches.length === 2) { // Two fingers for pinching
        this.isPinching = true;
        this.initialPinchDistance = this.getPinchDistance(event); // Calculate initial pinch distance
        this.initialScale = this.scale;
      } else if (event.touches.length === 1) {
        // Single finger for dragging
        this.startTouchDrag(event); // Call the drag function for single touch
      }
    },
    // Handle touch events
    startTouchDrag(event) {
      this.isDragging = true;
      const touch = event.touches[0];
      this.startX = touch.clientX - this.translateX;
      this.startY = touch.clientY - this.translateY;
    },
    handleTouchDrag(event) {
      if (!this.isDragging) return;
      const touch = event.touches[0];
      this.translateX = touch.clientX - this.startX;
      this.translateY = touch.clientY - this.startY;
      this.applyTransform();
    },
    endTouchDrag() {
      this.isDragging = false;
    },
    handleTouchMove(event) {
      if (this.isPinching && event.touches.length === 2) {
        const pinchDistance = this.getPinchDistance(event); // Calculate the new pinch distance
        const scaleChange = pinchDistance / this.initialPinchDistance; // Calculate how much to scale
        this.scale = Math.min(Math.max(this.initialScale * scaleChange, 0.2), 3); // Adjust scale with limits
        this.applyTransform(); // Apply the transformation to the container
      } else if (event.touches.length === 1) {
        // Handle normal drag when not pinching
        this.handleTouchDrag(event);
      }
    },
    endTouch() {
      this.isPinching = false;
      this.endTouchDrag();
    },
    getPinchDistance(event) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const deltaX = touch1.clientX - touch2.clientX;
      const deltaY = touch1.clientY - touch2.clientY;
      return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    },
    handleZoom(event) {
      event.preventDefault();
      const scaleAmount = 0.1;
      if (event.deltaY < 0) {
        this.scale += scaleAmount;
      } else {
        this.scale -= scaleAmount;
      }
      this.scale = Math.min(Math.max(0.2, this.scale), 3); // Allow more zooming out
      this.applyTransform();
    },
    startDrag(event) {
      this.isDragging = true;
      this.startX = event.clientX - this.translateX;
      this.startY = event.clientY - this.translateY;
      event.target.style.zIndex = 20; // Bring to front during drag
    },
    handleDrag(event) {
      if (!this.isDragging) return;
      this.translateX = event.clientX - this.startX;
      this.translateY = event.clientY - this.startY;
      this.applyTransform();
    },
    endDrag(event) {
      this.isDragging = false;
      event.target.style.zIndex = 5; // Reset z-index when drag ends
    },
    applyTransform() {
      const container = this.$refs.peopleContainer;
      container.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
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
  /* Prevent scrolling */
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
  position: relative;
}

.legend-toggle {
  background-color: #f3f3f3;
  border: 1px solid #ccc;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

.header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}

.toggle-legend-btn {
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.toggle-legend-btn:hover {
  background-color: #0056b3;
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
  z-index: 5;
  position: relative;
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
  /* Fixed width */
  max-height: 300px;
  /* Maximum height */
  overflow-y: auto;
  /* Scrollable vertically */
}

.legend h2 {
  text-align: center;
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 0;
  margin: 0;
  z-index: 1;
}

.legend .legend-items {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.legend .legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 0.5rem;
}

.legend .legend-item div {
  margin-right: 0.5rem;
  /* Space between color and title */
}

.legend .legend-item span {
  flex-grow: 1;
  text-align: right;
}

.subtitle {
  text-align: center;
  font-size: 0.875rem;
  color: #555;
  margin-top: 0.5rem;
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
