import { Hono } from "hono";
import { logger } from "hono/logger";
import Bindings from "../hono-cloudflare/env";
import router from "../hono-cloudflare/router";
import { ping } from "../hono-cloudflare/controller";
import Variables from "../hono-cloudflare/variables";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .use("*", logger())
  .route("/identify", router)
  .get("/ping", ping)
  .all("*", (c) => c.notFound());

export default app;
