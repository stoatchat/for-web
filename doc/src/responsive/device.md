# Device

The Device hook located in the `@revolt/common` package contains all information needed to be responsive to the device. When you must change UI or settings based on device size or orientation, use the Device hook.

## Using the useDevice hook

The `useDevice` hook returns a Device object that contains a `layout` accessor which returns if the device is on a phone, tablet, or desktop layout based on screen size. It also contains an `isMobile` boolean, but this relies on the user agent and should not be used unless neccesary.

**Do not rely on screen size to determine if the device supports touch or is a phone.**

```typescript
import { Show } from "solid-js";

import { useDevice } from "@revolt/common";

function ComponentThatUsesDevice() {
  const { device } = useDevice();

  return (
    <Show when={device.layout() === "desktop"}>
      This is a large screen!
    </Show>
    <Show when={device.layout() === "tablet"}>
      This is a medium screen!
    </Show>
    <Show when={device.layout() === "phone"}>
      This is a small screen!
    </Show>
    <Show when={device.layout() !== "phone"}>
      This is not a small screen!
    </Show>
  )
}
```