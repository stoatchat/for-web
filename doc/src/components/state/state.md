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
- server-folders
- settings
- sounds
- sync
- theme
- voice

Notable states should have a documentation page explaining them.

## State Syncing

Any state store that extends `AbstractSyncedStore` will be synced with the backend. Currently, the following state stores are synced:

- notifications
- ordering
- release-notes
- server-folders

Synced stores are fetched on login and merged with existing stores. Sync stores will also upload to the backend when changed locally.

## Global Stores

Most state stores are _user_ stores, but some are _global_, meaning that their contents remain the same regardless of the logged in user or current instance- even when no user session is present at all. Unlike synced stores, they are still local to the specific client/device.

Currently, the following stores are global:

- auth

In order to declare a store implementation as global, call the `AbstractStore` super constructor with `global` set to true.

> [!NOTE]
> Like all stores, global stores still require you to be within StateContext in order to read them. StateContext will prevent anything beneath it from rendering until global stores are hydrated from disk, but user stores may initially be configured to default values, until the [Client Lifecycle](../client/session-lifecycle.md) reaches **State.Connected**.

## Miscellaneous State Technicals

Stores are written to the user's device using IndexedDB via the LocalForage library. IndexedDB was chosen over LocalStorage due to its superior read/write performance and asynchronous, non-blocking access. However, select essential stores (currently only `auth`) maintain a backup copy in LocalStorage because on mobile OSes (Android/iOS), LocalStorage is immune to automatic cache clearing, while IndexedDB is not.

All data is stored under a single DB named `localforage`, however this DB contains multiple tables. The `global` table holds global stores, while user stores are held within tables that follow the name format `@<userID>` (or `<host>@<userID>` for alternate instances).

User stores are automatically cleared after logout during the unused store pruning process. Global stores, however, are not cleared.
