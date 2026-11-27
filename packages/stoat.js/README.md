# stoat.js

![stoat.js](https://img.shields.io/npm/v/stoat.js) ![stoat-api](https://img.shields.io/npm/v/stoat-api?label=Stoat%20API)

**stoat.js** is a JavaScript library for interacting with the Stoat API

## Requirements

To use this module, you must be using at least:

- Node.js v22.15.0 (LTS) in ES module mode
- **or** Deno v2.2 (LTS)

## Example Usage

```javascript
import { Client } from "stoat.js";

let client = new Client();

client.on("ready", async () =>
  console.info(`Logged in as ${client.user.username}!`),
);

client.on("message", async (message) => {
  if (message.content === "hello") {
    message.channel.sendMessage("world");
  }
});

client.loginBot("..");
```

## Reactivity with Signals & Solid.js Primitives

All objects have reactivity built-in and can be dropped straight into any Solid.js project.

```tsx
const client = new Client();
// initialise the client

function MyApp() {
  return (
    <h1>Your username is: {client.user?.username ?? "[logging in...]"}</h1>
  );
}
```

## Stoat API Types

> [!WARNING]
> It is advised you do not use this unless necessary. If you find somewhere that isn't covered by the library, please open an issue as this library aims to transform all objects.

All `stoat-api` types are re-exported from this library under `API`.

```typescript
import { API } from "stoat.js";

// API.Channel;
// API.[..];
```
