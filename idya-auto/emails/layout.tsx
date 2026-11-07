import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

/** Shared dark email frame — black stage, one red accent bar (brief §3.2). */
export function EmailLayout({ preview, children, footer }: { preview: string; children: ReactNode; footer: string }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#08080A", color: "#F5F5F7", fontFamily: "Inter, -apple-system, Segoe UI, Roboto, sans-serif", margin: 0, padding: "32px 16px" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#141418", borderRadius: 20, padding: "32px 28px", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Section>
            <Text style={{ margin: 0, fontSize: 14, letterSpacing: 4, fontWeight: 600 }}>
              <span style={{ fontStyle: "italic", fontWeight: 800 }}>IDYA</span>{" "}
              <span style={{ color: "#E21F26", fontStyle: "italic", fontWeight: 800 }}>AUTO</span>
            </Text>
          </Section>
          {children}
          <Text style={{ fontSize: 12, color: "rgba(245,245,247,0.5)", marginTop: 32 }}>{footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export const h1 = { fontSize: 24, fontWeight: 600, letterSpacing: -0.5, margin: "24px 0 8px" } as const;
export const p = { fontSize: 16, lineHeight: "24px", color: "rgba(245,245,247,0.8)", margin: "0 0 12px" } as const;
export const label = { fontSize: 12, color: "rgba(245,245,247,0.5)", margin: "12px 0 2px", textTransform: "uppercase", letterSpacing: 1 } as const;
export const value = { fontSize: 16, color: "#F5F5F7", margin: 0 } as const;
