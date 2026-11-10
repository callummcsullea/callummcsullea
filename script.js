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
  // Set correct initial state
  favicon.href = document.hidden ? inactive : active;
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

  // Flip the card 180° along ONE axis only.
  // axis "y" = swipe up/down, axis "x" = swipe left/right; sign = swipe direction.
  function axisRotate(axis, sign) {
    const cards = document.querySelector(".cards");

    if (axis === "y") {
      // rotateY is the outer rotation, so it always turns in screen space.
      rotY -= sign * 180;
    } else {
      // rotateX sits inside rotateY. After an odd number of up/down flips the
      // card's X axis points the other way, so reverse the step to keep the
      // card turning in the direction of the finger.
      const yFlipped = (((rotY / 180) % 2) + 2) % 2 === 1;
      rotX -= (yFlipped ? -sign : sign) * 180;
    }

    applyMobileTransform();

    const normY = ((rotY % 360) + 360) % 360;
    const normX = ((rotX % 360) + 360) % 360;
    // Back face shows when exactly one axis is flipped
    const isFlipped = (normY === 180) !== (normX === 180);
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

  // Distance (px) a finger must move before the swipe locks to one axis
  const LOCK_THRESHOLD = 10;
  let lockedAxis = null; // null until locked, then "x" (left/right) or "y" (up/down)

  function resetTouch() {
    touchStartX = null;
    touchStartY = null;
    lockedAxis = null;
  }

  // Decide the axis once, from the dominant direction of the first movement
  function lockAxis(dx, dy) {
    if (lockedAxis) return;
    if (Math.abs(dx) < LOCK_THRESHOLD && Math.abs(dy) < LOCK_THRESHOLD) return;
    lockedAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
  }

  inner.addEventListener("touchstart", (e) => {
    if (e.touches.length > 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    lockedAxis = null;
    e.preventDefault();
  }, { passive: false });

  inner.addEventListener("touchmove", (e) => {
    if (touchStartX === null) return;
    lockAxis(e.touches[0].clientX - touchStartX, e.touches[0].clientY - touchStartY);
  }, { passive: true });

  inner.addEventListener("touchcancel", resetTouch, { passive: true });

  inner.addEventListener("touchend", (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // Fast flicks may end before any touchmove fired — lock from the end point
    lockAxis(dx, dy);
    // Only the locked axis counts; the other one is ignored entirely
    const along = lockedAxis === "x" ? dx : lockedAxis === "y" ? dy : 0;
    const isMobile = window.matchMedia("(max-width: 430px) and (orientation: portrait)").matches;

    if (isMobile) {
      if (lockedAxis) {
        // Swipe — clean 180° flip along the locked axis only
        if (Math.abs(along) >= LOCK_THRESHOLD) axisRotate(lockedAxis, Math.sign(along));
      } else {
        // Tap — flip up/down based on top/bottom half
        const rect = inner.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        axisRotate("y", e.changedTouches[0].clientY < midY ? -1 : 1);
      }
    } else {
      if (lockedAxis === "x" && Math.abs(dx) > 40) {
        flip(dx < 0 ? "right" : "left");
      }
    }
    resetTouch();
  }, { passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  renderDate();
  bindInfo();
  bindCardFlip();
  bindFavicon();
  scheduleMidnightTick();
});
