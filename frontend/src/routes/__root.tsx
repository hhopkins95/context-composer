import * as React from "react";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { PromptBuilderProvider } from "@/contexts/node-context";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <PromptBuilderProvider>
        <Outlet />
        <TanStackRouterDevtools position="bottom-right" />
      </PromptBuilderProvider>
    </>
  );
}
