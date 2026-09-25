interface Window {
  /** Cached result of beforeinstallprompt event */
  _PwaP?:
    | BeforeInstallPromptEvent
    | ((v: BeforeInstallPromptEvent | undefined) => void);
  /** Cached result of appinstalled event */
  _PwaI?: boolean | ((v: boolean) => void);
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}
