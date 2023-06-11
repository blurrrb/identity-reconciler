import { MiddlewareHandler } from "hono";
import {
  DrizzleContactsRepo,
  DrizzleLinkContactsUnitOfWork,
} from "../drizzle/contacts";
import { NewNeonPostgres, NewNodePostgress } from "../drizzle/store";
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
    console.log("app state is empty, constructing app state");
    globalAppState = await constructAppState(c.env);
  }

  console.log("setting app state");
  c.set("APP_STATE", globalAppState);
  await next();
};

async function constructAppState(env: Env): Promise<AppState> {
  let db;
  if (env.APP_MODE === "prod") {
    db = await NewNeonPostgres(env.DATABASE_URL);
  } else {
    db = await NewNodePostgress(env.DATABASE_URL);
  }
  console.log("db connection established");

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
