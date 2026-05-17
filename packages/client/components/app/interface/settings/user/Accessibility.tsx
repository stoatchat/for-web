import { Trans } from "@lingui-solid/solid/macro";
import { useState } from "@revolt/state";
import { CategoryButton, Checkbox, Column } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * Accessibility settings page
 */
export default function Accessibility() {
  const state = useState();

  const autoplayGifOnHover = () =>
    state.settings.getValue("accessibility:autoplay_gif_on_hover") ?? false;

  return (
    <Column gap="lg">
      <CategoryButton.Group>
        <CategoryButton
          icon={<Symbol>gif_box</Symbol>}
          action={
            <div onClick={(e: MouseEvent) => e.stopPropagation()}>
              <Checkbox
                checked={autoplayGifOnHover()}
                onChange={(e) =>
                  state.settings.setValue(
                    "accessibility:autoplay_gif_on_hover",
                    e.currentTarget.checked,
                  )
                }
              />
            </div>
          }
          description={
            <Trans>
              Embeded Gif's will only play when the mouse hovers over them.
            </Trans>
          }
          onClick={() =>
            state.settings.setValue(
              "accessibility:autoplay_gif_on_hover",
              !autoplayGifOnHover(),
            )
          }
        >
          <Trans>Only play GIFs when mouse hovers over</Trans>
        </CategoryButton>
      </CategoryButton.Group>
    </Column>
  );
}

/* <CategoryButtonGroup>
        <FormGroup>
          <CategoryButton
            action={<Checkbox value onChange={(value) => void value} />}
            onClick={() => void 0}
            icon={<MdAnimation {...iconSize(22)} />}
            description={
              <Trans>
                If this is enabled, animations and motion effects won't play or
                will be less intense.
              </Trans>
            }
          >
            <Trans>Reduced Motion</Trans>
          </CategoryButton>
        </FormGroup>
      </CategoryButtonGroup> */
