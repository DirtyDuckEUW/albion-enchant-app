import allItemsData from "@/albion-ids/all-items.json";
import type { ItemData } from "@/types";

export interface AllItemsStructure {
  Weapons: Record<string, ItemData[]>;
  "Head Armor": Record<string, ItemData[]>;
  "Chest Armor": Record<string, ItemData[]>;
  "Foot Armor": Record<string, ItemData[]>;
  "Off-Hands": Record<string, ItemData[]>;
}

const typedAllItems = allItemsData as AllItemsStructure;

// Get all items as flat array
export function getAllItems(): ItemData[] {
  const items: ItemData[] = [];

  // Weapons
  Object.values(typedAllItems.Weapons).forEach((weaponGroup) => {
    items.push(...weaponGroup);
  });

  // Head Armor
  Object.values(typedAllItems["Head Armor"]).forEach((armorGroup) => {
    items.push(...armorGroup);
  });

  // Chest Armor
  Object.values(typedAllItems["Chest Armor"]).forEach((armorGroup) => {
    items.push(...armorGroup);
  });

  // Foot Armor
  Object.values(typedAllItems["Foot Armor"]).forEach((armorGroup) => {
    items.push(...armorGroup);
  });

  // Off-Hands
  Object.values(typedAllItems["Off-Hands"]).forEach((offhandGroup) => {
    items.push(...offhandGroup);
  });

  return items;
}

// Get head armor items
export function getHeadArmorItems(): ItemData[] {
  return Object.values(typedAllItems["Head Armor"]).flat();
}

// Get chest armor items
export function getChestArmorItems(): ItemData[] {
  return Object.values(typedAllItems["Chest Armor"]).flat();
}

// Get foot armor items
export function getFootArmorItems(): ItemData[] {
  return Object.values(typedAllItems["Foot Armor"]).flat();
}

// Get off-hand items
export function getOffHandItems(): ItemData[] {
  return Object.values(typedAllItems["Off-Hands"]).flat();
}

// Get weapon items
export function getWeaponItems(): ItemData[] {
  return Object.values(typedAllItems.Weapons).flat();
}

// Get onehand weapons
export function getOneHandWeapons(): ItemData[] {
  return getWeaponItems().filter((item) => item.Category === "onehand");
}

// Get twohand weapons
export function getTwoHandWeapons(): ItemData[] {
  return getWeaponItems().filter((item) => item.Category === "twohand");
}
