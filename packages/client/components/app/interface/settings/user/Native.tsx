import { createSignal, onMount } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { useModals } from "@revolt/modal";
import { CategoryButton, Checkbox, Column } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

declare type DesktopConfig = {
  firstLaunch: boolean;
  customFrame: boolean;
  minimiseToTray: boolean;
  startMinimisedToTray: boolean;
  spellchecker: boolean;
  hardwareAcceleration: boolean;
  discordRpc: boolean;
  enableDevtoolsUntilTimestamp: number;
  windowState: {
    isMaximised: boolean;
  };
};

declare global {
  interface Window {
    native: {
      versions: {
        node(): string;
        chrome(): string;
        electron(): string;
        desktop(): string;
      };
      minimise(): void;
      maximise(): void;
      close(): void;
    };

    desktopConfig: {
      get(): DesktopConfig;
      set(config: Partial<DesktopConfig>): void;
      getAutostart(): Promise<boolean>;
      setAutostart(value: boolean): Promise<boolean>;
    };
  }
}

/**
 * Desktop Configuration Page
 */
export default function Native() {
  const { t } = useLingui();
  const [autostart, setAutostart] = createSignal(false);
  const [config, setConfig] = createSignal(window.desktopConfig.get());
  const { openModal } = useModals();

  function set(config: Partial<DesktopConfig>) {
    window.desktopConfig.set(config);
    setConfig((conf) => ({ ...conf, ...config }));
  }

  onMount(async () => {
    const value = await window.desktopConfig.getAutostart();
    setAutostart(value);
  });

  async function toggleAutostart() {
    const newValue = !autostart();
    const savedValue = await window.desktopConfig.setAutostart(newValue);
    setAutostart(savedValue);
  }

  let solidJsSucks = false;

  const toggles: Partial<Record<keyof DesktopConfig, () => void>> = {
    minimiseToTray: () => set({ minimiseToTray: !config().minimiseToTray }),
    startMinimisedToTray: () =>
      set({ startMinimisedToTray: !config().startMinimisedToTray }),
    customFrame: () => set({ customFrame: !config().customFrame }),
    discordRpc: () => set({ discordRpc: !config().discordRpc }),
    spellchecker: () => set({ spellchecker: !config().spellchecker }),
    enableDevtoolsUntilTimestamp: () => {
      if (config().enableDevtoolsUntilTimestamp > Date.now()) {
        set({ enableDevtoolsUntilTimestamp: 0 });
        return;
      }

      // When you press the checkbox itself, it makes two modals for some reason?
      // If you have an actual fix (instead of this), please do tell me!
      if (solidJsSucks) return;
      solidJsSucks = true;
      setTimeout(() => (solidJsSucks = false));

      openModal({
        type: "enable_devtools",
        enableDevtools: (until) => set({ enableDevtoolsUntilTimestamp: until }),
      });
    },
    hardwareAcceleration: () =>
      set({ hardwareAcceleration: !config().hardwareAcceleration }),
  };

  function CheckboxButton<K extends keyof DesktopConfig>(
    key: K,
    icon: string,
    label: string,
    description: string,
    checkedFunc?: (value: DesktopConfig[K]) => boolean,
  ) {
    let checked: DesktopConfig[K] | boolean = config()[key];
    if (checkedFunc) {
      checked = checkedFunc(checked);
    }

    return (
      <CategoryButton
        action={<Checkbox checked={!!checked} />}
        onClick={() => toggles[key]!()}
        icon={<Symbol>{icon}</Symbol>}
        description={description}
      >
        {label}
      </CategoryButton>
    );
  }

  return (
    <Column gap="lg">
      <CategoryButton.Group>
        <CategoryButton
          action={<Checkbox checked={autostart()} onChange={toggleAutostart} />}
          onClick={toggleAutostart}
          icon={<Symbol>exit_to_app</Symbol>}
          description={
            <Trans>Launch Stoat when you log into your computer.</Trans>
          }
        >
          <Trans>Start with Computer</Trans>
        </CategoryButton>
        {autostart() &&
          CheckboxButton(
            "startMinimisedToTray",
            "minimize",
            t`Start Minimised to Tray`,
            t`Stoat will start in the system tray.`,
          )}
        {CheckboxButton(
          "minimiseToTray",
          "cancel_presentation",
          t`Minimise to Tray`,
          t`Instead of closing, Stoat will hide in your tray.`,
        )}
        {CheckboxButton(
          "customFrame",
          "web_asset",
          t`Custom window frame`,
          t`Let Stoat use its own custom titlebar.`,
        )}
      </CategoryButton.Group>

      <CategoryButton.Group>
        {CheckboxButton(
          "discordRpc",
          "groups_2",
          t`Discord RPC`,
          t`Rep Stoat using Discord rich presence.`,
        )}
        {CheckboxButton(
          "spellchecker",
          "spellcheck",
          t`Spellchecker`,
          t`Show corrections and suggestions as you type.`,
        )}
        {CheckboxButton(
          "hardwareAcceleration",
          "speed",
          t`Hardware Acceleration`,
          t`Use the graphics card to improve performance.`,
        )}
      </CategoryButton.Group>

      <CategoryButton.Group>
        {CheckboxButton(
          "enableDevtoolsUntilTimestamp",
          "warning_amber",
          t`Temporarily Enable Devtools`,
          t`Allows you to temporarily use the Chromium Developer Tools.`,
          (timestamp) => timestamp > Date.now(),
        )}
      </CategoryButton.Group>

      <CategoryButton.Group>
        <CategoryButton
          icon={<Symbol>desktop_windows</Symbol>}
          description={
            <>
              <Trans>Version:</Trans> {window.native.versions.desktop()}
            </>
          }
        >
          <Trans>Stoat for Desktop</Trans>
        </CategoryButton>
      </CategoryButton.Group>
    </Column>
  );
}
