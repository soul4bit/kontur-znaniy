(() => {
  const SHIFT_STATES = [
    {
      title: "Кластер дышит ровно",
      text: "Мониторинг молчит, но это не повод выключать бдительность.",
      command: "$ kubectl get pods -A | rg -v Running",
    },
    {
      title: "Сеть под контролем",
      text: "Пакеты летят, сертификаты не плачут, reverse proxy доволен.",
      command: "$ curl -I https://xn----8sbuffbvcbexxn.xn--p1ai",
    },
    {
      title: "CI не краснеет",
      text: "Пайплайн зелёный, значит можно заняться качеством заметок.",
      command: "$ gh run list --limit 5",
    },
    {
      title: "База не шатает",
      text: "Транзакции в норме, индексы на месте, дежурный спокоен.",
      command: "$ psql -c \"select now();\"",
    },
    {
      title: "Контур в фокусе",
      text: "Сегодня пишем коротко, чтобы завтра спасать быстрее.",
      command: "$ rg -n \"TODO|FIXME\" ./",
    },
  ];

  function initShiftCard() {
    const titleNode = document.querySelector("[data-shift-title]");
    const textNode = document.querySelector("[data-shift-text]");
    const commandNode = document.querySelector("[data-shift-command]");
    if (!titleNode || !textNode || !commandNode) {
      return;
    }

    const randomState = SHIFT_STATES[Math.floor(Math.random() * SHIFT_STATES.length)];
    titleNode.textContent = randomState.title;
    textNode.textContent = randomState.text;
    commandNode.textContent = randomState.command;
  }

  function filterSidebar(sidebar, query) {
    const items = Array.from(sidebar.querySelectorAll(".atlas-nav-item"));
    let anyVisible = false;

    for (const item of items) {
      const titleNode = item.querySelector(".atlas-nav-title");
      if (!titleNode) {
        item.style.display = "none";
        continue;
      }

      const sectionText = titleNode.textContent.toLowerCase();
      const subsectionLinks = Array.from(item.querySelectorAll(".atlas-sub-link"));
      const sectionMatches = sectionText.includes(query);
      let hasVisibleSubsection = false;

      for (const link of subsectionLinks) {
        const row = link.closest("li");
        if (!row) {
          continue;
        }
        const subsectionMatches = link.textContent.toLowerCase().includes(query);
        const isVisible = query === "" || sectionMatches || subsectionMatches;
        row.style.display = isVisible ? "" : "none";
        if (isVisible) {
          hasVisibleSubsection = true;
        }
      }

      const showSection = query === "" || sectionMatches || hasVisibleSubsection;
      item.style.display = showSection ? "" : "none";
      if (showSection) {
        anyVisible = true;
      }
    }

    const emptyNode = sidebar.querySelector("[data-nav-empty]");
    if (emptyNode) {
      emptyNode.hidden = anyVisible;
    }
  }

  function initSidebarSearch() {
    const sidebars = document.querySelectorAll(".atlas-sections-sidebar");
    for (const sidebar of sidebars) {
      const input = sidebar.querySelector(".atlas-nav-search");
      if (!(input instanceof HTMLInputElement)) {
        continue;
      }

      const applyFilter = () => {
        filterSidebar(sidebar, input.value.trim().toLowerCase());
      };

      input.addEventListener("input", applyFilter);
      applyFilter();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initShiftCard();
    initSidebarSearch();
  });
})();
