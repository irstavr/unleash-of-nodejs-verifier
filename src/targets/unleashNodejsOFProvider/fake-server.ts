import http from "node:http";
import features from "../../../fixtures/unleash-features.json";

/**
 * A featherweight, PROGRAMMABLE stand-in for the Unleash Client API.
 *
 * It serves the fixtures at GET /api/client/features and accepts the SDK's
 * register/metrics POSTs — the whole surface the Unleash Node SDK needs. The
 * real provider builds its own client and only needs a URL, so this requires no
 * change to the provider's interface and exercises its real fetch/parse path.
 *
 * The `control` surface (setFeatures / failNext) lets lifecycle tests drive the
 * real provider's STALE / recovery / configuration-changed transitions.
 */
export interface FakeUnleashControl {
  /** Swap the served flag set; next poll picks it up (drives CONFIGURATION_CHANGED). */
  setFeatures(next: unknown): void;
  /** Make the next `times` feature fetches respond with `status` (drives STALE/ERROR/recovery). */
  failNext(status: number, times?: number): void;
}

export interface FakeUnleash {
  url: string;
  token: string;
  control: FakeUnleashControl;
  close: () => Promise<void>;
}

export async function startFakeUnleash(initialFeatures: unknown = features): Promise<FakeUnleash> {
  let current = initialFeatures;
  let failStatus = 0;
  let failCount = 0;

  const server = http.createServer((req, res) => {
    req.on("data", () => {});
    req.on("end", () => {
      const { method = "GET", url = "" } = req;

      if (method === "GET" && url.startsWith("/api/client/features")) {
        if (failCount > 0) {
          failCount -= 1;
          res.writeHead(failStatus || 500);
          res.end();
          return;
        }
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(current));
        return;
      }

      if (
        method === "POST" &&
        (url.startsWith("/api/client/register") || url.startsWith("/api/client/metrics"))
      ) {
        res.writeHead(202);
        res.end();
        return;
      }

      res.writeHead(404);
      res.end();
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;

  return {
    url: `http://127.0.0.1:${port}/api`,
    token: "verifier-not-a-real-token",
    control: {
      setFeatures: (next) => {
        current = next;
      },
      failNext: (status, times = 1) => {
        failStatus = status;
        failCount = times;
      },
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
