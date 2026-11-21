// Essais des contrôles de reçus. Lancer : node --test components/app/dashboard/receiptcheck.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { CSV_HEAD, confirmedTotals, csvField, dollarsText, duplicatesOf, flagsOf, isFuture, parseDollars, pretaxCents, receiptsCsv, taxFlags, vendorKey } from "./receiptcheck.ts";

const r = (o = {}) => ({ id: "a", dossier_id: "d1", created_at: "2026-03-02T15:00:00Z", vendor: "Papeterie Centrale", receipt_date: "2026-03-01", total_cents: 8500, gst_cents: 370, qst_cents: 737, category: "Fournitures", status: "a_verifier", staff_note: "", ...o });
const codes = (l) => l.map((f) => f.code);

test("montant saisi en dollars vers cents", () => {
  assert.equal(parseDollars("85"), 8500);
  assert.equal(parseDollars("85,5"), 8550);
  assert.equal(parseDollars(" 85.50 $ "), 8550);
  assert.equal(parseDollars("1 234,56"), 123456);
  assert.equal(parseDollars("1 234,56 $"), 123456);
  assert.equal(parseDollars("1,234.56"), 123456);
  assert.equal(parseDollars("0"), 0);
  assert.equal(parseDollars("19,99"), 1999);
  assert.equal(parseDollars("1000000"), 100000000);
});

test("montant vide : non lu ; montant illisible ou hors limites : refusé", () => {
  assert.equal(parseDollars(""), null);
  assert.equal(parseDollars("  "), null);
  for (const bad of ["abc", "-5", "12,345", "1.2.3", "8,5,0", "1000000,01", "=85", "8e2"]) assert.equal(parseDollars(bad), undefined, bad);
});

test("texte du champ de saisie", () => {
  assert.equal(dollarsText(8500), "85,00");
  assert.equal(dollarsText(5), "0,05");
  assert.equal(dollarsText(null), "");
  assert.equal(parseDollars(dollarsText(123456)), 123456);
});

test("taxes cohérentes : aucun signalement", () => {
  assert.deepEqual(taxFlags(r()), []);
  assert.deepEqual(taxFlags(r({ total_cents: 11498, gst_cents: 500, qst_cents: 998 })), []);
  assert.deepEqual(taxFlags(r({ total_cents: 115, gst_cents: 5, qst_cents: 10 })), []);
  assert.equal(pretaxCents(r()), 7393);
  assert.equal(pretaxCents(r({ gst_cents: null })), null);
});

test("écart d'un ou deux cents toléré, au-delà signalé", () => {
  assert.deepEqual(taxFlags(r({ total_cents: 11500, gst_cents: 502, qst_cents: 998 })), []);
  assert.deepEqual(codes(taxFlags(r({ total_cents: 11498, gst_cents: 510, qst_cents: 998 }))), ["taxes"]);
  assert.deepEqual(codes(taxFlags(r({ total_cents: 11498, gst_cents: 500, qst_cents: 900 }))), ["taxes"]);
});

test("taxes à revérifier : le détail donne les montants attendus", () => {
  const [f] = taxFlags(r({ total_cents: 10000, gst_cents: 100, qst_cents: 200 }));
  assert.equal(f.label, "Taxes à revérifier");
  assert.match(f.detail, /97,00 \$ avant taxes/);
  assert.match(f.detail, /TPS de 4,85 \$/);
  assert.match(f.detail, /TVQ de 9,68 \$/);
  // Taxes cohérentes entre elles mais plus basses que le total ne le laisse attendre : achat en partie non taxable.
  assert.match(f.detail, /pas taxable/);
  assert.doesNotMatch(taxFlags(r({ total_cents: 10000, gst_cents: 900, qst_cents: 100 }))[0].detail, /pas taxable/);
});

test("total qui ne dépasse pas les taxes", () => {
  assert.deepEqual(codes(taxFlags(r({ total_cents: 1000, gst_cents: 500, qst_cents: 600 }))), ["total"]);
  assert.deepEqual(codes(taxFlags(r({ total_cents: 0, gst_cents: 0, qst_cents: 0 }))), ["total"]);
});

test("sans total : les deux taxes doivent correspondre au même montant", () => {
  assert.deepEqual(taxFlags(r({ total_cents: null })), []);
  assert.deepEqual(taxFlags(r({ total_cents: null, gst_cents: 500, qst_cents: 998 })), []);
  assert.deepEqual(codes(taxFlags(r({ total_cents: null, gst_cents: 500, qst_cents: 500 }))), ["taxes"]);
});

test("une seule taxe lue : signalée seulement si elle dépasse sa part du total", () => {
  assert.deepEqual(taxFlags(r({ qst_cents: null })), []);
  assert.deepEqual(taxFlags(r({ gst_cents: null })), []);
  assert.deepEqual(codes(taxFlags(r({ total_cents: 8500, gst_cents: 900, qst_cents: null }))), ["taxes"]);
  assert.deepEqual(codes(taxFlags(r({ total_cents: 8500, gst_cents: null, qst_cents: 1500 }))), ["taxes"]);
});

test("rien à contrôler quand les taxes ne sont pas lues", () => {
  assert.deepEqual(taxFlags(r({ gst_cents: null, qst_cents: null })), []);
  assert.deepEqual(taxFlags(r({ total_cents: null, gst_cents: null, qst_cents: null })), []);
  assert.deepEqual(taxFlags(r({ total_cents: null, gst_cents: 370, qst_cents: null })), []);
});

