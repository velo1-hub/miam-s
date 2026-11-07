import "server-only";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { render } from "@react-email/components";
import type { ReactElement } from "react";

interface Mail {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
}

/**
 * Sends through Resend when RESEND_API_KEY is set; otherwise writes the rendered HTML to
 * .cache/outbox/ (local review) and logs. Never throws — a lead must be saved even if mail fails.
 */
export async function sendEmail(mail: Mail): Promise<{ ok: boolean; id?: string }> {
  const html = await render(mail.react);
  const from = process.env.EMAIL_FROM ?? "Idya Auto <no-reply@idya-auto.example>";
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const res = await resend.emails.send({ from, to: mail.to, subject: mail.subject, html, replyTo: mail.replyTo });
      return { ok: !res.error, id: res.data?.id };
    } catch (e) {
      console.error("[email] send failed", e);
      return { ok: false };
    }
  }
  try {
    const dir = path.join(process.cwd(), ".cache", "outbox");
    mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${Date.now()}-${mail.subject.replace(/[^a-z0-9]+/gi, "-").slice(0, 60)}.html`);
    writeFileSync(file, html);
    console.info(`[email] (demo) ${mail.to} · ${mail.subject} → ${file}`);
  } catch {
    console.info(`[email] (demo) ${mail.to} · ${mail.subject}`);
  }
  return { ok: true };
}
