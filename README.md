# People Hierarchy Visualization

This project was created as part of a coding test for an engineering role, tasked with visualizing an organization's hierarchy using **Vue.js** and **TailwindCSS**. The solution efficiently handles large datasets, including calculating key metrics such as descendant counts, management cost, IC cost, and total cost.

## Author

This project was developed by **Vithun Vigneswaran** based on a prompt created by Saahil Jaffer, Dave Kim, and Oskar Szulc.

---

## Assignment Overview

### Objective
Given a CSV file with people data, the goal is to create a responsive layout that displays the hierarchy of reporting lines. Users should be able to interact with the nodes to expand or collapse them and view metrics like descendant counts, management costs, and IC costs.

### Features
1. **Hierarchical Layout**: The people hierarchy is displayed as expandable/collapsible nodes, each representing a person.
2. **Memoized Descendant Count**: The number of descendants for each node is calculated efficiently using memoization to avoid repeated recursive calculations.
3. **Key Metrics**:
   - **Management Cost**: The recursive sum of the salary of descendants who have subordinates.
   - **IC (Individual Contributor) Cost**: The recursive sum of the salary of descendants who do not have subordinates.
   - **Total Cost**: The total salary of all descendants.
   - **Management Cost Ratio**: The ratio between individual contributors and managers.
4. **Zoom & Drag**: The interface allows zooming and dragging to help navigate large hierarchies.
5. **Responsive UI**: Built with **TailwindCSS** for a clean and responsive design.

---

## Technologies Used

- **Vue.js**: JavaScript framework for building the interactive user interface.
- **TailwindCSS**: Utility-first CSS framework for styling the application.
- **d3-hierarchy**: A useful library from D3.js to handle hierarchical data and relationships.
- **PapaParse**: A fast CSV parser used for loading and processing the people data.

---

## Data

### Input:
The project works with a provided CSV file (`peopleData.csv`) that includes fields such as:
- **Employee ID**
- **Manager ID**
- **Department**
- **Salary**

### Example Metrics:
- **Management Cost**: $500,000
- **IC Cost**: $200,000
- **Total Cost**: $700,000
- **Management Cost Ratio**: 2.5

This data is processed to compute the hierarchical relationships and the metrics described.

---

## Installation & Running the Project

To run this project on your local machine, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/vithun4/people-hierarchy.git
   cd people-hierarchy
   ```

2. **Install Dependencies**:
   Ensure that `npm` is installed on your machine. Then run:
   ```bash
   npm install
   ```

3. **Run the Application**:
   Start the local development server with:
   ```bash
   npm run serve
   ```

4. **View in Browser**:
   The app will run on `http://localhost:8080`. Open this URL in your browser to view the hierarchy visualization.

---

## Requirements

- **No TypeScript**: JavaScript was used exclusively for the Vue components.
- **Vue.js** and **TailwindCSS** were required, which have been used for the structure and styling respectively.

