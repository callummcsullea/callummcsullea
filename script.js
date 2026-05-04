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

// Tick at midnight so the date stays current on long-open tabs
function scheduleMidnightTick() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 1, 0);
  const ms = next - now;
  setTimeout(() => {
    renderDate();
    scheduleMidnightTick();
  }, ms);
}

// Card flip — 3D rotation, direction-based
function bindCardFlip() {
  const inner = document.querySelector(".cards__inner");
  if (!inner) return;

  let rotationX = 0; // mobile Y-axis (up/down swipe)
  let rotationZ = 0; // mobile X-axis (left/right swipe)
  let rotationY = 0; // desktop
  let touchStartX = null;
  let touchStartY = null;

  function applyMobileTransform() {
    const scale = (window.innerWidth - 32) / 227;
    inner.style.transform = `translate(-50%, -50%) rotate(-90deg) scale(${scale}) rotateY(${rotationX}deg) rotateX(${rotationZ}deg)`;
  }

  function flip(direction) {
    const cards = document.querySelector(".cards");
    const isMobile = window.matchMedia("(max-width: 430px) and (orientation: portrait)").matches;

    if (isMobile) {
      if (direction === "up")    rotationX += 180;
      if (direction === "down")  rotationX -= 180;
      if (direction === "left")  rotationZ -= 180;
      if (direction === "right") rotationZ += 180;
      applyMobileTransform();
      const isFlipped = Math.abs(rotationX % 360) === 180 || Math.abs(rotationZ % 360) === 180;
      cards.classList.remove("cards--flipped-left", "cards--flipped-right");
      if (isFlipped) cards.classList.add("cards--flipped-right");
    } else {
      if (direction === "left" || direction === "up") {
        rotationY -= 180;
      } else {
        rotationY += 180;
      }
      inner.style.transform = `rotateY(${rotationY}deg)`;
      const isFlipped = Math.abs(rotationY % 360) === 180;
      cards.classList.remove("cards--flipped-left", "cards--flipped-right");
      if (isFlipped) cards.classList.add(direction === "left" ? "cards--flipped-left" : "cards--flipped-right");
    }
  }

  // Tap on inner (mobile) or home (desktop)
  inner.addEventListener("click", (e) => {
    if (inner._wasSwiped) { inner._wasSwiped = false; return; }
    const isMobile = window.matchMedia("(max-width: 430px) and (orientation: portrait)").matches;
    if (!isMobile) {
      const rect = inner.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      flip(e.clientX < midX ? "left" : "right");
      return;
    }
    const rect = inner.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    flip(e.clientY < midY ? "up" : "down");
  });

  inner.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
  }, { passive: false });

  inner.addEventListener("touchend", (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const isMobile = window.matchMedia("(max-width: 430px) and (orientation: portrait)").matches;

    if (isMobile) {
      if (absDy > 40 && absDy > absDx) {
        flip(dy < 0 ? "up" : "down");
      } else if (absDx > 40 && absDx > absDy) {
        flip(dx < 0 ? "left" : "right");
      } else if (absDx < 10 && absDy < 10) {
        const rect = inner.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        flip(e.changedTouches[0].clientY < midY ? "up" : "down");
      }
    } else {
      if (absDx > 40 && absDx > absDy) {
        flip(dx < 0 ? "right" : "left");
      }
    }
    touchStartX = null;
    touchStartY = null;
  }, { passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  renderDate();
  bindInfo();
  bindCardFlip();
  bindFavicon();
  scheduleMidnightTick();
});
