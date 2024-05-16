function renderList(splitContainer, data, query, context) {
  const sideNav = splitContainer.querySelector('sp-sidenav');
  const content = splitContainer.querySelector('.content');
  sideNav.replaceChildren();
  data.forEach((item) => {
    const listItem = document.createElement('sp-sidenav-item');
    listItem.setAttribute('value', item.name);
    listItem.setAttribute('label', item.name);
    listItem.addEventListener('click', async () => {
      content.replaceChildren();
      const module = await import(`./${item.module}/${item.module}.js`);
      module.default(content, item.data, query, context);
    });
    sideNav.append(listItem);
  });
}

/**
 * Called when a user tries to load the plugin
 * @param {HTMLElement} container The container to render the plugin in
 * @param {Object} data The data contained in the plugin sheet
 * @param {String} query If search is active, the current search query
 * @param {Object} context contains any properties set when the plugin was registered
 */
export async function decorate(container, data, query, context) {
  const splitContainer = document.createElement('div');
  splitContainer.classList.add('admin-tools');
  splitContainer.innerHTML = `<sp-split-view primary-size="350" dir="ltr" splitter-pos="250" resizable>
    <div class="menu">
      <div class="list-container">
        <sp-sidenav></sp-sidenav>
      </div>
    </div>
    <div class="content">
    </div>
  </sp-split-view>`;
  container.append(splitContainer);
  renderList(splitContainer, data, query, context);
}

export default {
  title: 'Admin',
  searchEnabled: true,
};
