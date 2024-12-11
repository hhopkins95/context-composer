// Backend client
import { hc } from "hono/client";
import type { RouterType } from "backend/app";

export const api = hc<RouterType>("/");
