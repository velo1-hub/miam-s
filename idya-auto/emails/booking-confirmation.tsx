import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, h1, label, p, value } from "./layout";

export interface BookingEmailProps {
  locale: "fr" | "en";
  firstName: string;
  vehicleTitle: string;
  dateLabel: string;
  timeLabel: string;
  address: string;
  phone: string;
  icsUrl: string;
  dealerName: string;
}

/** Customer confirmation — brief §12, FR/EN, branded, ends on a crafted moment. */
export function BookingConfirmationEmail(props: BookingEmailProps) {
  const fr = props.locale === "fr";
  return (
    <EmailLayout
      preview={fr ? `Votre essai routier du ${props.dateLabel} est réservé` : `Your test drive on ${props.dateLabel} is booked`}
      footer={fr ? `${props.dealerName} · ${props.address} · ${props.phone}. Pour modifier ou annuler, appelez-nous.` : `${props.dealerName} · ${props.address} · ${props.phone}. To change or cancel, call us.`}
    >
      <Text style={h1}>{fr ? `C'est réservé, ${props.firstName}.` : `You're booked, ${props.firstName}.`}</Text>
      <Text style={p}>{fr ? "Nous préparons le véhicule pour vous. Voici le résumé de votre essai routier." : "We're getting the vehicle ready for you. Here is your test drive summary."}</Text>
      <Section>
        <Text style={label}>{fr ? "Véhicule" : "Vehicle"}</Text>
        <Text style={value}>{props.vehicleTitle}</Text>
        <Text style={label}>{fr ? "Quand" : "When"}</Text>
        <Text style={value}>
          {props.dateLabel} · {props.timeLabel}
        </Text>
        <Text style={label}>{fr ? "Où" : "Where"}</Text>
        <Text style={value}>{props.address}</Text>
      </Section>
      <Button href={props.icsUrl} style={{ display: "inline-block", marginTop: 20, backgroundColor: "#F5F5F7", color: "#08080A", borderRadius: 999, padding: "12px 24px", fontWeight: 600, fontSize: 15, textDecoration: "none" }}>
        {fr ? "Ajouter à mon calendrier" : "Add to my calendar"}
      </Button>
      <Text style={{ ...p, marginTop: 24 }}>{fr ? "Apportez votre permis de conduire valide. Un conseiller vous contactera pour confirmer." : "Bring your valid driver's licence. An advisor will contact you to confirm."}</Text>
    </EmailLayout>
  );
}
