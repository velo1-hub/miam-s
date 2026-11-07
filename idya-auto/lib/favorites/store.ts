"use client";

import { createLocalListStore } from "@/lib/utils/local-store";

export const favorites = createLocalListStore("idya:favorites", 50);
