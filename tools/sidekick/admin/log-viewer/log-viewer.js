/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const regexpFull = /^.*github.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\/tree\/([a-zA-Z0-9_-]+)$/;
const regexpPartial = /^.*github.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/;
let helixConfig = {};

function addErrorMessage(message, el) {
  const errorDiv = document.createElement('div');
  errorDiv.classList.add('log');
  errorDiv.classList.add('error');
  errorDiv.innerHTML = message;
  el.insertAdjacentElement('afterend', errorDiv);
}

async function getLogs(container, from, to) {
  const submitButton = container.querySelector('button#logSubmit');
  const { owner, repo, ref } = helixConfig;
  if (owner && repo && ref) {
    const resp = await fetch(`https://admin.hlx.page/log/${owner}/${repo}/${ref}?from=${from}&to=${to}`, {
      credentials: 'include',
    });
    if (resp.status === 401) {
      addErrorMessage(`401 Unauthorized. Please login to <a href="https://admin.hlx.page/login">https://admin.hlx.page/login</a> before viewing logs.
        You also need to have a role of author or admin to view logs`, submitButton);
      return [];
    }
    if (resp) {
      const logsJson = await resp.json();
      if (logsJson) {
        return logsJson.entries;
      }
    }
  }
  return [];
}

async function processForm(container) {
  const submitButton = container.querySelector('button#logSubmit');
  // clear previous logs and any messages
  const messages = container.querySelectorAll('div.log');
  messages.forEach((message) => message.remove());
  const logs = container.querySelector('div#logs');
  if (logs) logs.remove();

  // Get the form values
  let fromDT = container.querySelector('#from-date-time').value;
  let toDT = container.querySelector('#to-date-time').value;
  // If from / to datetime is empty, default to last 24 hours
  if (fromDT === '') {
    // If empty or not selected, default to yesterday
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - 1);
    fromDT = dateObj.toISOString();
  }
  // If empty or not selected, default to now
  if (toDT === '') toDT = (new Date()).toISOString();
  // Get logs
  const values = await getLogs(container, fromDT, toDT);
  if (values && values.length > 0) {
    // githubUrlEl.classList.add('success');
    // update timestamps to be readableand create links for paths
    values.forEach((value) => {
      const dateObj = new Date(value.timestamp);
      value.timestamp = dateObj.toLocaleString();
      if (value.ref && value.repo && value.owner && value.path && value.route) {
        if (value.route === 'preview') {
          value.path = `<a href="https://${value.ref}--${value.repo}--${value.owner}.hlx.page${value.path}">${value.path}</a>`;
        }
        if (value.route === 'live') {
          value.path = `<a href="https://${value.ref}--${value.repo}--${value.owner}.hlx.live${value.path}">${value.path}</a>`;
        }
      }
      if (value.source === 'indexer') {
        value.route = 'indexer';
        value.path = value.changes;
      }
    });
    const valuesReversed = values.reverse();
    // Build list
    const table = `
        <div id="logs">
          <table>
            <tbody class="list">
              <tr>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Method</th>
                <th>Route</th>
                <th>Path</th>
                <th>User</th>
                <th>Errors</th>
                <th>Duration (ms)</th>
                <th>ContentBusID</th>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    container.append(document.createRange().createContextualFragment(table));
    const tableEl = container.querySelector('#logs .list');
    // eslint-disable-next-line no-unused-vars, no-undef
    valuesReversed.forEach((value) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
          <td class="timestamp">${value.timestamp || ''}</td>
          <td class="status">${value.status || ''}</td>
          <td class="method">${value.method || ''}</td>
          <td class="route">${value.route || ''}</td>
          <td class="path">${value.path || ''}</td>
          <td class="user">${value.user || ''}</td>
          <td class="errors">${value.errors || ''}</td>
          <td class="duration">${value.duration || ''}</td>
          <td class="contentBusId">${value.contentBusId || ''}</td>`;
      tableEl.append(tr);
    });
  } else {
    // githubUrlEl.classList.add('error');
    addErrorMessage(`No logs found for ${helixConfig.repo}--${helixConfig.site}--${helixConfig.ref}`, submitButton);
  }
}

function init(container) {
  const calOptions = {
    input: true,
    settings: {
      selection: {
        time: 24,
      },
    },
    actions: {
      changeToInput(e, calendar, dates, time, hours, minutes) {
        if (dates[0]) {
          const selectedDT = new Date(`${dates[0]}T${hours}:${minutes}:00.000`);
          calendar.HTMLInputElement.value = selectedDT.toISOString();
        } else {
          calendar.HTMLInputElement.value = '';
        }
      },
    },
  };
  // eslint-disable-next-line no-undef
  const fromCalendarEl = container.querySelector('#from-date-time');
  const fromCalendar = new VanillaCalendar(fromCalendarEl, calOptions);
  // eslint-disable-next-line no-undef
  const toCalendarEl = container.querySelector('#to-date-time');
  const toCalendar = new VanillaCalendar(toCalendarEl, calOptions);
  fromCalendar.init();
  toCalendar.init();
  const submitButton = container.querySelector('button#logSubmit');
  submitButton.addEventListener('click', () => processForm(container));
}

function includeJS(url) {
  // include js file to the head of the document
  const js = document.createElement('script');
  js.src = new URL(url, import.meta.url);
  document.head.appendChild(js);
  return js;
}

function includeCSS(url) {
  // include css file to the head of the document
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL(url, import.meta.url);
  document.head.appendChild(css);
}

export default async function decorate(container, data, query, context) {
  helixConfig = context;
  const divSoup = `
  <div class="hero">
    <h1>Helix Log Viewer</h1>
  </div>
  <div class="form">
    <form onsubmit="event.preventDefault();">
      <p><strong>Optional Date/Time range: <i>(Default is past 24 hours)</i></strong></p>
      <label for="from-date-time">From: </label>
      <input 
        id="from-date-time"
        name="from-date-time"
        type="text"
        title="Select Date/Time range when you want to start looking for logs. Default is 24 hours from current time."
      />
      <label for="to-date-time">To: </label>
      <input 
        id="to-date-time"
        name="to-date-time"
        type="text"
        title="Select Date/Time range when you want to stop looking for logs. Default is current time."
      />
      <button type="submit" id="logSubmit" name="logSubmit">Submit</button>
    </form>
  </div>
  `;
  container.innerHTML = divSoup;
  includeCSS('/tools/sidekick/admin/log-viewer/vanilla-calendar.min.css');
  includeCSS('/tools/sidekick/admin/log-viewer/light.min.css');
  // includeCSS('/tools/sidekick/admin/log-viewer/log-viewer.css');
  const vanillaJS = includeJS('/tools/sidekick/admin/log-viewer/vanilla-calendar.min.js');
  vanillaJS.onload = () => {
    init(container);
  };
}
