/**
 * Static mappings for Algerian delivery providers.
 * Yalidine & ZR Express use integer wilaya IDs (1–58).
 * Maystro uses integer wilaya IDs (1–58).
 * Our system has 69 wilayas (post-2019 reform). Wilayas 59–69 fall back to their parent wilaya.
 */

// Mapping: our wilaya code string → provider integer ID
// Wilayas 1–58 map 1:1. Wilayas 59–69 (2019 reform) map to parent.
const REFORM_WILAYA_PARENT: Record<string, string> = {
  "59": "33", // Bordj Badji Mokhtar → Illizi (was Tamanrasset area, maps to nearest)
  "60": "47", // Djanet → Ghardaia territory parent... Actually: Timimoun → Adrar
  "61": "01", // Timimoun → Adrar
  "62": "30", // Touggourt → Ouargla
  "63": "49", // In Salah → Timimoun... Actually: In Guezzam → Tamanrasset
  "64": "11", // In Guezzam → Tamanrasset
  "65": "30", // El Meghaier → Ouargla (actually El Oued area)
  "66": "39", // El Meniaa → El Oued... Actually: Ain Salah → Tamanrasset
  "67": "11", // Ain Salah (In Salah) → Tamanrasset
  "68": "30", // El Meghaier → Ouargla
  "69": "47", // El Meniaa → Ghardaia
};

export function getProviderWilayaId(wilayaCode: string): number {
  const code = wilayaCode.padStart(2, "0");
  const num = parseInt(code, 10);
  if (num >= 1 && num <= 58) return num;
  // 2019 reform wilayas → parent
  const parent = REFORM_WILAYA_PARENT[code];
  if (parent) return parseInt(parent, 10);
  // Fallback: return 16 (Alger)
  return 16;
}

// French names for wilayas 1–58 (used by Yalidine API)
const WILAYA_FRENCH_NAMES: Record<number, string> = {
  1: "Adrar", 2: "Chlef", 3: "Laghouat", 4: "Oum El Bouaghi", 5: "Batna",
  6: "Bejaia", 7: "Biskra", 8: "Bechar", 9: "Blida", 10: "Bouira",
  11: "Tamanrasset", 12: "Tebessa", 13: "Tlemcen", 14: "Tiaret", 15: "Tizi Ouzou",
  16: "Alger", 17: "Djelfa", 18: "Jijel", 19: "Setif", 20: "Saida",
  21: "Skikda", 22: "Sidi Bel Abbes", 23: "Annaba", 24: "Guelma", 25: "Constantine",
  26: "Medea", 27: "Mostaganem", 28: "M'Sila", 29: "Mascara", 30: "Ouargla",
  31: "Oran", 32: "El Bayadh", 33: "Illizi", 34: "Bordj Bou Arreridj",
  35: "Boumerdes", 36: "El Tarf", 37: "Tindouf", 38: "Tissemsilt",
  39: "El Oued", 40: "Khenchela", 41: "Souk Ahras", 42: "Tipaza",
  43: "Mila", 44: "Ain Defla", 45: "Naama", 46: "Ain Temouchent",
  47: "Ghardaia", 48: "Relizane", 49: "El M'Ghair", 50: "El Meniaa",
  51: "Ouled Djellal", 52: "Bordj Badji Mokhtar", 53: "Beni Abbas",
  54: "Timimoun", 55: "Touggourt", 56: "Djanet", 57: "In Salah", 58: "In Guezzam",
};

export function getWilayaFrenchName(wilayaCode: string): string {
  const id = getProviderWilayaId(wilayaCode);
  return WILAYA_FRENCH_NAMES[id] ?? "Alger";
}

/**
 * Split a full name into firstname/familyname for providers that require it.
 * For Arabic names: last word = family name, rest = first name.
 */
export function splitName(fullName: string): { firstname: string; familyname: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstname: parts[0] || "N/A", familyname: "N/A" };
  }
  const familyname = parts[parts.length - 1];
  const firstname = parts.slice(0, -1).join(" ");
  return { firstname, familyname };
}
