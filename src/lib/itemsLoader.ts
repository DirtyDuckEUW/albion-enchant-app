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

// Main categories
export type MainCategory = keyof AllItemsStructure;

// Get all items as flat array
export function getAllItems(): ItemData[] {
  const allCategories: MainCategory[] = [
    "Weapons",
    "Head Armor",
    "Chest Armor",
    "Foot Armor",
    "Off-Hands",
  ];

  return allCategories.flatMap((category) =>
    Object.values(typedAllItems[category]).flat()
  );
}

// Get items by main category
export function getItemsByMainCategory(category: MainCategory): ItemData[] {
  return Object.values(typedAllItems[category]).flat();
}

// Get items by subcategory
export function getItemsBySubcategory(
  mainCategory: MainCategory,
  subCategory: string
): ItemData[] {
  return typedAllItems[mainCategory][subCategory] || [];
}

// Get all subcategories for a main category
export function getSubcategories(category: MainCategory): string[] {
  return Object.keys(typedAllItems[category]);
}

// Get all category options for dropdowns
export function getAllCategoryOptions(): Array<{
  key: string;
  label: string;
}> {
  const options: Array<{ key: string; label: string }> = [];

  const mainCategories: MainCategory[] = [
    "Weapons",
    "Head Armor",
    "Chest Armor",
    "Foot Armor",
    "Off-Hands",
  ];

  mainCategories.forEach((mainCat) => {
    getSubcategories(mainCat).forEach((subCat) => {
      options.push({
        key: `${mainCat}.${subCat}`,
        label: `${mainCat}: ${subCat}`,
      });
    });
  });

  return options;
}

// Parse category key "MainCategory.SubCategory"
export function parseCategoryKey(key: string): {
  mainCategory: MainCategory;
  subCategory: string;
} {
  const [mainCategory, subCategory] = key.split(".");
  return {
    mainCategory: mainCategory as MainCategory,
    subCategory: subCategory || "",
  };
}

// Get items by category key
export function getItemsByCategoryKey(categoryKey: string): ItemData[] {
  const { mainCategory, subCategory } = parseCategoryKey(categoryKey);
  return getItemsBySubcategory(mainCategory, subCategory);
}

// Legacy functions for backward compatibility
export function getHeadArmorItems(): ItemData[] {
  return getItemsByMainCategory("Head Armor");
}

export function getChestArmorItems(): ItemData[] {
  return getItemsByMainCategory("Chest Armor");
}

export function getFootArmorItems(): ItemData[] {
  return getItemsByMainCategory("Foot Armor");
}

export function getOffHandItems(): ItemData[] {
  return getItemsByMainCategory("Off-Hands");
}

export function getWeaponItems(): ItemData[] {
  return getItemsByMainCategory("Weapons");
}

export function getOneHandWeapons(): ItemData[] {
  return getWeaponItems().filter((item) => item.Category === "onehand");
}

export function getTwoHandWeapons(): ItemData[] {
  return getWeaponItems().filter((item) => item.Category === "twohand");
}
