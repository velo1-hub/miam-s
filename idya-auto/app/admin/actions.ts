"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { draftDescriptions } from "@/lib/ai/describe";
import { audit, diffOf } from "@/lib/admin/audit";
import { can, demoLogin, demoLogout, getAdminSession, isSupabaseAuth } from "@/lib/admin/auth";
import { getKnowledgeRepository, type KnowledgeEntry } from "@/lib/knowledge";
import { getLeadRepository } from "@/lib/leads";
import type { BookingStatus, LeadStatus } from "@/lib/leads/types";
import { getSettings, saveSettings } from "@/lib/settings";
import type { Settings } from "@/lib/settings/types";
import { getAdminVehicleRepository, publishProblems } from "@/lib/vehicles/admin-repository";
import type { Vehicle, VehicleStatus } from "@/lib/vehicles/types";

async function requireSession(action?: Parameters<typeof can>[1]) {
  const s = await getAdminSession();
  if (!s) redirect("/admin/login");
  if (action && !can(s, action)) throw new Error("forbidden");
  return s;
}

/** Saving revalidates the vehicle page, the inventory and the home page (brief §15). */
function revalidateVehicles(slug?: string) {
  revalidateTag("vehicles", "max");
  if (slug) revalidateTag(`vehicle:${slug}`, "max");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (isSupabaseAuth()) {
    const { supabaseLogin } = await import("@/lib/admin/login-supabase");
    const r = await supabaseLogin(email, password, String(formData.get("totp") ?? ""));
    if (!r.ok) redirect(`/admin/login?error=${r.error}`);
    redirect("/admin");
  }
  const session = await demoLogin(email, password);
  if (!session) redirect("/admin/login?error=credentials");
  redirect("/admin");
}

export async function logoutAction() {
  if (isSupabaseAuth()) {
    const { supabaseLogout } = await import("@/lib/admin/login-supabase");
    await supabaseLogout();
  } else await demoLogout();
  redirect("/admin/login");
}

// ---------- Vehicles ----------
export async function createVehicleAction() {
  const s = await requireSession("vehicles");
  const repo = await getAdminVehicleRepository();
  const v = await repo.create({});
  await audit({ actor: s.userId, actorName: s.fullName, table: "vehicles", rowId: v.id, action: "create", diff: {} });
  redirect(`/admin/vehicules/${v.id}`);
}

export async function saveVehicleAction(vehicle: Vehicle): Promise<{ ok: true; vehicle: Vehicle } | { ok: false; error: string }> {
  const s = await requireSession("vehicles");
  const repo = await getAdminVehicleRepository();
  const before = await repo.get(vehicle.id);
  if (!before) return { ok: false, error: "introuvable" };
  const saved = await repo.upsert({ ...before, ...vehicle });
  const diff = diffOf(before, saved, ["priceCad", "status", "stockNumber", "vin", "odometerKm", "featured", "publishedAt"]);
  if (Object.keys(diff).length) await audit({ actor: s.userId, actorName: s.fullName, table: "vehicles", rowId: saved.id, action: diff.priceCad ? "price" : diff.status ? "status" : "update", diff });
  revalidateVehicles(saved.slug);
  return { ok: true, vehicle: saved };
}

export async function publishVehicleAction(id: string): Promise<{ ok: true } | { ok: false; problems: string[] }> {
  const s = await requireSession("vehicles");
  const repo = await getAdminVehicleRepository();
  const v = await repo.get(id);
  if (!v) return { ok: false, problems: ["introuvable"] };
  const problems = publishProblems(v);
  if (problems.length) return { ok: false, problems };
  const saved = await repo.upsert({ ...v, status: "available", publishedAt: v.publishedAt ?? new Date().toISOString() });
  await audit({ actor: s.userId, actorName: s.fullName, table: "vehicles", rowId: id, action: "publish", diff: { status: { from: v.status, to: "available" } } });
  revalidateVehicles(saved.slug);
  return { ok: true };
}

export async function setVehicleStatusAction(ids: string[], status: VehicleStatus) {
  const s = await requireSession("vehicles");
  const repo = await getAdminVehicleRepository();
  await repo.setStatus(ids, status);
  for (const id of ids) await audit({ actor: s.userId, actorName: s.fullName, table: "vehicles", rowId: id, action: "status", diff: { status: { from: "?", to: status } } });
  revalidateVehicles();
}

export async function deleteVehicleAction(id: string) {
  const s = await requireSession("delete");
  const repo = await getAdminVehicleRepository();
  await repo.remove(id);
  await audit({ actor: s.userId, actorName: s.fullName, table: "vehicles", rowId: id, action: "delete", diff: {} });
  revalidateVehicles();
  redirect("/admin/vehicules");
}

export async function draftDescriptionAction(vehicle: Partial<Vehicle>): Promise<{ fr: string; en: string } | null> {
  await requireSession("vehicles");
  return draftDescriptions(vehicle);
}

// ---------- Leads & bookings ----------
export async function updateLeadAction(id: string, patch: { status?: LeadStatus; assignedTo?: string | null }) {
  const s = await requireSession("leads");
  const repo = await getLeadRepository();
  const before = await repo.getLead(id);
  const after = await repo.updateLead(id, patch);
  if (before && after) await audit({ actor: s.userId, actorName: s.fullName, table: "leads", rowId: id, action: "update", diff: diffOf(before, after, ["status", "assignedTo"]) });
}

export async function addLeadNoteAction(leadId: string, body: string) {
  const s = await requireSession("leads");
  const repo = await getLeadRepository();
  if (body.trim()) await repo.addNote(leadId, s.fullName, body.trim());
}

export async function updateBookingAction(id: string, status: BookingStatus) {
  const s = await requireSession("leads");
  const repo = await getLeadRepository();
  await repo.updateBooking(id, { status });
  await audit({ actor: s.userId, actorName: s.fullName, table: "bookings", rowId: id, action: "status", diff: { status: { from: "?", to: status } } });
}

// ---------- Assistant / knowledge base ----------
export async function upsertKnowledgeAction(entry: KnowledgeEntry) {
  const s = await requireSession("settings");
  const kb = await getKnowledgeRepository();
  await kb.upsert(entry);
  await audit({ actor: s.userId, actorName: s.fullName, table: "knowledge_base", rowId: entry.id, action: "update", diff: {} });
}

export async function removeKnowledgeAction(id: string) {
  const s = await requireSession("settings");
  const kb = await getKnowledgeRepository();
  await kb.remove(id);
  await audit({ actor: s.userId, actorName: s.fullName, table: "knowledge_base", rowId: id, action: "delete", diff: {} });
}

// ---------- Settings ----------
export async function saveSettingsAction(patch: Partial<Settings>): Promise<Settings> {
  const s = await requireSession("settings");
  const before = await getSettings();
  const after = await saveSettings(patch);
  await audit({ actor: s.userId, actorName: s.fullName, table: "settings", rowId: "1", action: "update", diff: diffOf(before, after, Object.keys(patch) as (keyof Settings)[]) });
  revalidateTag("vehicles", "max");
  return after;
}
