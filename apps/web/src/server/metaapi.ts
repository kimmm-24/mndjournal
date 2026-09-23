import { randomBytes } from "node:crypto";

/**
 * Minimal MetaApi (metaapi.cloud) REST client — MetaTrader 4/5 account
 * connectivity, over plain fetch. Two APIs:
 * - provisioning (one global host): create/read/deploy/undeploy/delete the
 *   cloud terminal that logs into the user's MT account;
 * - client (per-region host): read that terminal's history and state.
 *
 * Billing is per hour while an account is DEPLOYED and nothing while it's
 * undeployed, so server/metatrader.ts deploys only for the length of a sync.
 * Token: METAAPI_TOKEN, from app.metaapi.cloud → API access.
 */
const PROVISIONING = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";
const clientHost = (region: string) => `https://mt-client-api-v1.${region}.agiliumtrade.ai`;

export const metaApiConfigured = (): boolean => Boolean(process.env.METAAPI_TOKEN);

export class MetaApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

/** Test seam: polling waits go through here so tests don't sleep for real. */
export const timing = { sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)) };

const request = async (url: string, init: RequestInit = {}): Promise<Response> => {
  const token = process.env.METAAPI_TOKEN;
  if (!token) throw new MetaApiError("MetaTrader sync isn't configured on this server.", 500);
  return fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "auth-token": token,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
};

const fail = async (response: Response, action: string): Promise<never> => {
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
    details?: unknown;
  };
  throw new MetaApiError(
    `${action}: ${body.message ?? `HTTP ${response.status}`}`,
    response.status,
    body.error,
  );
};

export interface ProvisionInput {
  name: string;
  login: string;
  password: string;
  server: string;
  platform: "mt4" | "mt5";
}

/** Longest we keep waiting while MetaApi detects the broker's server settings. */
const PROVISION_TIMEOUT_MS = 120_000;

/**
 * Creates the cloud terminal (undeployed state, so it costs nothing yet).
 * MetaApi answers 202 + Retry-After while it detects the broker's settings;
 * the same transaction-id is replayed until it answers 201.
 */
export const provisionAccount = async (input: ProvisionInput): Promise<string> => {
  const transactionId = randomBytes(16).toString("hex");
  const started = Date.now();
  for (;;) {
    const response = await request(`${PROVISIONING}/users/current/accounts`, {
      method: "POST",
      headers: { "transaction-id": transactionId },
      body: JSON.stringify({
        name: input.name,
        login: input.login,
        password: input.password,
        server: input.server,
        platform: input.platform,
        magic: 0,
        type: "cloud-g2",
        reliability: "regular",
        tags: ["mndjournal"],
      }),
    });
    if (response.status === 201) return ((await response.json()) as { id: string }).id;
    if (response.status !== 202) return fail(response, "Couldn't connect to MetaTrader");
    if (Date.now() - started > PROVISION_TIMEOUT_MS) {
      throw new MetaApiError(
        "MetaTrader is taking too long to recognize this broker server. Check the server name and try again in a minute.",
        504,
      );
    }
    const retryAfter = Number(response.headers.get("retry-after"));
    await timing.sleep((Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 5) * 1000);
  }
};

export interface MetaApiAccount {
  state: string;
  connectionStatus: string;
  region: string;
}

export const readAccount = async (id: string): Promise<MetaApiAccount> => {
  const response = await request(
    `${PROVISIONING}/users/current/accounts/${encodeURIComponent(id)}`,
  );
  if (!response.ok) return fail(response, "Couldn't read the MetaTrader connection");
  return (await response.json()) as MetaApiAccount;
};

const lifecycle = async (id: string, action: "deploy" | "undeploy") => {
  const response = await request(
    `${PROVISIONING}/users/current/accounts/${encodeURIComponent(id)}/${action}`,
    { method: "POST" },
  );
  if (!response.ok) await fail(response, `Couldn't ${action} the MetaTrader connection`);
};

export const deployAccount = (id: string) => lifecycle(id, "deploy");
export const undeployAccount = (id: string) => lifecycle(id, "undeploy");

/** Deletes the cloud terminal; a 404 means it's already gone, which is the goal. */
export const removeAccount = async (id: string): Promise<void> => {
  const response = await request(
    `${PROVISIONING}/users/current/accounts/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!response.ok && response.status !== 404) await fail(response, "Couldn't remove MetaTrader");
};

const CONNECT_TIMEOUT_MS = 180_000;
const POLL_MS = 5_000;

/** Waits for the deployed terminal to log in to the broker; returns its region. */
export const waitUntilConnected = async (id: string): Promise<string> => {
  const started = Date.now();
  for (;;) {
    const account = await readAccount(id);
    if (account.state === "DEPLOYED" && account.connectionStatus === "CONNECTED") {
      return account.region;
    }
    if (Date.now() - started > CONNECT_TIMEOUT_MS) {
      throw new MetaApiError(
        account.connectionStatus === "DISCONNECTED_FROM_BROKER"
          ? "Couldn't log in to your MetaTrader account. If you changed the investor password, reconnect the account."
          : "MetaTrader didn't connect in time. It will retry on the next sync.",
        504,
      );
    }
    await timing.sleep(POLL_MS);
  }
};

export interface MetaApiDeal {
  id: string;
  type: string;
  entryType?: string;
  symbol?: string;
  time: string;
  volume?: number;
  price?: number;
  commission?: number;
  swap?: number;
  profit?: number;
  positionId?: string;
}

const PAGE_SIZE = 1000;

/** Every deal in [from, to), following MetaApi's offset pagination. */
export const readDeals = async (
  id: string,
  region: string,
  from: Date,
  to: Date,
): Promise<MetaApiDeal[]> => {
  const deals: MetaApiDeal[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const response = await request(
      `${clientHost(region)}/users/current/accounts/${encodeURIComponent(id)}/history-deals/time/${from.toISOString()}/${to.toISOString()}?offset=${offset}&limit=${PAGE_SIZE}`,
    );
    if (!response.ok) return fail(response, "Couldn't read MetaTrader history");
    const page = (await response.json()) as MetaApiDeal[];
    deals.push(...page);
    if (page.length < PAGE_SIZE) return deals;
  }
};

export interface MetaApiAccountInformation {
  currency: string;
  balance: number;
  equity: number;
}

export const readAccountInformation = async (
  id: string,
  region: string,
): Promise<MetaApiAccountInformation> => {
  const response = await request(
    `${clientHost(region)}/users/current/accounts/${encodeURIComponent(id)}/account-information`,
  );
  if (!response.ok) return fail(response, "Couldn't read MetaTrader account information");
  return (await response.json()) as MetaApiAccountInformation;
};

export const readPositions = async (id: string, region: string): Promise<unknown[]> => {
  const response = await request(
    `${clientHost(region)}/users/current/accounts/${encodeURIComponent(id)}/positions`,
  );
  if (!response.ok) return fail(response, "Couldn't read MetaTrader positions");
  return (await response.json()) as unknown[];
};
