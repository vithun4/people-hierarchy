<template>
    <div class="flex flex-col items-center">
        <!-- Manager Node -->
        <div v-if="person"
            :class="['relative flex flex-col items-center rounded-lg shadow-md p-4 text-center mb-4 w-64 border', departmentColor]">
            <!-- Avatar or Initials -->
            <div
                :class="['w-12 h-12 rounded-full text-white flex items-center justify-center text-xl font-bold mb-2', avatarColor]">
                {{ initials }}
            </div>

            <!-- Name and Role -->
            <p class="font-bold text-gray-700">{{ person["Name"] }}</p>
            <p class="text-sm text-gray-700">{{ person["Job Title"] || 'Role not specified' }}</p>

            <!-- Department -->
            <span class="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-xs font-medium mb-2 border">{{
                person["Department"]
                || 'Unknown Department' }}</span>

            <!-- Location and Level -->
            <div :class="['flex flex-col items-center text-xs ']">
                <p>{{ person["Location"] || 'Location not specified' }}</p>
                <p>Level {{ person["level"] || 'N/A' }}</p>
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

            <!-- Expand/Collapse Button -->
            <button @click="toggleExpand" class="text-sm text-blue-500 focus:outline-none">
                <!-- {{ isExpanded ? 'Hide Subordinates' : 'View Subordinates' }} -->
                <div class="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-xs mt-3">
                    {{ displayedDescendants }}/{{ countDescendants() }} Descendants
                </div>
            </button>
        </div>

        <!-- Subordinates (Render only when expanded and subordinates exist) -->
        <div v-if="isExpanded && subordinates.length > 0" class="flex flex-col items-center mt-4">
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
            if (!this.isExpanded && !this.subordinatesLoaded) {
                this.loadSubordinates();
            }
            this.isExpanded = !this.isExpanded;
        },
        loadSubordinates() {
            this.loadSubordinatesCallback(this.person.EmployeeId, fetchedSubordinates => {
                this.subordinates = fetchedSubordinates || [];
                this.subordinatesLoaded = true;

                // Update displayed descendants count
                this.displayedDescendants = this.subordinates.length;
                this.$emit('incrementDisplayedDescendants', this.displayedDescendants);  // Emit total to parent
            });
        },
        incrementDisplayedDescendants(count) {
            this.displayedDescendants += count;  // Increment the displayed descendants count
            this.$emit('incrementDisplayedDescendants', count);  // Emit to parent node
        },
        countDescendants() {
            if (!this.subordinatesLoaded) {
                this.loadSubordinates();
            }
            if (this.descendantCountMemo === null) {
                this.descendantCountMemo = this.calculateDescendants(this.person);
            }
            return this.descendantCountMemo;
        },
        calculateDescendants(person) {
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
            console.log(baseColor.replace('100', '400'));
            return baseColor.replace('100', '400');
        },
        getTextColorFromBorder(baseColor) {
            // Translate the background color class to a corresponding text color class
            return baseColor.replace('bg', 'text').replace('100', '500');
        }
    }
};
</script>
