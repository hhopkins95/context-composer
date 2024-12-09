import * as HTTP_STATUS_CODES from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createMessageObjectSchema } from "stoker/openapi/schemas";
import { z } from "zod";
import { createRouter } from "../lib/create-app.ts";

const router = createRouter()
  .openapi({
    tags: ["Index"], // Group within the OpenAPI doc
    method: "get",
    path: "/",
    request: {
      params: z.object({
        dirPath: z.string().optional(),
      }),
    },
    responses: {
      // This is the same as above but using the stoker helpers
      [HTTP_STATUS_CODES.OK]: jsonContent(
        createMessageObjectSchema("Hello from the index route"),
        "Definition of this route...",
      ),
    },
  }, (c) => {
    return c.json({
      message: "Hello from the index route",
    });
  });

export const indexRouter = router;
