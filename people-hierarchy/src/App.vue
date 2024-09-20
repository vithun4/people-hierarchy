<template>
  <div id="app" class="p-4">
    <h1 class="text-2xl font-bold text-center mb-6">People Hierarchy</h1>

    <!-- Simple layout for PersonNode components -->
    <div class="people-container">
      <div v-for="(person, index) in topLevelEmployees" :key="index" class="person-node">
        <PersonNode :person="person" :departmentColors="departmentColors" :loadSubordinatesCallback="fetchSubordinates"
          @incrementDisplayedDescendants="updateTotalDisplayedDescendants" />
      </div>
    </div>

    <div class="legend mb-6 text-center">
      <h2 class="text-xl font-bold">Legend</h2>
      <div class="flex justify-center space-x-4 mt-2">
        <div v-for="(color, department) in departmentColors" :key="department" class="flex items-center space-x-2">
          <div :class="['w-6 h-6 rounded-full', color]"></div>
          <span>{{ department }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Papa from 'papaparse';
import PersonNode from './components/PersonNode.vue';
import { hierarchy } from 'd3-hierarchy';

export default {
  name: 'App',
  components: {
    PersonNode
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
        'bg-gray-100 border-gray-500' // Fallback
      ],
      colorIndex: 0
    };
  },
  created() {
    this.loadCSV();
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
        row.Salary = parseFloat(row["Salary"].replace(/[$,]/g, '')) || 0; // Clean salary
        row.Manager = row["Manager"] ? parseInt(row["Manager"], 10) : -1; // Handle manager IDs
        row.EmployeeId = parseInt(row["Employee Id"], 10); // Ensure EmployeeId is a number
        row.subordinates = [];
        this.assignDepartmentColor(row["Department"]);
        return row;
      });

      this.allEmployees = cleanedData;

      // Organize subordinates under their managers
      const hierarchyMap = {};
      cleanedData.forEach(employee => {
        hierarchyMap[employee.EmployeeId] = employee;
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
        this.departmentColors[department] = color;
        this.colorIndex++;
      }
    }
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

.people-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin: 1rem;
}

.person-node {
  margin: 1rem;
  min-width: 200px;
  max-width: 300px;
  padding: 1rem;
  transition: all 0.3s ease-in-out;
}

.legend {
  margin-top: 2rem;
}
</style>
