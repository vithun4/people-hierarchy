# People Hierarchy Visualization

This project visualizes an organization's hierarchy using Vue.js and TailwindCSS. It allows users to expand and collapse employee nodes and displays key metrics like management cost, IC (individual contributor) cost, total cost, and number of descendants.

## Built By

**Vithun Vigneswaran**

## Technologies Used

- **Vue.js**: Frontend framework for building interactive UIs.
- **TailwindCSS**: For responsive and clean design.
- **d3-hierarchy**: To handle hierarchical data.
- **PapaParse**: For CSV parsing.

## What It Does

- Displays employee hierarchy with expandable nodes.
- Shows descendant counts, management costs, IC costs, and total costs.
- Supports zooming and dragging for better navigation of large hierarchies.

## How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/vithun4/people-hierarchy.git
   cd people-hierarchy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the app:
   ```bash
   npm run serve
   ```

4. Open `http://localhost:8080` in your browser.

## Live Demo

You can also view the live demo on Vercel: [people-hierarchy.vercel.app](https://people-hierarchy.vercel.app/)