import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

// Load project data
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');
const titleElement = document.querySelector('.projects-title');

// Initial render of projects list
renderProjects(projects, projectsContainer, 'h2');
if (titleElement && projects) {
  titleElement.textContent = `Projects (${projects.length})`;
}

// State for search query and selected pie slice
let query = '';
let selectedIndex = -1;
let currentPieData = [];

// Refactor all plotting into one function (Step 4.4)
function renderPieChart(projectsGiven) {
  // Re-calculate rolled data (Step 3.1)
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  // Re-calculate data (Step 2.1 & 3.1)
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  currentPieData = newData;

  // Clear previous SVG paths and legend items
  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  if (newData.length === 0) {
    return;
  }

  // Generate pie slices and arc generator (Step 1.3 & 1.4 & 2.1)
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(newData);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let arcs = arcData.map((d) => arcGenerator(d));

  // Color scale (Step 1.5)
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Render SVG paths (Step 1.4, 5.1, 5.2)
  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        handleSelection(i);
      });
  });

  // Render legend items (Step 2.2, 5.2)
  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        handleSelection(idx);
      });
  });
}

// Unified selection and filtering handler (Step 5.2, 5.3 & Step 5.4 Extra Credit)
function handleSelection(index) {
  // Toggle selection: deselect if already clicked, otherwise select
  selectedIndex = selectedIndex === index ? -1 : index;

  // Update visual selection highlights on SVG wedges and legend items
  d3.select('#projects-pie-plot')
    .selectAll('path')
    .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

  d3.select('.legend')
    .selectAll('li')
    .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

  // Update filtered project list
  applyCombinedFilters();
}

// Function that applies BOTH search query AND selected pie year (Step 5.4 Extra Credit)
function applyCombinedFilters() {
  let filtered = projects.filter((project) => {
    // 1. Search filter: case-insensitive across all project metadata (Step 4.3)
    let matchesQuery = true;
    if (query) {
      let values = Object.values(project).join('\n').toLowerCase();
      matchesQuery = values.includes(query.toLowerCase());
    }

    // 2. Year filter from selected wedge/legend (Step 5.3)
    let matchesYear = true;
    if (selectedIndex !== -1 && currentPieData[selectedIndex]) {
      let selectedYear = currentPieData[selectedIndex].label;
      matchesYear = project.year === selectedYear;
    }

    return matchesQuery && matchesYear;
  });

  renderProjects(filtered, projectsContainer, 'h2');

  if (titleElement) {
    titleElement.textContent = `Projects (${filtered.length})`;
  }
}

// Initial render of pie chart on page load (Step 4.4)
renderPieChart(projects);

// Real-time search input listener (Step 4.2, 4.3, 4.4 & 5.4)
searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  // Projects matching search query
  let queryFilteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // Remember the currently selected year if one was selected
  let previouslySelectedYear =
    selectedIndex !== -1 && currentPieData[selectedIndex]
      ? currentPieData[selectedIndex].label
      : null;

  // Re-render pie chart with projects matching search query
  renderPieChart(queryFilteredProjects);

  // Restore selection highlight if the selected year is still present
  if (previouslySelectedYear) {
    let newIdx = currentPieData.findIndex((d) => d.label === previouslySelectedYear);
    selectedIndex = newIdx;
    d3.select('#projects-pie-plot')
      .selectAll('path')
      .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
    d3.select('.legend')
      .selectAll('li')
      .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
  } else {
    selectedIndex = -1;
  }

  // Render project cards matching both filters
  applyCombinedFilters();
});
