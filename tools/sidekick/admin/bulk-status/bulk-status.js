let owner;
let repo;
let ref;

const paths = { paths: ['/*'] };

let statusCheckInterval;

async function postData(url, data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

async function getData(url) {
  const response = await fetch(url, {
    method: 'GET', // Use GET method
    mode: 'cors', // Allow cross-origin requests
  });
  return response.json(); // Parse and return the response as JSON
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
}

function customStringify(value) {
  if (typeof value === 'object' && value !== null) {
    // For objects, return JSON.stringify
    return JSON.stringify(value);
  } if (typeof value === 'string' && isValidDate(value)) {
    // If it's a string that can be a date, format it
    return new Date(value).toLocaleString();
  }
  // For other types, return the value directly without quotes
  return String(value);
}

async function checkJobStatus(url, container) {
  const status = await getData(url);
  if (status.state === 'completed' || status.state === 'stopped') {
    const details = await getData(`${status.links.self}/details`);
    clearInterval(statusCheckInterval); // Clear the interval to stop checking
    statusCheckInterval = null; // Reset the interval variable
    const { resources } = details.data;
    const table = document.createElement('table');
    table.classList.add('admin-results');
    table.innerHTML = `<tr>
      <th>Path</th>
      <th>Preview</th>
      <th>Published</th>
    </tr>`;

    resources.forEach((resource) => {
      const row = document.createElement('tr');
      Object.entries(resource).forEach(([key, value]) => {
        const cellValue = document.createElement('td');
        cellValue.textContent = customStringify(value);
        row.appendChild(cellValue);
      });
      table.appendChild(row);
    });

    // Clear container and append table
    container.innerHTML = '';
    container.classList.add('results-done');
    container.appendChild(table);
  }
}

export default async function decorate(container, data, query, context) {
  owner = context.owner;
  repo = context.repo;
  ref = context.ref;
  if (!statusCheckInterval) {
    container.classList.remove('results-done');
    const status = await postData(`https://admin.hlx.page/status/${owner}/${repo}/${ref}/*`, paths);
    const progress = document.createElement('sp-progress-circle');
    progress.classList.add('pcircle');
    progress.setAttribute('indeterminate', '');
    progress.setAttribute('size', 'l');
    container.append(progress);
    if (status.job.state !== 'created') {
      // console.log(await getData(`${status.links.self}/details`));
    } else {
      // Set an interval to check the job status every 2 seconds
      statusCheckInterval = setInterval(() => checkJobStatus(status.links.self, container), 2000);
    }
  }
}
