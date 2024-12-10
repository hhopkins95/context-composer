import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import MainLayout from "@/components/main-layout";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <main className="min-h-screen">
      <MainLayout />
    </main>
  );
}
