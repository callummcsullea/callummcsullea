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

// Mobile card tap + swipe — always rotates in same direction per side/direction
function bindCardFlip() {
  const inner = document.querySelector(".cards__inner");
  if (!inner) return;

  let rotationX = 0;
  let touchStartX = null;
  let touchStartY = null;

  function flip(direction) {
    // direction: 'left' or 'right'
    const cards = document.querySelector(".cards");
    if (direction === "left") {
      rotationX -= 180;
    } else {
      rotationX += 180;
    }

    inner.style.transform = `translate(-50%, -50%) rotate(-90deg) scale(${(window.innerWidth - 32) / 227}) rotateX(${rotationX}deg)`;

    const isFlipped = Math.abs(rotationX % 360) === 180;
    cards.classList.remove("cards--flipped-left", "cards--flipped-right");
    if (isFlipped) {
      cards.classList.add(direction === "left" ? "cards--flipped-left" : "cards--flipped-right");
    }
  }

  // Tap
  inner.addEventListener("click", (e) => {
    if (inner._wasSwiped) { inner._wasSwiped = false; return; }
    const rect = inner.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    flip(e.clientX < midX ? "right" : "left");
  });

  // Swipe
  inner.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  inner.addEventListener("touchend", (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > 40 && absDx > absDy) {
      // Horizontal swipe — treat as flip
      inner._wasSwiped = true;
      flip(dx < 0 ? "right" : "left");
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
