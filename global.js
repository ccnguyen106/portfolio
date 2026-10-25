console.log('IT’S ALIVE!');

export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'https://github.com/ccnguyen106', title: 'GitHub' },
];

const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/'
    : '/portfolio/'; 

let nav = document.createElement('nav');

const container = document.querySelector('.container') || document.body;
container.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  if (a.host !== location.host) {
    a.target = '_blank';
  }

  nav.append(a);
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>`
);

// Step 4.4 & 4.5: Color scheme switching and localStorage persistence
const select = document.querySelector('.color-scheme select');

function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme);
  select.value = colorScheme;
}

// Attach listener to update color-scheme and save preference on change
select.addEventListener('input', function (event) {
  const colorScheme = event.target.value;
  setColorScheme(colorScheme);
  localStorage.colorScheme = colorScheme;
});

// Restore saved preference on page load if one exists
if ('colorScheme' in localStorage) {
  setColorScheme(localStorage.colorScheme);
}

// Step 5: Intercept contact form submission with proper percent-encoding
const form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
  event.preventDefault();

  const data = new FormData(form);
  let params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  const url = `${form.action}?${params.join('&')}`;
  location.href = url;
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement) return;
  containerElement.innerHTML = '';
  if (!projects || projects.length === 0) return;
  const projectList = Array.isArray(projects) ? projects : [projects];
  projectList.forEach((project) => {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <p>${project.description}</p>
    `;
    containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
export { fetchGitHubData as fetchGithubData };