# Using the State

The state is available anywhere inside the StateContext. You can only use the state inside a solid component, and if you need it outside a solid component it must be passed as a variable.

You can use the state by using the `useState` hook. The `useState` hook returns an object that contains all state stores. When using it inside a component, you should favor destructing the object and using the substates you need instead of the whole state.

```typescript
import { createEffect } from "solid-js";

import { useState } from "@revolt/state";

function ExampleComponent() {
  // The useState hook returns an object that contains all state stores. There
  // are many state stores available.
  // const state = useState();
  const { auth } = useState();

  createEffect(() => {
    console.log("Auth state changed! New state: ", auth);
  });
}
```

The state is backed by Solid stores, so it is fully reactive. Any change in the state will result in reactive updates across the entire application.

## Available State Stores

Currently, the following state stores are available:

- auth
- draft
- experiments
- keybinds
- layout
- linkSafety
- locale
- notifications
- ordering
- release-notes
- settings
- sounds
- sync
- theme
- voice

Notable states should have a documentation page explaining them.

## State Syncing

Some state stores are synced with the backend. Currently, the following state stores are synced:

- notifications
- ordering
- release-notes

Synced stores are fetched on login and merged with existing stores. Sync stores will also upload to the backend when changed locally. To add a store to be synced, you must modify stores/Sync.ts to account for the new store. Any store that is to be synced must export it's `get` function. See existing synced stores for guidance.

Synced stores need to be refactored. When done so, this documentation should get updated to reflect new method for syncing stores.

## Miscellaneous State Technicals

The state is stored to the client device using the IndexDB. All state stores are stored under a single DB named `localforage` in the table `keyvaluepairs`.

The state is not implicitly cleared on login or logout. If a state store should be cleared on login or logout it must be explicitly done so in the client controller.
