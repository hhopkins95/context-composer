import { hc } from "hono/client";
import type { RouterType } from "backend/app";

export const client = hc<RouterType>("/api");
