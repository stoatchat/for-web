import { createSignal } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";

import { CategoryButton, Checkbox, Column } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

declare type DesktopConfig = {
  firstLaunch: boolean;
  customFrame: boolean;
  minimiseToTray: boolean;
  spellchecker: boolean;
  hardwareAcceleration: boolean;
  discordRpc: boolean;
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
      getAutostart(): boolean;
      setAutostart(value: boolean): void;
    };
  }
}

/**
 * Desktop Configuration Page
 */
export default function Native() {
  const [autostart, setAutostart] = createSignal(
    window.desktopConfig.getAutostart(),
  );
  const [config, setConfig] = createSignal(window.desktopConfig.get());

  function set(config: Partial<DesktopConfig>) {
    window.desktopConfig.set(config);
    setConfig((conf) => ({ ...conf, ...config }));
  }

  return (
    <Column gap="lg">
      <CategoryButton.Group>
        <CategoryButton
          action={<Checkbox checked={autostart()} />}
          onClick={() =>
            setAutostart((value) => {
              window.desktopConfig.setAutostart(!value);
              return !value;
            })
          }
          icon={<Symbol>exit_to_app</Symbol>}
          description={
            <Trans>Launch Stoat when you log into your computer.</Trans>
          }
        >
          <Trans>Start with Computer</Trans>
        </CategoryButton>
        <CategoryButton
          action={<Checkbox checked={config().minimiseToTray} />}
          onClick={() =>
            set({
              minimiseToTray: !config().minimiseToTray,
            })
          }
          icon={<Symbol>cancel_presentation</Symbol>}
          description={
            <Trans>Instead of closing, Stoat will hide in your tray.</Trans>
          }
        >
          <Trans>Minimise to Tray</Trans>
        </CategoryButton>
        <CategoryButton
          action={<Checkbox checked={config().customFrame} />}
          onClick={() =>
            set({
              customFrame: !config().customFrame,
            })
          }
          icon={<Symbol>web_asset</Symbol>}
          description={<Trans>Let Stoat use its own custom titlebar.</Trans>}
        >
          <Trans>Custom window frame</Trans>
        </CategoryButton>
      </CategoryButton.Group>

      <CategoryButton.Group>
        <CategoryButton
          action={<Checkbox checked={config().discordRpc} />}
          onClick={() =>
            set({
              discordRpc: !config().discordRpc,
            })
          }
          icon={<Symbol>groups_2</Symbol>}
          description={<Trans>Rep Stoat using Discord rich presence.</Trans>}
        >
          <Trans>Discord RPC</Trans>
        </CategoryButton>
        <CategoryButton
          action={<Checkbox checked={config().spellchecker} />}
          onClick={() =>
            set({
              spellchecker: !config().spellchecker,
            })
          }
          icon={<Symbol>spellcheck</Symbol>}
          description={
            <Trans>Show corrections and suggestions as you type.</Trans>
          }
        >
          <Trans>Spellchecker</Trans>
        </CategoryButton>
        <CategoryButton
          action={<Checkbox checked={config().spellchecker} />}
          onClick={() =>
            set({
              spellchecker: !config().spellchecker,
            })
          }
          icon={<Symbol>speed</Symbol>}
          description={
            <Trans>Use the graphics card to improve performance.</Trans>
          }
        >
          <Trans>Hardware Acceleration</Trans>
        </CategoryButton>
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
