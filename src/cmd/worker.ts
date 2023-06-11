import { Hono } from "hono";
import { logger } from "hono/logger";
import Bindings from "../hono-cloudflare/env";
import router from "../hono-cloudflare/router";
import Variables from "../hono-cloudflare/variables";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .use("*", logger())
  // .route("/v1", router)
  .route("/", router)
  .all("*", (c) => c.notFound());

export default app;
