import path from "node:path";

/**
 * Where demo mode keeps its writable state (leads, settings overlay, drafts, outbox, chat logs).
 * Locally: the git-ignored `.cache/` folder. On Vercel and other serverless hosts the deployment
 * filesystem is read-only, so state goes to the instance's `/tmp` and lasts as long as the instance.
 */
export const DEMO_DIR = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? "/tmp/idya-demo" : path.join(process.cwd(), ".cache");

export const demoFile = (...parts: string[]) => path.join(DEMO_DIR, ...parts);
