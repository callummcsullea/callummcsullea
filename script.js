// Live date in the top card: "D M YY" (no leading zeros)
function renderDate() {
  const el = document.getElementById("date");
  if (!el) return;
  const now = new Date();
  const d = now.getDate();
  const m = now.getMonth() + 1;
  const y = String(now.getFullYear()).slice(-2);
  el.textContent = `${d} ${m} ${y}`;
  el.style.visibility = "visible";
}

// Information overlay open/close
function bindInfo() {
  const info = document.getElementById("info");
  const open = document.getElementById("open-info");
  const close = document.getElementById("close-info");
  if (!info || !open || !close) return;

  const setOpen = (isOpen) => {
    info.setAttribute("aria-hidden", isOpen ? "false" : "true");
    document.body.style.overflow = isOpen ? "auto" : "";
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

// Favicon swaps based on tab visibility
function bindFavicon() {
  const favicon = document.getElementById("favicon");
  const active = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐣</text></svg>";
  const inactive = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🥚</text></svg>";
  document.addEventListener("visibilitychange", () => {
    favicon.href = document.hidden ? inactive : active;
  });
}
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

// Mobile card tap — toggle between date card and info card
function bindCardFlip() {
  const cards = document.querySelector(".cards");
  if (!cards) return;
  cards.addEventListener("click", (e) => {
    cards.classList.toggle("cards--flipped");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderDate();
  bindInfo();
  bindCardFlip();
  bindFavicon();
  scheduleMidnightTick();
});
