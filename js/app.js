document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("searchInput");
  const categoryContainer = document.getElementById("categoryContainer");
  const pluginContainer = document.getElementById("pluginContainer");

  let plugins = {}; // Changed from array to object
  let categories = ["All"];
  let activeCategory = "All";
  let searchQuery = "";

  async function fetchData(url) {
    try {
      const response = await fetch(url);
      return response.ok ? response.json() : null;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return null;
    }
  }

  async function initialize() {
    const [categoryData, pluginData] = await Promise.all([
      fetchData(
        "https://raw.githubusercontent.com/bennowoforks/gauntlet-plugin-db/main/database/categories.json",
      ),
      fetchData(
        "https://raw.githubusercontent.com/bennowoforks/gauntlet-plugin-db/main/database/plugins.json",
      ),
    ]);

    if (!categoryData || !pluginData) {
      showErrorMessage();
      return;
    }

    categories = ["All", ...categoryData];
    plugins = pluginData;
    console.log(plugins);
    // renderCategories();
    renderPlugins();
  }

  function renderCategories() {
    categoryContainer.innerHTML = categories
      .map(
        (cat) =>
          `<div class="category-pill ${cat === activeCategory ? "active" : ""}" data-category="${cat}">${cat}</div>`,
      )
      .join("");
  }

  function renderPermissions(permissions) {
    if (!permissions)
      return `<span class="no-permissions">No permissions required</span>`;

    const sections = [
      { key: "environment", label: "Environment" },
      { key: "network", label: "Network" },
      { key: "system", label: "System" },
      { key: "clipboard", label: "Clipboard" },
      { key: "main_search_bar", label: "Search Bar" },
      { key: "filesystem.read", label: "Filesystem Read" },
      { key: "filesystem.write", label: "Filesystem Write" },
      { key: "exec.command", label: "Exec Command" },
      { key: "exec.executable", label: "Exec Executable" },
    ];

    return sections
      .map(({ key, label }) => {
        const value = key.includes(".")
          ? key.split(".").reduce((obj, k) => obj?.[k], permissions)
          : permissions[key];

        if (!value || !value.length) return "";

        return `
                    <div class="permission-group">
                        <span class="permission-title">${label}:</span>
                        ${value.map((v) => `<span class="permission">${v}</span>`).join("")}
                    </div>
                `;
      })
      .join("");
  }

  function renderPlugins() {
    const pluginEntries = Object.entries(plugins);

    const filteredPlugins = pluginEntries.filter(([_, plugin]) => {
      const lowerSearch = searchQuery.toLowerCase();
      const matchesSearch =
        !lowerSearch ||
        plugin.name.toLowerCase().includes(lowerSearch) ||
        plugin.description.toLowerCase().includes(lowerSearch);
      const matchesCategory =
        activeCategory === "All" || plugin.categories?.includes(activeCategory);
      return matchesSearch && matchesCategory;
    });

    if (!filteredPlugins.length) {
      pluginContainer.innerHTML = `<div class="no-results"><i class="fas fa-search"></i><p>No plugins found</p></div>`;
      return;
    }

    pluginContainer.innerHTML = filteredPlugins
      .map(([url, plugin]) => {
        const entryPointsHTML = plugin.entrypoint
          ? `
                        <div class="section-title"><i class="fas fa-code"></i> Entry Points</div>
                        <div class="entrypoints">
                            ${plugin.entrypoint
                              .map(
                                (entry) => `
                                    <div class="entrypoint">
                                        <span class="type">${entry.type}</span>
                                        <span class="name">${entry.name}</span>
                                        <p class="description">${entry.description}</p>
                                        ${
                                          entry.preferences
                                            ? `
                                          <div class="preferences">
                                            ${entry.preferences
                                              .map(
                                                (pref) => `
                                              <div class="preference">
                                                <span class="pref-name">${pref.name}</span>
                                                <span class="pref-type">${pref.type}</span>
                                                <p class="pref-description">${pref.description}</p>
                                              </div>
                                            `,
                                              )
                                              .join("")}
                                          </div>
                                        `
                                            : ""
                                        }
                                    </div>
                                `,
                              )
                              .join("")}
                        </div>
                    `
          : "";

        const permissionsHTML = `
                    <div class="section-title"><i class="fas fa-lock"></i> Permissions</div>
                    <div class="permissions-container">${renderPermissions(plugin.permissions)}</div>
                `;

        const supportedSystemHTML = plugin.supported_system
          ? `
                    <div class="section-title"><i class="fas fa-desktop"></i> Supported Systems</div>
                    <div class="supported-systems">
                        ${plugin.supported_system
                          .map(
                            (sys) => `
                            <span class="system">${sys.os}</span>
                        `,
                          )
                          .join("")}
                    </div>
                `
          : "";

        return `
                    <div class="plugin-card">
                        <div class="plugin-header">
                            <h3 class="plugin-title"><i class="fas fa-cube"></i> ${plugin.name}</h3>
                        </div>
                        <p class="plugin-description">${plugin.description}</p>
                        ${entryPointsHTML}
                        ${supportedSystemHTML}
                        ${permissionsHTML}
                        <a href="${url}" class="plugin-url" target="_blank"><i class="fab fa-github"></i> View on GitHub</a>
                    </div>
                `;
      })
      .join("");
  }

  function showErrorMessage() {
    pluginContainer.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i><h2>Error Loading Plugins</h2><p>Try refreshing the page</p></div>`;
  }

  categoryContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("category-pill")) {
      activeCategory = event.target.dataset.category;
      document
        .querySelectorAll(".category-pill")
        .forEach((el) => el.classList.remove("active"));
      event.target.classList.add("active");
      renderPlugins();
    }
  });

  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value.trim();
    renderPlugins();
  });

  initialize();
});
