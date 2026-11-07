import { Section, Text } from "@react-email/components";
import { EmailLayout, h1, label, p, value } from "./layout";

export interface LeadNotificationProps {
  typeLabel: string;
  name: string;
  email: string | null;
  phone: string | null;
  vehicleTitle: string | null;
  message: string | null;
  details: { label: string; value: string }[];
  adminUrl: string;
  dealerName: string;
}

/** Internal notification to sales — French, denser (brief §13, §15). */
export function LeadNotificationEmail(props: LeadNotificationProps) {
  return (
    <EmailLayout preview={`Nouveau lead · ${props.typeLabel} · ${props.name}`} footer={`${props.dealerName} · Notification automatique du site. Gérer dans l'admin : ${props.adminUrl}`}>
      <Text style={h1}>Nouveau lead · {props.typeLabel}</Text>
      <Section>
        <Text style={label}>Nom</Text>
        <Text style={value}>{props.name}</Text>
        {props.email && (
          <>
            <Text style={label}>Courriel</Text>
            <Text style={value}>{props.email}</Text>
          </>
        )}
        {props.phone && (
          <>
            <Text style={label}>Téléphone</Text>
            <Text style={value}>{props.phone}</Text>
          </>
        )}
        {props.vehicleTitle && (
          <>
            <Text style={label}>Véhicule</Text>
            <Text style={value}>{props.vehicleTitle}</Text>
          </>
        )}
        {props.details.map((d) => (
          <Section key={d.label}>
            <Text style={label}>{d.label}</Text>
            <Text style={value}>{d.value}</Text>
          </Section>
        ))}
        {props.message && (
          <>
            <Text style={label}>Message</Text>
            <Text style={{ ...p, whiteSpace: "pre-wrap" }}>{props.message}</Text>
          </>
        )}
      </Section>
    </EmailLayout>
  );
}
