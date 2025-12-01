import type { Tier, Enchantment } from "@/types";
import { TIERS, ENCHANTMENTS } from "@/lib/utility";
import resourcesData from "@/albion-ids/resources.json";
import "./PriceInputSection.css";

interface PriceInputSectionProps {
  title: string;
  resourceKey: string;
  values: Record<Tier, Record<Enchantment, string>>;
  onChange: (tier: Tier, enchantment: Enchantment, value: string) => void;
  showEnchantments?: boolean;
}

// Helper function to get UniqueName from resources.json
function getResourceUniqueName(
  resourceKey: string,
  tier: Tier,
  enchantment: Enchantment
): string {
  // Map resourceKey to Resources key or Artifacts
  const resourceMap: Record<string, keyof typeof resourcesData.Resources> = {
    cloth: "Cloth",
    leather: "Leather",
    metalBar: "Metal Bars",
    planks: "Planks",
  };

  // Handle artifacts separately
  if (
    resourceKey === "runes" ||
    resourceKey === "souls" ||
    resourceKey === "relics"
  ) {
    const artifactType =
      resourceKey === "runes"
        ? "RUNE"
        : resourceKey === "souls"
          ? "SOUL"
          : "RELIC";

    // Find the artifact matching the tier
    for (const artifact of resourcesData.Artifacts) {
      if (artifact.UniqueName === `${tier}_${artifactType}`) {
        return artifact.UniqueName;
      }
    }
    return "";
  }

  const resourceCategory = resourceMap[resourceKey];
  if (!resourceCategory) return "";

  const resources = resourcesData.Resources[resourceCategory];
  if (!resources) return "";

  // Search for the matching tier and enchantment in the resources array
  // The UniqueName format is like "T4_CLOTH" or "T4_CLOTH_LEVEL1@1"
  const searchPattern =
    enchantment === "0"
      ? `${tier}_` // e.g., "T4_CLOTH"
      : `${tier}_.*LEVEL${enchantment}@${enchantment}`; // e.g., "T4_CLOTH_LEVEL1@1"

  for (const resource of resources) {
    const uniqueName = resource.UniqueName;

    // For enchantment 0, find exact base tier match without LEVEL
    if (enchantment === "0") {
      if (
        uniqueName.startsWith(tier) &&
        !uniqueName.includes("LEVEL") &&
        !uniqueName.includes("@")
      ) {
        return uniqueName;
      }
    } else {
      // For enchantments 1-4, find the matching LEVEL variant
      if (
        uniqueName.includes(`LEVEL${enchantment}@${enchantment}`) &&
        uniqueName.startsWith(tier)
      ) {
        return uniqueName;
      }
    }
  }

  return "";
}

export default function PriceInputSection({
  title,
  resourceKey,
  values,
  onChange,
  showEnchantments = false,
}: PriceInputSectionProps) {
  if (!showEnchantments) {
    // Only show .0 enchantment for artifacts
    return (
      <section className="price-block">
        <h2>{title}</h2>
        <div className="tiers">
          {TIERS.map((tier) => {
            const uniqueName = getResourceUniqueName(resourceKey, tier, "0");
            const imageUrl = uniqueName
              ? `https://render.albiononline.com/v1/item/${uniqueName}.png?quality=1`
              : "";

            return (
              <label key={`${resourceKey}-${tier}`} className="tier-field">
                <span className="tier-label">
                  {imageUrl && (
                    <img src={imageUrl} alt={tier} className="tier-icon" />
                  )}
                </span>
                <input
                  inputMode="decimal"
                  value={values[tier]["0"]}
                  onChange={(e) => onChange(tier, "0", e.target.value)}
                />
              </label>
            );
          })}
        </div>
      </section>
    );
  }

  // Show all enchantments for resources in a single column
  return (
    <section className="price-block">
      <h2>{title}</h2>
      <div className="tiers">
        {TIERS.map((tier) =>
          ENCHANTMENTS.map((enchantment) => {
            const uniqueName = getResourceUniqueName(
              resourceKey,
              tier,
              enchantment
            );
            const imageUrl = uniqueName
              ? `https://render.albiononline.com/v1/item/${uniqueName}.png?quality=1`
              : "";

            return (
              <label
                key={`${resourceKey}-${tier}-${enchantment}`}
                className="tier-field"
              >
                <span className="tier-label">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={`${tier}.${enchantment}`}
                      className="tier-icon"
                    />
                  )}
                </span>
                <input
                  inputMode="decimal"
                  value={values[tier][enchantment]}
                  onChange={(e) => onChange(tier, enchantment, e.target.value)}
                />
              </label>
            );
          })
        )}
      </div>
    </section>
  );
}
