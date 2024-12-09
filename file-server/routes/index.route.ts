import * as HTTP_STATUS_CODES from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { z } from "zod";
import { createRouter } from "../lib/create-app.ts";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

const router = createRouter()
  // Get Directory Tree
  .openapi({
    tags: ["Directory"], // Group within the OpenAPI doc
    method: "get",
    path: "/directory",
    request: {
      query: z.object({
        path: z.string(),
        fileExtensions: z.string().array().default([
          ".md",
          ".txt",
          ".json",
          ".ts",
          ".tsx",
          ".js",
          ".jsx",
          ".css",
          ".scss",
          ".html",
          ".htm",
          ".xml",
          ".yaml",
          ".yml",
          ".jsonc",
          ".json5",
        ]),
      }),
    },
    responses: {
      [HTTP_STATUS_CODES.OK]: jsonContent(
        z.object({
          files: z.string().array(), // array of all filepaths in this directory
          dirs: z.string().array(), // array of all subdirectories in this directory
        }),
        "Description",
      ),
    },
  }, async (c) => {
    const { path: dirPath, fileExtensions } = c.req.valid("query");
    console.log(dirPath, fileExtensions);

    const res = await readdir(dirPath, {
      withFileTypes: true,
      recursive: false, // true,
    });
    const filePaths = res
      .filter((file) => {
        if (!file.isFile()) return false;
        const ext = "." + file.name.split(".").pop();
        return fileExtensions.includes(ext);
      })
      .map((file) => join(dirPath, file.name));

    const subDirs = res.filter((file) => file.isDirectory()).map((file) =>
      file.name
    );

    return c.json({
      files: filePaths,
      dirs: subDirs,
    });
  })
  // Read a file's contents as text
  .openapi({
    tags: ["Directory"],
    method: "get",
    path: "/file",
    request: {
      query: z.object({
        path: z.string(),
      }),
    },
    responses: {
      [HTTP_STATUS_CODES.OK]: jsonContent(
        z.object({
          fileContent: z.string(),
        }),
        "File contents as text",
      ),
    },
  }, async (c) => {
    const { path } = c.req.valid("query");
    console.log(path);

    // Read the file content as UTF-8 text
    const fileContent = await readFile(path, "utf-8");
    console.log(fileContent);
    return c.json({
      fileContent,
    });
  });

export const indexRouter = router;
