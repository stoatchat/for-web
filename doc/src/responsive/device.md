# Device

The Device hook located in the `@revolt/common` package contains all information needed to be responsive to the device. When you must change UI or settings based on device size or orientation, use the Device hook.

## Using the useDevice hook

The `useDevice` hook returns a Device object that contains a `layout` accessor which returns if the device is on a phone, tablet, or desktop layout based on screen size. It also contains an `isMobile` boolean, but this relies on the user agent and should not be used unless necessary.

**Do not rely on screen size to determine if the device supports touch or is a phone.**

```typescript
import { Show } from "solid-js";
import { styled } from "styled-system/jsx";

import { useDevice } from "@revolt/common";

//Example component using the PandaCSS breakpoints (preferred when only CSS changes are needed)
const DynamicBox = styled("div", {
  base: {
    width: "400px",
    height: "200px",
    background: "red",

    //Activates on tablet AND phone breakpoints
    _tablet: {
      background: "red",
    },

    //Activates on phone breakpoint
    _phone: {
      width: "400px",
      height: "200px",
    },
  },
});

//Example component using the reactive layout var
function ComponentThatUsesDevice() {
  const { layout } = useDevice();

  return (
    <Show when={layout() === "desktop"}>
      This is a large screen!
    </Show>
    <Show when={layout() === "tablet"}>
      This is a medium screen!
    </Show>
    <Show when={layout() === "phone"}>
      This is a small screen!
    </Show>
    <Show when={layout() !== "phone"}>
      This is not a small screen!
    </Show>
  )
}
```
