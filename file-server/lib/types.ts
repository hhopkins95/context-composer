import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";

/**
 * Custom additions to the context that is passed to each route
 */
export interface AppBindings {
  Variables: {};
}

/** */
export type AppOpenApi = OpenAPIHono<AppBindings>;

/**
 * Helper type for creating routes. Automatically adds the AppBindings
 */
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>;
