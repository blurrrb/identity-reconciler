import { ErrInvalidReconciliationRequest } from "../reconciliation";
import { getAppState } from "./app_state";
import Ctx from "./ctx";

export async function identify(c: Ctx) {
  const appState = getAppState(c);

  const { email, phoneNumber } = (await c.req.json()) as {
    email?: string;
    phoneNumber?: string;
  };
  try {
    return c.json(
      await appState.reconciliationService.reconcileLinks(email, phoneNumber)
    );
  } catch (err) {
    if (err === ErrInvalidReconciliationRequest) {
      return c.text(
        "bad request. atleast one of email or phone or both are required",
        { status: 400 }
      );
    }
  }
}

export async function ping(c: Ctx) {
  return c.text("pong");
}
