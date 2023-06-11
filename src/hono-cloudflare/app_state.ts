import { MiddlewareHandler } from "hono";
import {
  DrizzleContactsRepo,
  DrizzleLinkContactsUnitOfWork,
} from "../drizzle/contacts";
import { NewNeonPostgres } from "../drizzle/store";
import { ReconciliationService } from "../reconciliation";
import Env from "./env";
import Variables from "./variables";
import Ctx from "./ctx";

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
    globalAppState = await constructAppState(c.env);
  }

  c.set("APP_STATE", globalAppState);
  await next();
};

async function constructAppState(env: Env): Promise<AppState> {
  const db = await NewNeonPostgres(env.DATABASE_URL);
  const repo = new DrizzleContactsRepo(db);

  const uow = new DrizzleLinkContactsUnitOfWork(db, repo);

  const reconciliationService = new ReconciliationService(uow);

  return {
    reconciliationService,
  };
}

export function getAppState(c: Ctx) {
  return c.get("APP_STATE");
}
