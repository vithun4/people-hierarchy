<template>
    <div class="flex flex-col items-center relative">
        <!-- Manager Node -->
        <div v-if="person"
            :class="['relative flex flex-col items-center rounded-lg shadow-md p-4 text-center w-64 border', departmentColor]">
            <!-- Avatar or Initials -->
            <div
                :class="['w-12 h-12 rounded-full text-white flex items-center justify-center text-xl font-bold mb-2', avatarColor]">
                {{ initials }}
            </div>

            <!-- Name and Role -->
            <p class="font-bold text-gray-700">{{ person["Name"] }}</p>
            <p class="text-sm text-gray-700">{{ person["Job Title"] || 'Role not specified' }}</p>

            <!-- Department -->
            <span
                class="bg-gray-200 border border-gray-400 text-gray-700 rounded-full px-3 py-1 text-xs font-medium mb-2 ">{{
                    person["Department"]
                    || 'Unknown Department' }}</span>

            <!-- Location and Level -->
            <div :class="['flex flex-row items-center text-xs ']">
                <div :class="['flex items-center space-x-1 border rounded-full px-3 py-1 mr-1', pillColor]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                        stroke="currentColor" class="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <p>{{ person["Location"] || 'Location not specified' }}</p>
                </div>
                <div :class="['flex items-center space-x-1 border rounded-full px-3 py-1', pillColor]">
                <p>Level {{ person["level"] || 'N/A' }}</p>
                </div>
            </div>

            <!-- Management Cost, IC Cost, and Total Cost -->
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
                    <strong>Management Cost Ratio:</strong>
                    {{ getIcCost() > 0 ? (getManagementCost() / getIcCost()).toFixed(2) : 'N/A' }}
                </p>
            </div>
            <button @click="toggleExpand" class="text-sm focus:outline-none ">
                <div
                    :class="[isExpanded ? 'bg-gray-50' : 'bg-gray-200',
                        'text-gray-700 rounded-full px-3 py-1 text-xs mt-3 border border-gray-400 hover:bg-gray-100']">
                    {{ displayedDescendants }}/{{ countDescendants() }} Descendants {{ isExpanded ? '▲' : '▼' }}
                </div>
            </button>
            <div v-if="isExpanded && subordinates.length > 0" class="line-connector"></div>
        </div>

        <!-- Line connecting parent and subordinates -->
        <div class="subordinate-top-line"></div>
        <!-- Subordinates (Render only when expanded and subordinates exist) -->
        <div v-if="isExpanded && subordinates.length > 0"
            class="flex flex-col items-center mt-4 p-4 border border-black border-t-2 border-0">
            <div class="flex flex-row items-start space-x-4">
                <PersonNode v-for="subordinate in subordinates" :key="subordinate.EmployeeId" :person="subordinate"
                    :departmentColors="departmentColors" :loadSubordinatesCallback="loadSubordinatesCallback"
                    @incrementDisplayedDescendants="incrementDisplayedDescendants" />
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PersonNode',
    props: {
        person: {
            type: Object,
            required: true,
            default: () => ({})
        },
        loadSubordinatesCallback: Function,
        departmentColors: {
            type: Object,
            required: true
        }
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
            displayedDescendants: 0  // Tracks the number of currently displayed descendants
        };
    },
    computed: {
        initials() {
            return this.person && this.person["Name"]
                ? this.person["Name"].split(' ').map(n => n[0]).join('')
                : ''; // Return an empty string if Name is undefined
        },
        departmentColor() {
            const department = this.person["Department"] || 'Unknown Department';
            return this.departmentColors[department] || 'bg-gray-50 border-gray-500';
        },
        pillColor() {
            return this.getAdjustedColor(this.departmentColor, 'bg-green-200');
        },
        avatarColor() {
            return this.getAvatarColor(this.departmentColor, 'bg-blue-400');
        },
        textColor() {
            return this.getTextColorFromBorder(this.departmentColor);
        }
    },
    methods: {
        toggleExpand() {
            if (!this.isExpanded) {
                // Expanding: Load subordinates if not already loaded
                if (!this.subordinatesLoaded) {
                    this.loadSubordinates();  // Load subordinates on first expansion
                } else {
                    // Increment the number of displayed descendants based on the visible descendants
                    const visibleDescendants = this.calculateVisibleDescendants(this.subordinates);
                    this.$emit('incrementDisplayedDescendants', visibleDescendants);
                    this.displayedDescendants = visibleDescendants;  // Set the count for currently visible descendants
                }
            } else {
                // Collapsing: Decrement the displayed descendants count
                this.$emit('incrementDisplayedDescendants', -this.displayedDescendants);
                this.displayedDescendants = 0;  // Reset the displayed descendants count
            }
            this.isExpanded = !this.isExpanded;
        },
        calculateVisibleDescendants(subordinates) {
            let count = subordinates.length; // Count the direct subordinates
            subordinates.forEach(subordinate => {
                if (subordinate.isExpanded && subordinate.subordinates && subordinate.subordinates.length > 0) {
                    // Recursively count only if the node is expanded
                    count += this.calculateVisibleDescendants(subordinate.subordinates);
                }
            });
            return count;
        },
        loadSubordinates() {
            this.loadSubordinatesCallback(this.person.EmployeeId, fetchedSubordinates => {
                this.subordinates = fetchedSubordinates || [];
                this.subordinatesLoaded = true;

                // When expanding for the first time, count the visible subordinates
                if (this.isExpanded) {
                    const visibleDescendants = this.calculateVisibleDescendants(this.subordinates);
                    this.$emit('incrementDisplayedDescendants', visibleDescendants);
                    this.displayedDescendants = visibleDescendants;
                }
            });
        },
        incrementDisplayedDescendants(count) {
            this.displayedDescendants += count;
            this.$emit('incrementDisplayedDescendants', count);  // Propagate to parent node
        },
        countDescendants() {
            // Count total descendants, including those not currently visible
            if (!this.subordinatesLoaded) {
                this.loadSubordinates();
            }
            if (this.descendantCountMemo === null) {
                this.descendantCountMemo = this.calculateDescendants(this.person);
            }
            return this.descendantCountMemo;
        },
        calculateDescendants(person) {
            // Recursively calculate all descendants, regardless of visibility
            if (!person.subordinates || person.subordinates.length === 0) return 0;
            return person.subordinates.reduce((count, subordinate) => {
                return count + 1 + this.calculateDescendants(subordinate);
            }, 0);
        },
        getManagementCost() {
            if (this.managementCostMemo === null) {
                this.managementCostMemo = this.calculateManagementCost(this.person);
            }
            return this.managementCostMemo;
        },
        calculateManagementCost(person) {
            let cost = 0;
            if (person.subordinates.length > 0) {
                person.subordinates.forEach(sub => {
                    if (sub.subordinates.length > 0) {
                        cost += sub["Salary"] + this.calculateManagementCost(sub);
                    }
                });
            }
            return cost;
        },
        getIcCost() {
            if (this.icCostMemo === null) {
                this.icCostMemo = this.calculateIcCost(this.person);
            }
            return this.icCostMemo;
        },
        calculateIcCost(person) {
            let cost = 0;
            if (person.subordinates.length > 0) {
                person.subordinates.forEach(sub => {
                    if (sub.subordinates.length === 0) {
                        cost += sub["Salary"];
                    } else {
                        cost += this.calculateIcCost(sub);
                    }
                });
            }
            return cost;
        },
        getTotalCost() {
            if (this.totalCostMemo === null) {
                this.totalCostMemo = this.calculateTotalCost(this.person);
            }
            return this.totalCostMemo;
        },
        calculateTotalCost(person) {
            let cost = person["Salary"];
            if (person.subordinates.length > 0) {
                person.subordinates.forEach(sub => {
                    cost += this.calculateTotalCost(sub);
                });
            }
            return cost;
        },
        formatCurrency(value) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
        },
        getAdjustedColor(baseColor, defaultColor) {
            // Adjust the departmentColor class to produce a lighter shade (e.g., bg-green-200 if bg-green-100)
            if (!baseColor) return defaultColor;
            return baseColor.replace('100', '200');
        },
        getAvatarColor(baseColor, defaultColor) {
            // Adjust the departmentColor class to produce a darker shade (e.g., bg-blue-400 if bg-blue-100)
            if (!baseColor) return defaultColor;
            return baseColor.replace('100', '400');
        },
        getTextColorFromBorder(baseColor) {
            // Translate the background color class to a corresponding text color class
            return baseColor.replace('bg', 'text').replace('100', '500');
        }
    }
};
</script>
<style>
.line-connector {
    position: absolute;
    width: 2px;
    height: 18px;
    background-color: black;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
}

.dashed-container {
    position: relative;
    margin-top: 20px;
    /* Adjust to create space for the line */
}

.subordinate-top-line {
    position: absolute;
    width: 2px;
    height: 16px;
    background-color: black;
    top: -16px;
    /* Adjust to position the line at the top of the subordinate */
    left: 50%;
    transform: translateX(-50%);
}
</style>