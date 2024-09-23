<template>
    <div class="flex flex-col items-center relative">
      <!-- Manager Node -->
      <div v-if="person"
           :class="[ 'relative flex flex-col items-center rounded-lg shadow-md p-4 text-center w-64 border', departmentColor ]">
        <!-- Avatar or Initials -->
        <div :class="['w-12 h-12 rounded-full text-white flex items-center justify-center text-xl font-bold mb-2', avatarColor]">
          {{ initials }}
        </div>
  
        <!-- Name and Role -->
        <p class="font-bold text-gray-700">{{ person["Name"] }}</p>
        <p class="text-sm text-gray-700">{{ person["Job Title"] || 'Role not specified' }}</p>
  
        <!-- Department -->
        <span class="bg-gray-200 border border-gray-400 text-gray-700 rounded-full px-3 py-1 text-xs font-medium mb-2">
          {{ person["Department"] || 'Unknown Department' }}
        </span>
  
        <!-- Location and Level -->
        <div class="flex flex-row items-center text-xs">
          <div :class="['flex items-center space-x-1 border rounded-full px-3 py-1 mr-1', pillColor]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <p>{{ person["Location"] || 'Location not specified' }}</p>
          </div>
          <div :class="['flex items-center space-x-1 border rounded-full px-3 py-1', pillColor]">
            <p>Level {{ level }}</p>
          </div>
        </div>
  
        <!-- Costs -->
        <div class="mt-2 space-y-1">
          <p :class="['rounded-full px-3 py-1 text-xs border', pillColor]">
            <strong>Management Cost:</strong> {{ formatCurrency(getManagementCost()) || 'N/A' }}
          </p>
          <p :class="['rounded-full px-3 py-1 text-xs border', pillColor]">
            <strong>IC Cost:</strong> {{ formatCurrency(getIcCost()) || 'N/A' }}
          </p>
          <p :class="['rounded-full px-3 py-1 text-xs border', pillColor]">
            <strong>Total Cost:</strong> {{ formatCurrency(getTotalCost()) || 'N/A' }}
          </p>
          <p :class="['rounded-full px-3 py-1 text-xs border', pillColor]">
            <strong>Management Cost Ratio:</strong> {{ getManagementCostRatio() || 'N/A' }}
          </p>
        </div>
  
        <!-- Descendants -->
        <button v-if="countDescendants() > 0" @click="toggleExpand" class="text-sm focus:outline-none">
          <div :class="[isExpanded ? 'bg-gray-50' : 'bg-gray-200', 'text-gray-700 rounded-full px-3 py-1 text-xs mt-3 border border-gray-400 hover:bg-gray-100']">
            {{ displayedDescendants }}/{{ countDescendants() }} Descendants {{ isExpanded ? '▲' : '▼' }}
          </div>
        </button>
        <div v-else class="text-sm text-gray-500 mt-3">
          No Descendants
        </div>
        <div v-if="isExpanded && subordinates.length > 0" class="line-connector"></div>
      </div>
  
      <!-- Line connecting parent and subordinates -->
      <div class="subordinate-top-line"></div>
  
      <!-- Subordinates -->
      <div v-if="isExpanded && subordinates.length > 0" class="flex flex-col items-center mt-4 p-4 border border-black border-t-4 border-0" style="border-top-width: 1.5px;">
        <div class="flex flex-row items-start space-x-4">
          <PersonNode
            v-for="subordinate in subordinates"
            :key="subordinate.EmployeeId"
            :person="subordinate"
            :departmentColors="departmentColors"
            :loadSubordinatesCallback="loadSubordinatesCallback"
            :level="level + 1"
            @incrementDisplayedDescendants="incrementDisplayedDescendants"
          />
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'PersonNode',
    props: {
      person: { type: Object, required: true },
      loadSubordinatesCallback: Function,
      departmentColors: { type: Object, required: true },
      level: { type: Number, required: true },
    },
    data() {
      return {
        isExpanded: false,
        subordinates: [],
        subordinatesLoaded: false,
        managementCostMemo: null,
        icCostMemo: null,
        totalCostMemo: null,
        descendantCountMemo: null,
        displayedDescendants: 0,
      };
    },
    computed: {
      initials() {
        return this.person.Name ? this.person.Name.split(' ').map(n => n[0]).join('') : '';
      },
      departmentColor() {
        const department = this.person.Department || 'Unknown Department';
        return this.departmentColors[department] || 'bg-gray-50 border-gray-500';
      },
      pillColor() {
        return this.getAdjustedColor(this.departmentColor, 'bg-green-200');
      },
      avatarColor() {
        return this.getAvatarColor(this.departmentColor, 'bg-blue-400');
      }
    },
    methods: {
      toggleExpand() {
        if (!this.isExpanded && !this.subordinatesLoaded) {
          // Load subordinates first and delay expansion until they are loaded
          this.loadSubordinates(true);
        } else {
          // Toggle visibility of descendants
          this.toggleVisibility();
        }
      },
      toggleVisibility() {
        if (!this.isExpanded) {
          // Expanding: Increment displayed descendants based on visible ones
          const visibleDescendants = this.calculateVisibleDescendants(this.subordinates);
          this.$emit('incrementDisplayedDescendants', visibleDescendants);
          this.displayedDescendants = visibleDescendants;
        } else {
          // Collapsing: Decrement the displayed descendants
          this.$emit('incrementDisplayedDescendants', -this.displayedDescendants);
          this.displayedDescendants = 0;
        }
        this.isExpanded = !this.isExpanded;
      },
      calculateVisibleDescendants(subordinates) {
        let count = subordinates.length;
        subordinates.forEach(subordinate => {
          if (subordinate.isExpanded && subordinate.subordinates && subordinate.subordinates.length > 0) {
            count += this.calculateVisibleDescendants(subordinate.subordinates);
          }
        });
        return count;
      },
      countDescendants() {
        if (!this.descendantCountMemo) {
          this.descendantCountMemo = this.calculateDescendants(this.person);
        }
        return this.descendantCountMemo;
      },
      calculateDescendants(person) {
        if (!person.subordinates || !person.subordinates.length) return 0;
        return person.subordinates.reduce((count, subordinate) => count + 1 + this.calculateDescendants(subordinate), 0);
      },
      getManagementCost() {
        if (this.managementCostMemo === null) {
          this.managementCostMemo = this.calculateManagementCost(this.person);
        }
        return this.managementCostMemo;
      },
      calculateManagementCost(person) {
        if (!person.subordinates || !person.subordinates.length) return 0;
        return person.subordinates.reduce((cost, sub) => {
          return cost + (sub.subordinates.length > 0 ? sub.Salary + this.calculateManagementCost(sub) : 0);
        }, 0);
      },
      getIcCost() {
        if (this.icCostMemo === null) {
          this.icCostMemo = this.calculateIcCost(this.person);
        }
        return this.icCostMemo;
      },
      calculateIcCost(person) {
        if (!person.subordinates || !person.subordinates.length) return 0;
        return person.subordinates.reduce((cost, sub) => {
          return cost + (sub.subordinates.length === 0 ? sub.Salary : this.calculateIcCost(sub));
        }, 0);
      },
      getTotalCost() {
        if (this.totalCostMemo === null) {
          this.totalCostMemo = this.calculateTotalCost(this.person);
        }
        return this.totalCostMemo;
      },
      calculateTotalCost(person) {
        return person.Salary + (person.subordinates?.reduce((cost, sub) => cost + this.calculateTotalCost(sub), 0) || 0);
      },
      getManagementCostRatio() {
        const icCost = this.getIcCost();
        const managementCost = this.getManagementCost();
        return icCost > 0 ? (managementCost / icCost).toFixed(2) : 'N/A';
      },
      formatCurrency(value) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
      },
      loadSubordinates(expandAfterLoading = false) {
        this.loadSubordinatesCallback(this.person.EmployeeId, fetchedSubordinates => {
          this.subordinates = fetchedSubordinates || [];
          this.subordinatesLoaded = true;
  
          // If expandAfterLoading is true, automatically expand after loading subordinates
          if (expandAfterLoading) {
            this.toggleVisibility();  // Automatically expand after loading
          }
        });
      },
      incrementDisplayedDescendants(count) {
        this.displayedDescendants += count;
        this.$emit('incrementDisplayedDescendants', count);
      },
      getAdjustedColor(baseColor, defaultColor) {
        return baseColor?.replace('100', '200') || defaultColor;
      },
      getAvatarColor(baseColor, defaultColor) {
        return baseColor?.replace('100', '400') || defaultColor;
      }
    },
  };
  </script>
  
  <style scoped>
  .line-connector {
    position: absolute;
    width: 2px;
    height: 18px;
    background-color: black;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .subordinate-top-line {
    position: absolute;
    width: 2px;
    height: 16px;
    background-color: black;
    top: -16px;
    left: 50%;
    transform: translateX(-50%);
  }
  </style>
  