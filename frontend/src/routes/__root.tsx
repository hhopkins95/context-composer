import * as React from "react";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { NodeProvider } from "@/contexts/node-context";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <NodeProvider>
        <Outlet />
        <TanStackRouterDevtools position="bottom-right" />
      </NodeProvider>
    </>
  );
}
