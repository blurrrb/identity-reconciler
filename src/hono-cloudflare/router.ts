import { Hono } from "hono";
import { middleware } from "./app_state";
import { identify, ping } from "./controller";
import Bindings from "./env";
import Variables from "./variables";

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .use("*", middleware)
  .post("/identify", identify)
  .get("/ping", ping);

export default router;
