import { storage } from "./storage";
import { db } from "./db";
import { sdrNodes } from "@shared/schema";

export async function seedDatabase() {
  const existingNodes = await db.select().from(sdrNodes);
  if (existingNodes.length > 0) return;

  console.log("Seeding SDR node configuration...");

  await storage.createNode({
    name: "TI0RC Radio Club de Costa Rica",
    url: "http://ti0rc.proxy.kiwisdr.com:8073",
    location: "San Jose, Costa Rica",
    latitude: 9.93,
    longitude: -84.08,
    status: "offline",
    lastSeen: null,
  });

  console.log("SDR node configuration inserted.");
}
