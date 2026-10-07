(() => {
  const origins = ["http://localhost:3000", "http://127.0.0.1:3000"];
  let root,
    panel,
    hud,
    timer,
    latest = {};
  const ask = async (message) => {
    try {
      const result = await chrome.runtime.sendMessage(message);
      if (!result?.success)
        throw new Error(result?.error || "Extension unavailable");
      return result;
    } catch (error) {
      if (panel) {
        const el = panel.querySelector('[role="status"]');
        if (el) el.textContent = error.message;
      }
      return {
        success: false,
        error: error.message || "Extension unavailable",
      };
    }
  };
  function mount() {
    if (root) return;
    const host = document.createElement("div");
    host.id = "focusguard-ui";
    host.style.cssText =
      "all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483647";
    root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `*{box-sizing:border-box} .shade{position:fixed;inset:0;background:#18181cf2;display:grid;place-items:center;pointer-events:auto;padding:24px;font:16px system-ui;color:#26262b} .box{width:min(470px,100%);padding:32px;background:#fffdf9;border:1px solid #d8d4ce;border-radius:16px} h2{font-size:29px;margin:12px 0}p{line-height:1.65;color:#66656b;font-size:14px}button{font:600 14px system-ui;border:1px solid #d8d4ce;border-radius:6px;padding:12px 16px;cursor:pointer;background:#e46036;color:#ffffff;margin:8px 8px 0 0}button.secondary{background:transparent;color:#e46036} .hud{position:fixed;bottom:18px;right:18px;background:#fffdf9;color:#25252a;border:1px solid #d8d4ce;border-radius:7px;padding:9px 12px;font:12px system-ui;pointer-events:none}small{color:#78777d} [role=status]{color:#bf492c}`;
    root.append(style);
    hud = document.createElement("div");
    hud.className = "hud";
    root.append(hud);
    document.documentElement.append(host);
  }
  function element(tag, text) {
    const el = document.createElement(tag);
    el.textContent = text;
    return el;
  }
  function render(message) {
    latest = { ...latest, ...message };
    if (!document.documentElement) {
      addEventListener("DOMContentLoaded", () => render(latest), {
        once: true,
      });
      return;
    }
    mount();
    const active = latest.isSessionActive ?? latest.active;
    hud.hidden = !active;
    clearInterval(timer);
    const tick = () => {
      const remaining = latest.phaseEndsAt
        ? Math.max(0, Math.ceil((latest.phaseEndsAt - Date.now()) / 1000))
        : Math.max(
            0,
            Math.floor(
              (Date.now() - (latest.sessionStartMs || Date.now())) / 1000,
            ),
          );
      hud.textContent = `FocusGuard · ${latest.phase === "break" ? "Break" : "Focus"} · ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
    };
    tick();
    if (active) timer = setInterval(tick, 1000);
    if (!active || latest.phase === "break" || !latest.kind) {
      panel?.remove();
      panel = null;
      return;
    }
    panel?.remove();
    panel = document.createElement("section");
    panel.className = "shade";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "FocusGuard focus reminder");
    const box = document.createElement("div");
    box.className = "box";
    box.append(
      element("small", "FOCUSGUARD"),
      element(
        "h2",
        latest.kind === "ask"
          ? "Is this part of your task?"
          : latest.kind === "pause"
            ? "One tab at a time."
            : "This site can wait.",
      ),
      element(
        "p",
        latest.kind === "pause"
          ? "You switched tabs several times in a few seconds. Take a moment before continuing."
          : `${location.hostname} is on your ${latest.kind === "ask" ? "ask-first" : "blocked"} list.`,
      ),
    );
    const status = element("p", "");
    status.setAttribute("role", "status");
    box.append(status);
    const button = (label, action, secondary = false) => {
      const b = element("button", label);
      if (secondary) b.className = "secondary";
      b.onclick = action;
      box.append(b);
      return b;
    };
    if (latest.kind === "pause")
      button("Return to my task", () => {
        panel?.remove();
        panel = null;
        latest.kind = null;
      });
    else if (latest.kind === "ask" || !latest.hardMode)
      button(
        latest.kind === "ask" ? "Yes, temporarily allow" : "Temporarily allow",
        async () => {
          await ask({ type: "ALLOW_HOST" });
        },
      );
    if (latest.kind === "ask")
      button(
        "No, keep it blocked",
        () => ask({ type: "WORK_CHECK_RESPONSE", doingWork: false }),
        true,
      );
    box.append(
      element(
        "p",
        "Use the FocusGuard toolbar popup to stop the session or change your rules.",
      ),
    );
    panel.append(box);
    root.append(panel);
    box.querySelector("button")?.focus();
  }
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "FG_STATE") render(message);
    if (message.type === "SESSION_STATUS") render({ ...message, kind: null });
  });
  // Only the explicitly supported local companion may control sessions or request analytics.
  window.addEventListener("message", async (event) => {
    if (
      event.source !== window ||
      event.origin !== location.origin ||
      !origins.includes(location.origin) ||
      window.top !== window
    )
      return;
    const data = event.data;
    if (
      data?.source !== "focusguard" ||
      ![
        "GET_STATUS",
        "SET_SESSION_STATUS",
        "SET_SETTINGS",
        "OPEN_DASHBOARD",
      ].includes(data.type)
    )
      return;
    const res = await ask(data);
    window.postMessage(
      {
        source: "focusguard-extension",
        requestId: data.requestId,
        type: "STATUS",
        data: res,
      },
      location.origin,
    );
  });
  ask({ type: "CS_READY" }).then((res) => {
    if (res?.success) render(res);
  });
})();
