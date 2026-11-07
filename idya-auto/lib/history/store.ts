"use client";

import { createLocalListStore } from "@/lib/utils/local-store";

/** Vehicles viewed in this browser — on-device only, powers « Choisis pour vous » (brief §27.3). */
export const viewHistory = createLocalListStore("idya:viewed", 12);
