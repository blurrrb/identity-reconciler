import { MiddlewareHandler } from "hono";
import { DrizzleLinkContactsUnitOfWork } from "../drizzle/contacts";
import { NewNeonPostgres } from "../drizzle/store/neon";
import { ReconciliationService } from "../reconciliation";
import Ctx from "./ctx";
import Env from "./env";
import Variables from "./variables";

export type AppState = {
  reconciliationService: ReconciliationService;
  // any other states go here
};

let globalAppState: AppState | undefined = undefined;

export const middleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: Variables;
}> = async (c, next) => {
  if (!globalAppState) {
    console.log("app state is empty, constructing app state");
    globalAppState = await constructAppState(c.env);
  }

  console.log("setting app state");
  c.set("APP_STATE", globalAppState);
  await next();
};

async function constructAppState(env: Env): Promise<AppState> {
  const db = await NewNeonPostgres(env.DATABASE_URL);
  console.log("db connection established");

  // const repo = new DrizzleContactsRepo(db);

  const uow = new DrizzleLinkContactsUnitOfWork(db);

  const reconciliationService = new ReconciliationService(uow);

  return {
    reconciliationService,
  };
}

export function getAppState(c: Ctx) {
  return c.get("APP_STATE");
}