test("date dans le futur", () => {
  assert.equal(isFuture("2026-03-02", "2026-03-01"), true);
  assert.equal(isFuture("2026-03-01", "2026-03-01"), false);
  assert.equal(isFuture("2025-12-31", "2026-03-01"), false);
  assert.equal(isFuture(null, "2026-03-01"), false);
});

test("commerçant comparable : accents, casse, ponctuation", () => {
  assert.equal(vendorKey("  Pâtisserie  St-Léonard inc. "), vendorKey("patisserie st leonard INC"));
  assert.notEqual(vendorKey("Papeterie Centrale"), vendorKey("Papeterie du Centre"));
});

test("doublons probables : même dossier, commerçant, total et date", () => {
  const list = [r({ id: "a" }), r({ id: "b", vendor: "PAPETERIE centrale " }), r({ id: "c", total_cents: 8501 }), r({ id: "d", dossier_id: "d2" }), r({ id: "e", receipt_date: "2026-03-02" })];
  const d = duplicatesOf(list);
  assert.deepEqual(d.get("a"), ["b"]);
  assert.deepEqual(d.get("b"), ["a"]);
  for (const id of ["c", "d", "e"]) assert.equal(d.has(id), false, id);
});

test("pas de doublon quand une des trois valeurs n'est pas lue", () => {
  for (const o of [{ vendor: null }, { vendor: " - " }, { total_cents: null }, { receipt_date: null }]) assert.equal(duplicatesOf([r({ id: "a", ...o }), r({ id: "b", ...o })]).size, 0);
});

test("tous les signalements d'un reçu", () => {
  const list = [r({ id: "a", receipt_date: "2026-04-01", qst_cents: 100 }), r({ id: "b", receipt_date: "2026-04-01", qst_cents: 100 }), r({ id: "c", receipt_date: "2026-04-01", qst_cents: 100 })];
  const flags = flagsOf(list[0], duplicatesOf(list), "2026-03-15");
  assert.deepEqual(codes(flags), ["taxes", "futur", "doublon"]);
  assert.match(flags[2].detail, /^2 autres reçus/);
  assert.deepEqual(flagsOf(r(), duplicatesOf([r()]), "2026-03-15"), []);
});

test("totaux : reçus confirmés de l'année seulement", () => {
  const list = [
    r({ id: "a", status: "valide" }),
    r({ id: "b", status: "valide", total_cents: 4250, gst_cents: null, qst_cents: null }),
    r({ id: "c", status: "valide", total_cents: null, gst_cents: null, qst_cents: null }),
    r({ id: "d", status: "a_verifier", total_cents: 99900 }),
    r({ id: "e", status: "refuse", total_cents: 99900 }),
    r({ id: "f", status: "valide", receipt_date: "2025-12-31", total_cents: 1000 }),
    r({ id: "g", status: "valide", receipt_date: null, total_cents: 1000 }),
  ];
  assert.deepEqual(confirmedTotals(list, 2026), { count: 3, total: 12750, gst: 370, qst: 737, noTotal: 1, otherYears: 1, undated: 1 });
  assert.deepEqual(confirmedTotals(list, 2025), { count: 1, total: 1000, gst: 370, qst: 737, noTotal: 0, otherYears: 3, undated: 1 });
  // Dossier sans année : tous les reçus confirmés comptent.
  assert.deepEqual(confirmedTotals(list, null), { count: 5, total: 14750, gst: 1110, qst: 2211, noTotal: 1, otherYears: 0, undated: 0 });
  assert.deepEqual(confirmedTotals([], 2026), { count: 0, total: 0, gst: 0, qst: 0, noTotal: 0, otherYears: 0, undated: 0 });
});

test("champ CSV : guillemets partout, formules neutralisées", () => {
  assert.equal(csvField("Papeterie"), '"Papeterie"');
  assert.equal(csvField('Chez "Luc", inc.'), '"Chez ""Luc"", inc."');
  for (const s of ["=SOMME(A1)", "+1", "-1", "@cmd", "\tx", "\rx"]) assert.equal(csvField(s), `"'${s}"`, JSON.stringify(s));
  assert.equal(csvField(""), '""');
  assert.equal(csvField("ligne 1\nligne 2"), '"ligne 1\nligne 2"');
});

test("export : reçus confirmés seulement, du plus ancien au plus récent", () => {
  const csv = receiptsCsv([
    r({ id: "a", status: "valide", staff_note: "Ajouté à vos dépenses d'entreprise." }),
    r({ id: "b", status: "a_verifier", vendor: "Jamais exporté" }),
    r({ id: "c", status: "refuse", vendor: "Jamais exporté non plus" }),
    r({ id: "d", status: "valide", vendor: '=HYPERLINK("http://x")', receipt_date: "2026-01-15", total_cents: 4250, gst_cents: null, qst_cents: null, category: null }),
    r({ id: "e", status: "valide", vendor: null, receipt_date: null, total_cents: null, gst_cents: null, qst_cents: null }),
  ]);
  const lines = csv.split("\n");
  assert.equal(lines[0], CSV_HEAD);
  assert.equal(lines.length, 4);
  assert.equal(lines[1], `"2026-01-15","'=HYPERLINK(""http://x"")","","42.50","","","","2026-03-02"`);
  assert.equal(lines[2], `"2026-03-01","Papeterie Centrale","Fournitures","85.00","3.70","7.37","Ajouté à vos dépenses d'entreprise.","2026-03-02"`);
  assert.equal(lines[3], `"","","Fournitures","","","","","2026-03-02"`);
  assert.doesNotMatch(csv, /Jamais exporté/);
  assert.equal(receiptsCsv([]), CSV_HEAD);
});
