// Live date in the top card: "D M YY" (no leading zeros)
function renderDate() {
  const el = document.getElementById("date");
  if (!el) return;
  const now = new Date();
  const d = now.getDate();
  const m = now.getMonth() + 1;
  const y = String(now.getFullYear()).slice(-2);
  el.textContent = `${d} ${m} ${y}`;
}

// Information overlay open/close
function bindInfo() {
  const info = document.getElementById("info");
  const open = document.getElementById("open-info");
  const close = document.getElementById("close-info");
  if (!info || !open || !close) return;

  const setOpen = (isOpen) => {
    info.setAttribute("aria-hidden", isOpen ? "false" : "true");
    document.body.style.overflow = isOpen ? "hidden" : "";
  };

  open.addEventListener("click", () => setOpen(true));
  close.addEventListener("click", () => setOpen(false));

  // Esc closes the overlay
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && info.getAttribute("aria-hidden") === "false") {
      setOpen(false);
    }
  });
}

// Tick at midnight so the date stays current on long-open tabs
function scheduleMidnightTick() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 1, 0); // 00:00:01 tomorrow
  const ms = next - now;
  setTimeout(() => {
    renderDate();
    scheduleMidnightTick();
  }, ms);
}

document.addEventListener("DOMContentLoaded", () => {
  renderDate();
  bindInfo();
  scheduleMidnightTick();
});
