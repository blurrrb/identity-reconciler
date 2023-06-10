import { Hono } from "hono";
import Bindings from "./env";
const router = new Hono<{ Bindings: Bindings }>();

router.get("/", (c) => c.text("Hello Cloudflare Workers!"));

export default router;
