"use strict";

(() => {
  const form = document.querySelector("[data-auth-form]");
  const scene = document.querySelector("[data-auth-scene]");
  if (!form || !scene) {
    return;
  }

  const mode = (form.dataset.authMode || "login").toLowerCase();

  const nickInput = form.querySelector('input[name="name"], input[name="nick"]');
  const emailInput = form.querySelector('input[name="email"]');
  const passwordInput = form.querySelector('input[name="password"]');
  if (!emailInput || !passwordInput) {
    return;
  }
  const confirmInput = form.querySelector('input[name="confirm_password"]');

  const nickLine = scene.querySelector("[data-live-nick]");
  const emailLine = scene.querySelector("[data-live-email]");
  const passwordLine = scene.querySelector("[data-live-password]");
  const confirmLine = scene.querySelector("[data-live-confirm]");
  const eventLine = scene.querySelector("[data-live-event]");
  const statusLine = scene.querySelector("[data-live-status]");
  const fill = scene.querySelector("[data-live-fill]");
  const thumb = scene.querySelector("[data-live-thumb]");
  const flow = scene.querySelector("[data-live-flow]");
  const pulse = scene.querySelector("[data-live-pulse]");

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const shortEmail = (value) => {
    const clean = value.trim();
    if (clean.length <= 34) {
      return clean;
    }
    return `${clean.slice(0, 16)}...${clean.slice(-12)}`;
  };

  const maskPassword = (value) => {
    const count = Math.min(value.length, 16);
    return "*".repeat(count);
  };

  const shortNick = (value) => {
    const clean = value.trim();
    if (clean.length <= 18) {
      return clean;
    }
    return `${clean.slice(0, 16)}...`;
  };

  const setLine = (node, text) => {
    if (!node) {
      return;
    }
    node.textContent = text;
  };

  const setProgress = (value) => {
    const progress = clamp(value, 0, 100);

    if (fill) {
      fill.style.width = `${progress}%`;
    }
    if (thumb) {
      thumb.style.left = `${progress}%`;
    }

    if (flow && pulse) {
      const firstNode = flow.querySelector(".flow-node-1");
      const lastNode = flow.querySelector(".flow-node-3");

      if (firstNode && lastNode) {
        const startCenter = firstNode.offsetLeft + firstNode.offsetWidth / 2;
        const endCenter = lastNode.offsetLeft + lastNode.offsetWidth / 2;
        const pulseHalf = pulse.offsetWidth / 2;
        const center = startCenter + ((endCenter - startCenter) * progress) / 100;
        pulse.style.left = `${center - pulseHalf}px`;
      }
    }
  };

  const updateLoginScene = () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const hasEmail = email.length > 0;
    const hasPassword = password.length > 0;
    const strongPassword = password.length >= 10;

    let progress = 0;
    if (hasEmail) {
      progress += 45;
    }
    if (hasPassword) {
      progress += 35;
    }
    if (strongPassword) {
      progress += 20;
    }

    setLine(emailLine, hasEmail ? `input.email: ${shortEmail(email)}` : "input.email: ожидание...");
    setLine(
      passwordLine,
      hasPassword ? `input.password: ${maskPassword(password)} (${password.length})` : "input.password: ожидание...",
    );

    if (eventLine && statusLine) {
      if (!hasEmail && !hasPassword) {
        setLine(eventLine, "auth.event: ожидаем данные");
        setLine(statusLine, "статус: ожидание ввода");
      } else if (hasEmail && !hasPassword) {
        setLine(eventLine, "auth.event: email принят, ожидаем пароль");
        setLine(statusLine, "статус: введите пароль");
      } else if (!hasEmail && hasPassword) {
        setLine(eventLine, "auth.event: пароль принят, ожидаем email");
        setLine(statusLine, "статус: введите email");
      } else if (!strongPassword) {
        setLine(eventLine, "auth.event: пароль не проходит политику (<10)");
        setLine(statusLine, "статус: усильте пароль");
      } else {
        setLine(eventLine, "auth.event: данные готовы, можно отправлять");
        setLine(statusLine, "статус: готово к отправке");
      }
    }

    setProgress(progress);
  };

  const updateRegisterScene = () => {
    const nick = nickInput ? nickInput.value.trim() : "";
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput ? confirmInput.value : "";

    const hasNick = nick.length > 0;
    const hasEmail = email.length > 0;
    const hasPassword = password.length > 0;
    const hasConfirm = confirmPassword.length > 0;
    const strongPassword = password.length >= 10;
    const passwordsMatch = hasPassword && hasConfirm && password === confirmPassword;

    let progress = 0;
    if (hasNick) {
      progress += 25;
    }
    if (hasEmail) {
      progress += 25;
    }
    if (hasPassword) {
      progress += 20;
    }
    if (hasConfirm) {
      progress += 20;
    }
    if (strongPassword) {
      progress += 5;
    }
    if (passwordsMatch) {
      progress += 5;
    }

    setLine(nickLine, hasNick ? `input.nick: ${shortNick(nick)}` : "input.nick: ожидание...");
    setLine(emailLine, hasEmail ? `input.email: ${shortEmail(email)}` : "input.email: ожидание...");
    setLine(
      passwordLine,
      hasPassword ? `input.password: ${maskPassword(password)} (${password.length})` : "input.password: ожидание...",
    );

    if (hasConfirm) {
      if (!hasPassword) {
        setLine(confirmLine, "input.confirm_password: введено");
      } else if (passwordsMatch) {
        setLine(confirmLine, "input.confirm_password: совпадает");
      } else {
        setLine(confirmLine, "input.confirm_password: не совпадает");
      }
    } else {
      setLine(confirmLine, "input.confirm_password: ожидание...");
    }

    if (!hasNick && !hasEmail && !hasPassword && !hasConfirm) {
      setLine(eventLine, "auth.event: ожидаем данные");
      setLine(statusLine, "статус: ожидание ввода");
    } else if (!hasNick) {
      setLine(eventLine, "auth.event: ожидаем ник");
      setLine(statusLine, "статус: введите ник");
    } else if (!hasEmail) {
      setLine(eventLine, "auth.event: ожидаем email");
      setLine(statusLine, "статус: введите email");
    } else if (!hasPassword) {
      setLine(eventLine, "auth.event: ожидаем пароль");
      setLine(statusLine, "статус: введите пароль");
    } else if (!strongPassword) {
      setLine(eventLine, "auth.event: пароль не проходит политику (<10)");
      setLine(statusLine, "статус: усильте пароль");
    } else if (!hasConfirm) {
      setLine(eventLine, "auth.event: ожидаем подтверждение пароля");
      setLine(statusLine, "статус: подтвердите пароль");
    } else if (!passwordsMatch) {
      setLine(eventLine, "auth.event: пароли не совпадают");
      setLine(statusLine, "статус: проверьте подтверждение");
    } else {
      setLine(eventLine, "auth.event: данные готовы, можно отправлять");
      setLine(statusLine, "статус: готово к регистрации");
    }

    setProgress(progress);
  };

  const updateScene = () => {
    if (mode === "register") {
      updateRegisterScene();
      return;
    }
    updateLoginScene();
  };

  if (nickInput) {
    nickInput.addEventListener("input", updateScene);
  }
  if (confirmInput) {
    confirmInput.addEventListener("input", updateScene);
  }
  emailInput.addEventListener("input", updateScene);
  passwordInput.addEventListener("input", updateScene);
  window.addEventListener("resize", updateScene);

  updateScene();
})();
