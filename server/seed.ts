import { storage } from "./storage";
import { db } from "./db";
import { sdrNodes } from "@shared/schema";

export async function seedDatabase() {
  const existingNodes = await db.select().from(sdrNodes);
  if (existingNodes.length > 0) return;

  console.log("Seeding SDR node configuration...");

  await storage.createNode({
    name: "KiwiSDR San Jose Radio Club",
    url: "kiwisdr.radioclub.cr:8073",
    location: "San Jose, Costa Rica",
    latitude: 9.93,
    longitude: -84.08,
    status: "offline",
    lastSeen: null,
  });

  await storage.createNode({
    name: "KiwiSDR Tamarindo",
    url: "tamarindo.kiwisdr.cr:8073",
    location: "Tamarindo, Guanacaste",
    latitude: 10.30,
    longitude: -85.84,
    status: "offline",
    lastSeen: null,
  });

  await storage.createNode({
    name: "KiwiSDR Puntarenas",
    url: "puntarenas.kiwisdr.cr:8073",
    location: "Puntarenas, Costa Rica",
    latitude: 9.97,
    longitude: -84.83,
    status: "offline",
    lastSeen: null,
  });

  console.log("SDR node configuration inserted.");
}
