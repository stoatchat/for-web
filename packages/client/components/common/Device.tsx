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

  private pMedia;
  private tMedia;
  private setLayout;

  constructor() {
    this.isMobile = isMobileBrowser();

    const [lo, setLo] = createSignal<Layout>("desktop");
    this.layout = lo;
    this.setLayout = setLo;

    this.pMedia = matchMedia(Breakpoint.phone);
    this.tMedia = matchMedia(Breakpoint.tablet);
    (this.pMedia.onchange = this.tMedia.onchange = this.onLayout.bind(this))();
  }

  onLayout() {
    this.setLayout(
      this.pMedia.matches
        ? "phone"
        : this.tMedia.matches
          ? "tablet"
          : "desktop",
    );
  }

  destroy() {
    this.pMedia.onchange = this.tMedia.onchange = null;
  }
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
