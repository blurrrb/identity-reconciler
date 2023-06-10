import { Hono } from "hono";
import Bindings from "../hono-cloudflare/env";
import router from "../hono-cloudflare/router";

const app = new Hono<{ Bindings: Bindings }>();

app.route("/", router);

export default app;
