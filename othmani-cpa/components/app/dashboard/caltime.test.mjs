// Essais des outils de calendrier. Lancer : node --test components/app/dashboard/caltime.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { clashes, fmtDuration, fmtMin, freeRanges, layout, monthWeeks, mtlISO, mtlParts, sameDayInMonth, shiftDay, shiftMonth, weekday } from "./caltime.ts";

test("un instant est lu à l'heure de Montréal, pas à celle de l'appareil", () => {
  assert.deepEqual(mtlParts("2026-11-20T02:24:00Z"), { day: "2026-11-19", min: 21 * 60 + 24 });
  assert.deepEqual(mtlParts("2026-07-01T03:59:00Z"), { day: "2026-06-30", min: 23 * 60 + 59 });
  assert.deepEqual(mtlParts("2027-01-01T04:59:00Z"), { day: "2026-12-31", min: 23 * 60 + 59 });
});

test("heure de Montréal vers instant ISO, été et hiver", () => {
  assert.equal(mtlISO("2026-07-15", 9 * 60), "2026-07-15T13:00:00.000Z");
  assert.equal(mtlISO("2026-12-15", 9 * 60), "2026-12-15T14:00:00.000Z");
  assert.equal(mtlISO("2026-12-31", 23 * 60 + 30), "2027-01-01T04:30:00.000Z");
  assert.equal(mtlISO("pas-une-date", 0), null);
});

test("aller-retour de chaque quart d'heure, y compris les jours de changement d'heure", () => {
  for (const day of ["2026-03-07", "2026-03-08", "2026-03-09", "2026-10-31", "2026-11-01", "2026-11-02", "2027-03-14", "2027-11-07", "2026-06-15"]) {
    for (let min = 0; min < 1440; min += 15) {
      const iso = mtlISO(day, min);
      const back = mtlParts(iso);
      // 8 mars 2026, de 2 h à 3 h : l'heure n'existe pas, elle est reportée d'une heure.
      const gap = (day === "2026-03-08" || day === "2027-03-14") && min >= 120 && min < 180;
      assert.deepEqual(back, { day, min: gap ? min + 60 : min }, `${day} ${min}`);
    }
  }
});

test("changement d'heure : heures exactes", () => {
  assert.equal(mtlISO("2026-03-08", 60), "2026-03-08T06:00:00.000Z");
  assert.equal(mtlISO("2026-03-08", 180), "2026-03-08T07:00:00.000Z");
  assert.equal(mtlISO("2026-03-08", 9 * 60), "2026-03-08T13:00:00.000Z");
  // 1er novembre 2026 : 1 h 30 existe deux fois, on garde la première ; 3 h est à l'heure normale.
  assert.equal(mtlISO("2026-11-01", 90), "2026-11-01T05:30:00.000Z");
  assert.equal(mtlISO("2026-11-01", 180), "2026-11-01T08:00:00.000Z");
  assert.equal(mtlISO("2026-11-01", 9 * 60), "2026-11-01T14:00:00.000Z");
});

test("grille du mois : lundi d'abord, semaines complètes", () => {
  const feb = monthWeeks("2027-02");
  assert.equal(feb.length, 4);
  assert.equal(feb[0][0], "2027-02-01");
  assert.equal(feb[3][6], "2027-02-28");
  const aug = monthWeeks("2026-08");
  assert.equal(aug.length, 6);
  assert.equal(aug[0][0], "2026-07-27");
  assert.equal(aug[5][6], "2026-09-06");
  const dec = monthWeeks("2026-12");
  assert.equal(dec[0][0], "2026-11-30");
  assert.equal(dec.at(-1)[6], "2027-01-03");
  for (const m of ["2026-11", "2024-02", "2027-01"]) for (const w of monthWeeks(m)) { assert.equal(w.length, 7); assert.equal(weekday(w[0]), 1); assert.equal(weekday(w[6]), 0); }
});

test("déplacements de jour et de mois", () => {
  assert.equal(shiftDay("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftDay("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftDay("2026-11-01", 1), "2026-11-02");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(sameDayInMonth("2026-01-31", 1), "2026-02-28");
  assert.equal(sameDayInMonth("2024-01-31", 1), "2024-02-29");
  assert.equal(sameDayInMonth("2026-12-15", 1), "2027-01-15");
  assert.equal(weekday("2026-11-20"), 5);
});

test("plages libres", () => {
  assert.deepEqual(freeRanges([], 540, 1020), [[540, 1020]]);
  assert.deepEqual(freeRanges([{ start: 600, end: 660 }, { start: 840, end: 900 }], 540, 1020), [[540, 600], [660, 840], [900, 1020]]);
  assert.deepEqual(freeRanges([{ start: 500, end: 600 }, { start: 570, end: 700 }, { start: 1000, end: 1100 }], 540, 1020), [[700, 1000]]);
  assert.deepEqual(freeRanges([{ start: 540, end: 1020 }], 540, 1020), []);
});

test("chevauchements dans une colonne", () => {
  const l = layout([{ id: "a", start: 600, end: 660 }, { id: "b", start: 630, end: 690 }, { id: "c", start: 660, end: 700 }, { id: "d", start: 800, end: 830 }]);
  assert.deepEqual(l.get("a"), { lane: 0, lanes: 2, clash: true });
  assert.deepEqual(l.get("b"), { lane: 1, lanes: 2, clash: true });
  assert.deepEqual(l.get("c"), { lane: 0, lanes: 2, clash: true });
  assert.deepEqual(l.get("d"), { lane: 0, lanes: 1, clash: false });
  // Deux rendez-vous qui se suivent ne se chevauchent pas.
  const m = layout([{ id: "a", start: 600, end: 660 }, { id: "b", start: 660, end: 690 }]);
  assert.equal(m.get("a").clash, false);
  assert.equal(m.get("b").clash, false);
  assert.equal(clashes([{ start: 600, end: 660 }], 660, 690).length, 0);
  assert.equal(clashes([{ start: 600, end: 660 }], 630, 690).length, 1);
});

test("heures et durées en mots", () => {
  assert.equal(fmtMin(540), "9 h");
  assert.equal(fmtMin(14 * 60 + 30), "14 h 30");
  assert.equal(fmtMin(9 * 60 + 5), "9 h 05");
  assert.equal(fmtDuration(30), "30 min");
  assert.equal(fmtDuration(60), "1 h");
  assert.equal(fmtDuration(90), "1 h 30");
});
