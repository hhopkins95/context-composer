// App Setup Imports
import packageJson from "./package.json" with { type: "json" };
import { configureAppOpenApi } from "./lib/configure-app-openapi.ts";
import { createBaseApp, createRouter } from "./lib/create-app.ts";

// Router Imports
import { indexRouter } from "./routes.ts";

// create app
const app = createBaseApp();

configureAppOpenApi(app, {
  title: packageJson.name,
  version: packageJson.version,
});

const _app = app.route("/", indexRouter);

const port = process.env.BACKEND_PORT || 9000;

export default {
  port,
  fetch: _app.fetch,
};

export type RouterType = typeof _app;
