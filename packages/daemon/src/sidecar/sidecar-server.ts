import http from "node:http";
import { renderSidecarHtml } from "./sidecar-html.js";

export interface SidecarServerOptions {
  port?: number;
  host?: string;
  daemonUrl?: string;
  bearerToken?: string;
}

export function startSidecarServer(opts?: SidecarServerOptions): Promise<{ server: http.Server; url: string; port: number }> {
  const port = opts?.port ?? (process.env.OPENRIG_SIDECAR_PORT ? Number(process.env.OPENRIG_SIDECAR_PORT) : 7434);
  const host = opts?.host ?? "127.0.0.1";
  const daemonUrl = (opts?.daemonUrl ?? process.env.OPENRIG_URL ?? "http://127.0.0.1:7433").replace(/\/$/, "");

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

    // CORS headers for all requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-OpenRig-Session");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Proxy /api/* to OpenRig daemon
    if (url.pathname.startsWith("/api/")) {
      const targetUrl = new URL(url.pathname + url.search, daemonUrl);
      const proxyHeaders = { ...req.headers, host: targetUrl.host };

      if (opts?.bearerToken && !proxyHeaders["authorization"]) {
        proxyHeaders["authorization"] = `Bearer ${opts.bearerToken}`;
      }

      const proxyReq = http.request(
        targetUrl,
        {
          method: req.method,
          headers: proxyHeaders,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
          proxyRes.pipe(res);
        }
      );

      proxyReq.on("error", (err) => {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "daemon_unreachable", message: err.message, daemonUrl }));
      });

      req.pipe(proxyReq);
      return;
    }

    // Serve Single Page Application
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderSidecarHtml(daemonUrl));
  });

  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      const addr = server.address();
      const actualPort = typeof addr === "object" && addr ? addr.port : port;
      const sidecarUrl = `http://${host}:${actualPort}`;
      resolve({ server, url: sidecarUrl, port: actualPort });
    });
    server.on("error", reject);
  });
}

if (process.argv[1]?.endsWith("sidecar-server.js") || process.argv[1]?.endsWith("sidecar-server.ts")) {
  const port = process.env.PORT ? Number(process.env.PORT) : 7434;
  startSidecarServer({ port }).then(({ url }) => {
    console.log(`[openrig-sidecar] Running at ${url}`);
  }).catch((err) => {
    console.error(`[openrig-sidecar] Failed to start:`, err);
    process.exit(1);
  });
}
