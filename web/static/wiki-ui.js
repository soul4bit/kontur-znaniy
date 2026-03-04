(() => {
  const ROFL_STORIES = [
    {
      title: "02:37, пейджер пищит как чайник",
      text: "График latency растет вверх, а ты растешь духовно. Спокойно, сначала факты.",
      command: "$ kubectl top pods -A | sort -rk3 | head -n 10",
      severity: "мягкая паника",
    },
    {
      title: "Деплой прошел, но почему-то страшно",
      text: "Все зеленое, но внутренний SRE уже готовит rollback на салфетке.",
      command: "$ gh run list --limit 5",
      severity: "подозрительно спокойно",
    },
    {
      title: "Nginx отвечает 502 с искренним лицом",
      text: "Сервис жив, но только морально. Идем смотреть upstream и логи.",
      command: "$ journalctl -u kontur-znaniy -n 120 --no-pager",
      severity: "локальный пожар",
    },
    {
      title: "Бэкап есть. Наверное.",
      text: "Тот самый момент, когда проверка бэкапов важнее веры в лучшее.",
      command: "$ ls -lah /var/backups | tail -n 8",
      severity: "экзистенциально",
    },
    {
      title: "CPU 98%, но коллега пишет: «это нормально»",
      text: "Нормально - это когда есть график, причина и план. Остальное романтика.",
      command: "$ top -bn1 | head -n 20",
      severity: "опасный оптимизм",
    },
    {
      title: "Сертификат решил уйти в отпуск",
      text: "Браузер ругается, пользователи грустят, certbot вспоминает молодость.",
      command: "$ sudo certbot certificates",
      severity: "криптопечаль",
    },
    {
      title: "В логах тишина, но приложение плачет",
      text: "Отлично, значит пора включать режим археолога и читать все подряд.",
      command: "$ rg -n \"error|panic|timeout|refused\" /var/log -S",
      severity: "детектив",
    },
    {
      title: "Случайный cron, случайные последствия",
      text: "Классика: за ночь кто-то почистил «лишнее» и ушел спать спокойно.",
      command: "$ crontab -l && sudo systemctl list-timers --all",
      severity: "сюрприз дня",
    },
  ];

  function initRoflCard() {
    const card = document.querySelector('[data-rofl-card]');
    if (!card) {
      return;
    }

    const titleNode = card.querySelector('[data-rofl-title]');
    const textNode = card.querySelector('[data-rofl-text]');
    const commandNode = card.querySelector('[data-rofl-command]');
    const severityNode = card.querySelector('[data-rofl-severity]');
    const refreshButton = card.querySelector('[data-rofl-refresh]');

    if (!titleNode || !textNode || !commandNode || !severityNode || !(refreshButton instanceof HTMLButtonElement)) {
      return;
    }

    let currentIndex = -1;
    const update = () => {
      let nextIndex = Math.floor(Math.random() * ROFL_STORIES.length);
      if (ROFL_STORIES.length > 1 && nextIndex === currentIndex) {
        nextIndex = (nextIndex + 1) % ROFL_STORIES.length;
      }
      currentIndex = nextIndex;

      const story = ROFL_STORIES[nextIndex];
      titleNode.textContent = story.title;
      textNode.textContent = story.text;
      commandNode.textContent = story.command;
      severityNode.textContent = `уровень: ${story.severity}`;
    };

    refreshButton.addEventListener('click', update);
    update();
  }

  function filterSidebar(sidebar, query) {
    const items = Array.from(sidebar.querySelectorAll('.atlas-nav-item'));
    let anyVisible = false;

    for (const item of items) {
      const titleNode = item.querySelector('.atlas-nav-title');
      if (!titleNode) {
        item.style.display = 'none';
        continue;
      }

      const sectionText = titleNode.textContent.toLowerCase();
      const subsectionLinks = Array.from(item.querySelectorAll('.atlas-sub-link'));
      const sectionMatches = sectionText.includes(query);
      let hasVisibleSubsection = false;

      for (const link of subsectionLinks) {
        const row = link.closest('li');
        if (!row) {
          continue;
        }

        const subsectionMatches = link.textContent.toLowerCase().includes(query);
        const isVisible = query === '' || sectionMatches || subsectionMatches;
        row.style.display = isVisible ? '' : 'none';
        if (isVisible) {
          hasVisibleSubsection = true;
        }
      }

      const showSection = query === '' || sectionMatches || hasVisibleSubsection;
      item.style.display = showSection ? '' : 'none';
      if (showSection) {
        anyVisible = true;
      }
    }

    const emptyNode = sidebar.querySelector('[data-nav-empty]');
    if (emptyNode) {
      emptyNode.hidden = anyVisible;
    }
  }

  function initSidebarSearch() {
    const sidebars = document.querySelectorAll('.atlas-sections-sidebar');
    for (const sidebar of sidebars) {
      const input = sidebar.querySelector('.atlas-nav-search');
      if (!(input instanceof HTMLInputElement)) {
        continue;
      }

      const applyFilter = () => {
        filterSidebar(sidebar, input.value.trim().toLowerCase());
      };

      input.addEventListener('input', applyFilter);
      applyFilter();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initRoflCard();
    initSidebarSearch();
  });
})();
