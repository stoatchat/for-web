# Using Lingui

Import the macro package wherever you wish to use Lingui, prefer to use the JSX syntax:

```typescript
import { Trans } from "@lingui/solid/macro";

<Trans>Hi, I am a string!</Trans>

<Trans>There are {5} users in queue.</Trans>
```

But if necessary, you can use the hook where strings are needed:

```typescript
import { useLingui } from "@lingui/solid/macro";

const { t } = useLingui();

t`Hello, chat!`;

t`There are {3} people in your walls.`;
```

If your use case doesn't fit here, ask a maintainer for guidance.

## Plurals

Use the Plural component:

```typescript
import { Plural } from "@lingui/solid/macro";

<Plural
  value={5}
  one="# Member"
  other="# Members"
/>
```

Learn more in the [Lingui documentation](https://lingui.dev/guides/plurals).

## Updating catalogs

To update the catalogs, one must run:

```bash
mise lingui
```

This runs `mise lingui:extract` followed by `mise lingui:compile`.

**NB. don't run this yourself!** \
A maintainer will do this regularly & after merge down to `main`!
