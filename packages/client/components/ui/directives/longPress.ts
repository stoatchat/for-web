const LONG_PRESS_DELAY = 500;
const MOVE_TOLERANCE = 10;
const CLICK_SUPPRESS_WINDOW = 400;

// Track pointer events so child triggers don't bubble duplicate menus to parents
const handledEvents = new WeakSet<PointerEvent>();

// Suppress synthetic click after releasing a long press
function suppressNextClick() {
  function suppress(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    cleanup();
  }

  function cleanup() {
    clearTimeout(timeout);
    document.removeEventListener("click", suppress, true);
  }

  document.addEventListener("click", suppress, true);
  const timeout = setTimeout(cleanup, CLICK_SUPPRESS_WINDOW);
}

/**
 * Listen for touch long presses on an element to emulate contextmenu on iOS
 */
export function addLongPressListener(
  element: HTMLElement,
  handler: (event: PointerEvent) => void,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let fired = false;
  let pointerId = -1;
  let startX = 0;
  let startY = 0;

  function stopTracking() {
    clearTimeout(timer);
    timer = undefined;
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerup", onPointerUp, true);
    document.removeEventListener("pointercancel", stopTracking, true);
    document.removeEventListener("scroll", stopTracking, true);
  }

  function onPointerMove(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    if (
      Math.abs(event.clientX - startX) > MOVE_TOLERANCE ||
      Math.abs(event.clientY - startY) > MOVE_TOLERANCE
    ) {
      stopTracking();
    }
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    stopTracking();
    if (fired) suppressNextClick();
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType !== "touch" || !event.isPrimary) return;

    stopTracking();
    fired = false;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;

    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", stopTracking, true);
    document.addEventListener("scroll", stopTracking, true);

    timer = setTimeout(() => {
      timer = undefined;
      if (handledEvents.has(event)) return;

      handledEvents.add(event);
      fired = true;
      handler(event);
    }, LONG_PRESS_DELAY);
  }

  element.addEventListener("pointerdown", onPointerDown);

  return () => {
    element.removeEventListener("pointerdown", onPointerDown);
    stopTracking();
  };
}
