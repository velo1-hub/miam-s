import { existsSync } from "node:fs";
import { join } from "node:path";
/** Server-only: does a /media file exist in public? Lets pages degrade gracefully while photos are still being produced. */
export const mediaExists = (publicPath: string) => existsSync(join(process.cwd(), "public", publicPath));
