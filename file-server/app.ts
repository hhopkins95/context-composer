// App Setup Imports
import packageJson from "./package.json" with { type: "json" };
import { configureAppOpenApi } from "./lib/configure-app-openapi.ts";
import { createBaseApp, createRouter } from "./lib/create-app.ts";

// Router Imports
import { indexRouter } from "./routes/index.route.ts";

// create app
const app = createBaseApp();

configureAppOpenApi(app, {
  title: packageJson.name,
  version: packageJson.version,
});

app.route("/", indexRouter);

const port = process.env.BACKEND_PORT || 9000;
console.log("BACKEND_PORT", port);

export default {
  port,
  fetch: app.fetch,
};

export type RouterType = typeof app;
