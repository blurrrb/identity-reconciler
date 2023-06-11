import { getAppState } from "./app_state";
import Ctx from "./ctx";

export async function identify(c: Ctx) {
  const appState = getAppState(c);

  const { email, phoneNumber } = (await c.req.json()) as {
    email?: string;
    phoneNumber?: string;
  };

  return c.json(
    await appState.reconciliationService.reconcileLinks(email, phoneNumber)
  );
}

export async function ping(c: Ctx) {
  return c.text("pong");
}
