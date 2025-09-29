import { Trans } from "@lingui-solid/solid/macro";

import {
  CategoryButton,
  CategoryButtonGroup,
  Checkbox,
  Column,
  iconSize,
} from "@revolt/ui";

import MdCancelPresentation from "@material-design-icons/svg/outlined/cancel_presentation.svg?component-solid";
import MdDesktopWindows from "@material-design-icons/svg/outlined/desktop_windows.svg?component-solid";
import MdExitToApp from "@material-design-icons/svg/outlined/exit_to_app.svg?component-solid";
import MdWebAsset from "@material-design-icons/svg/outlined/web_asset.svg?component-solid";

/**
 * Desktop Configuration Page
 */
export default function Native() {
  return (
    <Column gap="lg">
      <CategoryButtonGroup>
        <CategoryButton
          action={<Checkbox checked onChange={(value) => void value} />}
          onClick={() => void 0}
          icon={<MdExitToApp {...iconSize(22)} />}
          description={
            <Trans>Launch Stoat when you log into your computer.</Trans>
          }
        >
          <Trans>Start with Computer</Trans>
        </CategoryButton>
        <CategoryButton
          action={<Checkbox checked onChange={(value) => void value} />}
          onClick={() => void 0}
          icon={<MdCancelPresentation {...iconSize(22)} />}
          description={
            <Trans>Instead of closing, Stoat will hide in your tray.</Trans>
          }
        >
          <Trans>Minimise to Tray</Trans>
        </CategoryButton>
      </CategoryButtonGroup>
      <CategoryButtonGroup>
        <CategoryButton
          action={<Checkbox checked onChange={(value) => void value} />}
          onClick={() => void 0}
          icon={<MdWebAsset {...iconSize(22)} />}
          description={<Trans>Let Stoat use its own custom titlebar.</Trans>}
        >
          <Trans>Custom window frame</Trans>
        </CategoryButton>
      </CategoryButtonGroup>
      <CategoryButtonGroup>
        <CategoryButton
          icon={<MdDesktopWindows {...iconSize(22)} />}
          description="Version 1.0.0"
        >
          <Trans>Stoat Desktop</Trans>
        </CategoryButton>
      </CategoryButtonGroup>
    </Column>
  );
}
