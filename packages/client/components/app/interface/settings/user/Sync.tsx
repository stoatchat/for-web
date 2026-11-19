import { Trans } from "@lingui/solid/macro";

import { CategoryButton, Checkbox, Column, Symbol, Time } from "@revolt/ui";

/**
 * Sync Configuration Page
 */
export default function Sync() {
  return (
    <Column gap="lg">
      <CategoryButton.Group>
        <CategoryButton
          action={<Checkbox checked onChange={(value) => void value} />}
          onClick={() => void 0}
          icon={<Symbol size={22}>palette</Symbol>}
          description={
            <Trans>
              Sync appearance options, such as chosen emoji pack and message
              density.
            </Trans>
          }
        >
          <Trans>Appearance</Trans>
        </CategoryButton>
        <CategoryButton
          action={<Checkbox checked onChange={(value) => void value} />}
          onClick={() => void 0}
          icon={<Symbol size={22}>brush</Symbol>}
          description={
            <Trans>Sync your chosen theme, colours, and any custom CSS.</Trans>
          }
        >
          <Trans>Theme</Trans>
        </CategoryButton>
        <CategoryButton
          action={<Checkbox checked onChange={(value) => void value} />}
          onClick={() => void 0}
          icon={<Symbol size={22}>language</Symbol>}
          description={<Trans>Sync your currently chosen language.</Trans>}
        >
          <Trans>Language</Trans>
        </CategoryButton>
      </CategoryButton.Group>
      <CategoryButton.Group>
        <CategoryButton>
          <Trans>
            Last sync <Time format="relative" value={0} />
          </Trans>
        </CategoryButton>
      </CategoryButton.Group>
    </Column>
  );
}
