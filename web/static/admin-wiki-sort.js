(() => {
  function asElement(value) {
    if (value instanceof Element) {
      return value;
    }
    return null;
  }

  function findSectionItem(value) {
    const element = asElement(value);
    if (!element) {
      return null;
    }
    return element.closest("[data-section-item]");
  }

  function collectOrder(container) {
    const items = Array.from(container.querySelectorAll("[data-section-item]"));
    const order = [];
    for (const item of items) {
      if (!(item instanceof HTMLElement)) {
        continue;
      }
      const slug = (item.dataset.sectionSlug || "").trim();
      if (slug !== "") {
        order.push(slug);
      }
    }
    return order;
  }

  function sameOrder(left, right) {
    if (!Array.isArray(left) || !Array.isArray(right)) {
      return false;
    }
    if (left.length !== right.length) {
      return false;
    }
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) {
        return false;
      }
    }
    return true;
  }

  function applyOrder(container, order) {
    if (!Array.isArray(order) || order.length === 0) {
      return;
    }

    const items = Array.from(container.querySelectorAll("[data-section-item]"));
    const bySlug = new Map();
    for (const item of items) {
      if (!(item instanceof HTMLElement)) {
        continue;
      }
      const slug = (item.dataset.sectionSlug || "").trim();
      if (slug !== "") {
        bySlug.set(slug, item);
      }
    }

    const fragment = document.createDocumentFragment();
    for (const slug of order) {
      const item = bySlug.get(slug);
      if (!item) {
        continue;
      }
      fragment.appendChild(item);
      bySlug.delete(slug);
    }

    for (const item of bySlug.values()) {
      fragment.appendChild(item);
    }

    container.appendChild(fragment);
  }

  function setStatus(statusNode, message, kind) {
    if (!(statusNode instanceof HTMLElement)) {
      return;
    }

    statusNode.classList.remove("is-ok", "is-error");
    if (kind === "ok") {
      statusNode.classList.add("is-ok");
    } else if (kind === "error") {
      statusNode.classList.add("is-error");
    }
    statusNode.textContent = message;
  }

  async function persistOrder(container, endpoint, csrfToken, order, statusNode, rollbackOrder) {
    const body = new URLSearchParams();
    body.set("order", order.join(","));
    body.set("tab", "catalog");

    setStatus(statusNode, "Сохраняю порядок разделов...", "");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-CSRF-Token": csrfToken,
          "X-Requested-With": "fetch"
        },
        body: body.toString()
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch (_error) {
        payload = null;
      }

      if (!response.ok || !payload || payload.ok !== true) {
        const text = payload && typeof payload.error === "string" ? payload.error.trim() : "";
        throw new Error(text || "Не удалось сохранить порядок разделов.");
      }

      setStatus(statusNode, "Порядок разделов сохранен.", "ok");
      return;
    } catch (error) {
      applyOrder(container, rollbackOrder);
      const message = error instanceof Error && error.message ? error.message : "Не удалось сохранить порядок разделов.";
      setStatus(statusNode, message, "error");
    }
  }

  function setupSectionSort(container) {
    if (!(container instanceof HTMLElement)) {
      return;
    }

    const endpoint = (container.dataset.sortEndpoint || "").trim();
    const csrfToken = (container.dataset.csrfToken || "").trim();
    if (endpoint === "" || csrfToken === "") {
      return;
    }

    const statusNode = container.parentElement
      ? container.parentElement.querySelector("[data-section-sort-status]")
      : null;
    const defaultStatusMessage = statusNode instanceof HTMLElement ? statusNode.textContent.trim() : "";

    for (const item of container.querySelectorAll("[data-section-item]")) {
      if (item instanceof HTMLElement) {
        item.draggable = false;
      }
    }

    let draggedItem = null;
    let orderBeforeDrag = [];
    let dragCompleted = false;
    let activeDropTarget = null;
    let armedItem = null;

    const clearDropTarget = () => {
      if (activeDropTarget instanceof HTMLElement) {
        activeDropTarget.classList.remove("is-drop-target");
      }
      activeDropTarget = null;
    };

    container.addEventListener("mousedown", (event) => {
      const target = asElement(event.target);
      if (!target) {
        return;
      }

      const handle = target.closest("[data-section-drag-handle]");
      if (!handle) {
        return;
      }

      const item = findSectionItem(handle);
      if (item instanceof HTMLElement) {
        if (armedItem instanceof HTMLElement && armedItem !== item) {
          armedItem.draggable = false;
        }
        armedItem = item;
        item.draggable = true;
      }
    });

    document.addEventListener("mouseup", () => {
      if (draggedItem instanceof HTMLElement) {
        return;
      }
      if (armedItem instanceof HTMLElement) {
        armedItem.draggable = false;
      }
      armedItem = null;
    });

    container.addEventListener("dragstart", (event) => {
      const item = findSectionItem(event.target);
      if (!(item instanceof HTMLElement) || item !== armedItem) {
        event.preventDefault();
        return;
      }

      draggedItem = item;
      armedItem = null;
      orderBeforeDrag = collectOrder(container);
      dragCompleted = false;
      clearDropTarget();
      item.classList.add("is-dragging");

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        const slug = (item.dataset.sectionSlug || "").trim();
        event.dataTransfer.setData("text/plain", slug);
      }

      setStatus(statusNode, "Перетащите раздел в новое место.", "");
    });

    container.addEventListener("dragover", (event) => {
      if (!(draggedItem instanceof HTMLElement)) {
        return;
      }
      event.preventDefault();

      const target = findSectionItem(event.target);
      if (!(target instanceof HTMLElement) || target === draggedItem) {
        clearDropTarget();
        return;
      }

      if (activeDropTarget !== target) {
        clearDropTarget();
        activeDropTarget = target;
        activeDropTarget.classList.add("is-drop-target");
      }

      const bounds = target.getBoundingClientRect();
      const insertBefore = event.clientY < bounds.top + bounds.height / 2;
      if (insertBefore) {
        container.insertBefore(draggedItem, target);
      } else {
        container.insertBefore(draggedItem, target.nextSibling);
      }
    });

    container.addEventListener("drop", (event) => {
      if (!(draggedItem instanceof HTMLElement)) {
        return;
      }
      event.preventDefault();
      dragCompleted = true;
      clearDropTarget();

      const currentOrder = collectOrder(container);
      if (sameOrder(orderBeforeDrag, currentOrder)) {
        setStatus(statusNode, defaultStatusMessage, "");
        return;
      }

      persistOrder(container, endpoint, csrfToken, currentOrder, statusNode, orderBeforeDrag);
    });

    container.addEventListener("dragend", () => {
      const originalOrder = orderBeforeDrag;
      const shouldRollback = !dragCompleted && originalOrder.length > 0;

      if (draggedItem instanceof HTMLElement) {
        draggedItem.classList.remove("is-dragging");
        draggedItem.draggable = false;
      }
      if (armedItem instanceof HTMLElement) {
        armedItem.draggable = false;
      }

      clearDropTarget();
      armedItem = null;
      draggedItem = null;
      orderBeforeDrag = [];
      dragCompleted = false;

      if (shouldRollback) {
        applyOrder(container, originalOrder);
        setStatus(statusNode, defaultStatusMessage, "");
      }
    });
  }

  function initAdminSectionSort() {
    const containers = document.querySelectorAll("[data-admin-section-sort]");
    for (const container of containers) {
      setupSectionSort(container);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initAdminSectionSort();
  });
})();
