import {
  Accessor,
  createContext,
  createSignal,
  JSX,
  onCleanup,
  useContext,
} from "solid-js";

import { isMobileBrowser } from "@livekit/components-core";

const style = getComputedStyle(document.body);

export type Layout = "desktop" | "tablet" | "phone";

/** Device type and compatibility info */
export class Device {
  /** Max width for phone layout */
  readonly phoneMaxWidth = style.getPropertyValue("--phone-max-width");

  /** Max width for tablet layout */
  readonly tabletMaxWidth = style.getPropertyValue("--tablet-max-width");

  /** Layout type based on viewport size */
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

    this.pMedia = matchMedia(`(max-width: ${this.phoneMaxWidth})`);
    this.tMedia = matchMedia(`(max-width: ${this.tabletMaxWidth})`);
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
