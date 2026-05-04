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

  let rotX = 0; // cumulative X rotation (up/down tilt)
  let rotY = 0; // cumulative Y rotation (left/right spin)
  let rotationY = 0; // desktop only
  let touchStartX = null;
  let touchStartY = null;

  function applyMobileTransform() {
    const scale = (window.innerWidth - 32) / 227;
    inner.style.transform = `translate(-50%, -50%) rotate(-90deg) scale(${scale}) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
  }

  function flip(direction) {
    const cards = document.querySelector(".cards");
    const isMobile = window.matchMedia("(max-width: 430px) and (orientation: portrait)").matches;

    if (!isMobile) {
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

  function freeRotate(dx, dy) {
    const cards = document.querySelector(".cards");
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) return;

    // Normalise swipe vector, apply 180° split across both axes
    const nx = dx / dist;
    const ny = dy / dist;

    rotY += nx * 180;
    rotX -= ny * 180;

    applyMobileTransform();

    const normY = ((rotY % 360) + 360) % 360;
    const normX = ((rotX % 360) + 360) % 360;
    const isFlipped = (normY > 90 && normY < 270) || (normX > 90 && normX < 270);
    cards.classList.remove("cards--flipped-left", "cards--flipped-right");
    if (isFlipped) cards.classList.add("cards--flipped-right");
  }

  // Tap on inner (mobile) or home (desktop)
  inner.addEventListener("click", (e) => {
    if (inner._wasSwiped) { inner._wasSwiped = false; return; }
    const isMobile = window.matchMedia("(max-width: 430px) and (orientation: portrait)").matches;
    if (!isMobile) {
      // Desktop — left/right of card determines direction
      const rect = inner.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      flip(e.clientX < midX ? "left" : "right");
      return;
    }
    const rect = inner.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    flip(e.clientY < midY ? "right" : "left");
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
      if (absDx > 10 || absDy > 10) {
        // Any swipe — free rotate based on vector
        freeRotate(dx, dy);
      } else {
        // Tap — snap 180° on Y axis based on top/bottom
        const rect = inner.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        freeRotate(0, e.changedTouches[0].clientY < midY ? -180 : 180);
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
