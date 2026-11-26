# User Limits

Many interactions a user can have with Stoat are limited by the backend. Any action that has a backend limit should have a matching limit in for-web.

## Using Limits

The client contains a limit object at `client.limits`. The recommended way to access this is through the memoized and null-guarded reactive accessor, `instance.limits()`. This returns a limits object that has all backend limits that apply to the logged in user, and it takes into account if the user is new, or in the future, any other type of user that has different limits.

Limits can only be accessed from within the Instance context, which close to the root level of the solid context hierarchy. If access to the limits is needed outside a solid component, they must be passed as function parameters.

```ts
import { useInstance } from "@revolt/instance";
import { createEffect, Show } from "solid-js";

export function ExampleComponent() {
  const { limits } = useInstance();

  createEffect(() => {
    //Prints the instance's default limit before login is complete, then prints the limit for the current user.
    console.log(limits().message_length);
  });

  //Shows the message when video is enabled on this instance and for this user.
  return <Show when={limits().video}>Video is enabled!</Show>;
}
```
