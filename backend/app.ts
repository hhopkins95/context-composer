// App Setup Imports
import packageJson from "./package.json" with { type: "json" };
import { configureAppOpenApi } from "./lib/hono/configure-app-openapi.ts";
import { createBaseApp, createRouter } from "./lib/hono/create-base-app.ts";
import { type AppRouterDef } from "./lib/hono/types.ts";

// Router Imports
import { indexRouter } from "./routers/index.route.ts";

/**
 * ROUTERS
 */
const BASE_ROUTERS: AppRouterDef[] = [
  indexRouter,
]; // base routes

/**
 * CREATE SERVER
 */

const app = createBaseApp();
configureAppOpenApi(app, {
  title: packageJson.name,
  version: packageJson.version,
});

for (const baseRoute of BASE_ROUTERS) {
  const { router, rootPath } = baseRoute;
  app.route(rootPath, router);
}

export default {
  port: 1234,
  fetch: app.fetch,
};
