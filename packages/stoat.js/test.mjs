#!/usr/bin/env -S node --env-file
import { env } from "node:process";

import { Client } from "./lib/index.js";

const client = new Client({ debug: true });

client.on("ready", () => console.info(`Logged in as ${client.user.username}!`));
client.on("disconnected", () => console.info("Disconnected."));

client.on("messageCreate", (message) => console.info(message.content));

client.loginBot(env.TOKEN);
