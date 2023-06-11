import { Context } from "hono";
import Env from "./env";
import Variables from "./variables";

type Ctx = Context<{
  Bindings: Env;
  Variables: Variables;
}>;

export default Ctx;
