import { fileURLToPath } from "node:url";

export const clientDirectory = fileURLToPath(new URL("../", import.meta.url));
export const publicDirectory = fileURLToPath(
  new URL("../.generated/public/", import.meta.url),
);
