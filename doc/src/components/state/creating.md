# Creating a New State Store

To add a new state store, you must:

- Create a new state type
- Add the new store type to the Store type in stores/index.ts
- Create a new class extending AbstractStore
- Add the new store class to the State class in index.ts

In addition to this guide offering a starting point to creating a new state store, it will also serve as a guide to the components of the state store.

## Creating a New State Type

Create a file in the stores directory. Use Camel Case. In this example we will be creating a new State Store named `Favorites` that stores a list of favorite message ids. States should be well documented, so make sure you include doc strings for everything that is publically exported.

In the new file, create the new type:

```typescript
export type TypeFavorites = {
  /**
   * List of IDs of messages saved as favorites
   */
  favorites: string[];
};
```

The type can house anything that is able to be marshalled into a string; however, it's best to keep it simple.

## Adding the New Store Type to the Global Store

In stores/index.ts add the new type to the Store type. This list is alphabetical for ease of reading so insert it alphabetically. Favorites would go between experiments and keybinds.

```typescript
. . .
import { TypeExperiments } from "./Experiments";
import { TypeFavorites } from "./Favorites";
import { TypeKeybinds } from "./Keybinds";
. . .

export type Store = {
  . . .
  experiments: TypeExperiments;
  favorites: TypeFavorites;
  keybinds: TypeKeybinds;
  . . .
}
```

## Creating a New State Class

The Favorites class should extend the AbstractStore class, with the type arguments `"favorites", TypeFavorites`.

```typescript
import { State } from "..";

import { AbstractStore } from ".";

// The type from above

export type TypeFavorites = {
  /**
   * List of IDs of messages saved as favorites
   */
  favorites: string[];
};

export class Favorites extends AbstractStore<"favorites", TypeFavorites> {
  constructor(state: State) {
    super(state, "favorites");
  }

  hydrate(): void {}
```

The `hydrate` function is for side effects. If your store should be doing something when it initially gets loaded from disk (for example, setting the locale as seen in stores/Locale.ts) then it should be done here. `hydrate` will be called after the store has cleaned the data from disk and has been saved to the state. Most stores will not need to do anything in hydrate as the store is already reactive.

```typescript

  default(): TypeFavorites {
    return {
      favorites: [],
    }
  }
```

The `default` function returns what the state should consist of if it is not found on disk.

```typescript

  clean(input: Partial<TypeFavorites>): TypeFavorites {
    const favorites: TypeFavorites = this.default();

    if (Array.isArray(input.favorites)) {
      for (const messageId of input.favorites) {
        if (typeof messageId === "string") {
          favorites.favorites.push(messageId);
        }
      }
    }

    return favorites;
  }
```

The `clean` function takes a dirty object from the DB and converts it to a clean object as expected by the store. This function should make no assumptions about the structure of the input as there's no guarantee that the input hasn't been changed. It should also strive to be 100% backwards compatible and translate past structures into new structures. If the data in input is not as expected then this function should omit that data and return something as close to default as necessary.

```typescript

  // AbstractStore is fully implemented. Now helper functions can be implemented.
  // An example helper function:

  /**
   * Add a favorite message by id
   * @param id Message ID
   */
  addFavorite(id: string) {
    this.set("favorites", [...this.get().favorites, id]);
  }
```

Since you can access the state store class directly, you can directly call helper functions. This makes helper functions a powerful tool for enforcing your new state store to be accessed in a specific way.

## Adding the New State Class to the Global State

In index.ts add the new class to the State class. This list is alphabetical for ease of reading so insert it alphabetically. Favorites would go between experiments and keybinds.

```typescript
. . .
import { Experiments } from "./stores/Experiments";
import { Favorites } from "./stores/Favorites";
import { Keybinds } from "./stores/Keybinds";
. . .

export class State {
  . . .
  experiments = new Experiments(this);
  favorites = new Favorites(this);
  keybinds = new Keybinds(this);
  . . .
```

## Accessing Your New State Store

You should now be able to access your new state store just like other state stores.

```typescript
import { createEffect } from "solid-js";

import { useState } from "@revolt/state";
import { Button } from "@revolt/ui";

function ExampleComponent() {
  const { favorites } = useState();

  createEffect(() => {
    console.log("Favorites state changed! New state: ", favorites);
  });

  return (
    <Button onPress={() => {favorites.addFavorite("ExampleMessageID")}} />
  )
}
```
