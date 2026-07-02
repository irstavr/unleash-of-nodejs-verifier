import { readFileSync } from "node:fs";
import http from "node:http";

/**
 * Load the default client-features fixture at call time via a URL relative to this module.
 * Reading it (rather than `import ... with { type: "json" }`) keeps the JSON out of the TS
 * program, so the package builds with plain `tsc` (no bundler) and resolves correctly both
 * in-repo and when installed as a dependency (dist/ and fixtures/ are siblings under root).
 */
function defaultFeatures(): unknown {
  const url = new URL("../../../fixtures/unleash-features.json", import.meta.url);
  return JSON.parse(readFileSync(url, "utf8"));
}

/**
 * The real provider  only needs a URL to build its own client, 
 * so this requires no change to the provider's interface and runs 
 * its real fetch/parse/evaluate path. 
 */
export interface FakeUnleashControl {
  setFeatures(next: unknown): void;
  failNext(status: number, times?: number): void;
}

export interface FakeUnleash {
  url: string;
  token: string;
  control: FakeUnleashControl;
  close: () => Promise<void>;
}

export async function startFakeUnleash(
  initialFeatures: unknown = defaultFeatures(),
): Promise<FakeUnleash> {
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
