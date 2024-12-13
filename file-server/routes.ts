import * as HTTP_STATUS_CODES from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { z } from "zod";
import { createRouter } from "./lib/create-app.ts";
import { readdir } from "node:fs/promises";
import { join, normalize, resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { OpenAPIHono } from "@hono/zod-openapi";
import { homedir } from "node:os";

// Get user's home directory
const HOME_DIR = homedir();

// Ensure path is within home directory
function ensurePathWithinHome(path: string): string {
  const normalizedPath = normalize(path);
  const resolvedPath = resolve(normalizedPath);

  if (!resolvedPath.startsWith(HOME_DIR)) {
    return HOME_DIR;
  }

  return resolvedPath;
}

export const indexRouter = new OpenAPIHono() // kkcreateRouter()
  // Get Directory Tree
  .openapi(
    {
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
    } as const,
    async (c) => {
      const { path: dirPath, fileExtensions } = c.req.valid("query");
      const safePath = ensurePathWithinHome(dirPath);

      const res = await readdir(safePath, {
        withFileTypes: true,
        recursive: false, // true,
      });
      const filePaths = res
        .filter((file) => {
          if (!file.isFile()) return false;
          if (file.name.startsWith(".")) return false;
          const ext = "." + file.name.split(".").pop();
          return fileExtensions.includes(ext);
        })
        .map((file) => join(safePath, file.name));

      const subDirs = res.filter((file) => file.isDirectory()).map((file) =>
        file.name
      ).filter((dir) => !dir.startsWith("."));

      return c.json({
        files: filePaths,
        dirs: subDirs,
      });
    },
  )
  // Read a file's contents as text
  .openapi(
    {
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
    } as const,
    async (c) => {
      const { path } = c.req.valid("query");
      const safePath = ensurePathWithinHome(path);

      // Read the file content as UTF-8 text
      const fileContent = await readFile(safePath, "utf-8");
      return c.json({
        fileContent,
      });
    },
  )
  // List parent directory contents
  .openapi(
    {
      method: "get",
      path: "/directory/parent",
      request: {
        query: z.object({
          path: z.string().optional(),
        }),
      },
      responses: {
        [HTTP_STATUS_CODES.OK]: jsonContent(
          z.object({
            currentPath: z.string(),
            parentPath: z.string().nullable(),
            dirs: z.array(z.object({
              name: z.string(),
              path: z.string(),
            })),
          }),
          "Parent directory contents",
        ),
      },
    } as const,
    async (c) => {
      const { path: currentPath = HOME_DIR } = c.req.valid("query");
      const safePath = ensurePathWithinHome(currentPath);

      // Get parent path, but don't allow going above home directory
      const parentPath = safePath === HOME_DIR ? null : join(safePath, "..");

      // Read directory contents
      const contents = await readdir(safePath, { withFileTypes: true });

      // Filter for directories only and exclude hidden ones
      const dirs = contents
        .filter((dirent) =>
          dirent.isDirectory() && !dirent.name.startsWith(".")
        )
        .map((dirent) => ({
          name: dirent.name,
          path: join(safePath, dirent.name),
        }));

      return c.json({
        currentPath: safePath,
        parentPath: parentPath ? ensurePathWithinHome(parentPath) : null,
        dirs,
      });
    },
  );
