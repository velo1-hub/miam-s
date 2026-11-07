"use client";

import { createLocalListStore } from "@/lib/utils/local-store";

export const COMPARE_MAX = 3;
export const compare = createLocalListStore("idya:compare", COMPARE_MAX);
