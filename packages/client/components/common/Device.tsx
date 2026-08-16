import {
  Accessor,
  createContext,
  createSignal,
  JSX,
  onCleanup,
  useContext,
} from "solid-js";

import { isMobileBrowser } from "@livekit/components-core";
import Breakpoint from "./Breakpoint";

export type Layout = "desktop" | "tablet" | "phone";

declare global {
  interface Navigator {
    virtualKeyboard?: {
      overlaysContent: boolean;
    };
  }
}

/** Device type and compatibility info */
export class Device {
  /** Layout type based on viewport size

   * **Note:** This is for advanced reactivity. If you only need to
   * adjust CSS, use the `_phone` and `_tablet` PandaCSS breakpoints. */
  readonly layout: Accessor<Layout>;

  /** Mobile device detection based on User Agent.

   * **Warning:** Don't use unless absolutely necessary.
   * Granular feature-detection is preferred when possible. */
  readonly isMobile: boolean;

  /** If Stoat is running as a web app */
  readonly isPWA =
    //Safari
    (window.navigator as never as { standalone: boolean }).standalone ||
    //Other
    window.matchMedia("(display-mode: standalone)").matches;

  /**
   * Whether this device is an IOS Touch device. Relies on useragent.
   *
   * **Warning:** Don't use unless absolutely necessary.
   * Granular feature-detection is preferred when possible.
   */
  readonly isIOSTouch = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  private pMedia;
  private tMedia;
  private setLayout;
  private wakeLock: WakeLockSentinel | undefined;

  constructor() {
    this.isMobile = isMobileBrowser();

    if (this.isIOSTouch) {
      // Load a long press event library to replace context menus on IOS touch
      //@ts-expect-error There are no types for this library.
      import("long-press-event");
      document.getElementsByTagName("body")[0].dataset.longPressDelay = "1000";
    }

    const [lo, setLo] = createSignal<Layout>("desktop");
    this.layout = lo;
    this.setLayout = setLo;

    this.pMedia = matchMedia(Breakpoint.phone);
    this.tMedia = matchMedia(Breakpoint.tablet);
    (this.pMedia.onchange = this.tMedia.onchange = this.onLayout)();

    if (this.isPWA && navigator.virtualKeyboard) {
      navigator.virtualKeyboard.overlaysContent = true;
    }
  }

  onLayout = () => {
    this.setLayout(
      this.pMedia.matches
        ? "phone"
        : this.tMedia.matches
          ? "tablet"
          : "desktop",
    );
  };

  destroy = () => {
    this.pMedia.onchange = this.tMedia.onchange = null;
  };

  get isWakeLocked(): boolean {
    return !!this.wakeLock && !this.wakeLock.released;
  }

  /**
   * Create a wake lock on the host device. The promise will reject if
   * acquiring the wake lock fails. You should release the lock after it is no
   * longer needed. Setting a wake lock will noop if there is already a wake
   * lock on the device.
   */
  setWakeLocked = async () => {
    // Noop if already wake locked
    if (this.isWakeLocked) {
      return;
    }

    this.wakeLock = await navigator.wakeLock.request("screen");
  };

  /**
   * Release the wake lock on the host device. Releasing the wake lock will
   * noop if there is no current wake lock.
   */
  releaseWakeLock = async () => {
    // Noop if no wake lock
    if (!this.isWakeLocked) {
      return;
    }

    return this.wakeLock!.release();
  };
}

const deviceCtx = createContext<Device>(null! as Device);

/** Mount device context */
export function DeviceContext(props: { children: JSX.Element }) {
  const dev = new Device();
  onCleanup(dev.destroy);

  return <deviceCtx.Provider value={dev}>{props.children}</deviceCtx.Provider>;
}

/** Device type and compatibility info */
export const useDevice = () => useContext(deviceCtx);
