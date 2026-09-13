/**
 * Saudi Arabia administrative geography — the 13 regions (مناطق) and their main
 * cities, used by the booking/checkout address form.
 *
 * Replaces the inherited Algerian wilaya/commune dataset. `getRegionOptions()`
 * and `getCityOptions()` keep the same option shape the `Dropdown` expects.
 */

export interface Region {
  /** ISO 3166-2:SA subdivision code without the "SA-" prefix. */
  code: string;
  name: string;
  nameAr: string;
  cities: string[];
}

export const regions: Region[] = [
  {
    code: "01",
    name: "Riyadh",
    nameAr: "الرياض",
    cities: [
      "Riyadh", "Diriyah", "Al Kharj", "Al Majma'ah", "Al Quway'iyah",
      "Wadi ad-Dawasir", "Al Zulfi", "Shaqra", "Dawadmi", "Afif", "Hotat Bani Tamim",
    ],
  },
  {
    code: "02",
    name: "Makkah",
    nameAr: "مكة المكرمة",
    cities: [
      "Makkah", "Jeddah", "Ta'if", "Rabigh", "Al Qunfudhah", "Al Lith",
      "Khulais", "Al Jumum", "Turubah", "Ranyah",
    ],
  },
  {
    code: "03",
    name: "Madinah",
    nameAr: "المدينة المنورة",
    cities: ["Madinah", "Yanbu", "Al Ula", "Badr", "Khaybar", "Al Hanakiyah", "Mahd adh Dhahab"],
  },
  {
    code: "04",
    name: "Eastern Province",
    nameAr: "المنطقة الشرقية",
    cities: [
      "Dammam", "Al Khobar", "Dhahran", "Al Ahsa", "Hofuf", "Jubail",
      "Qatif", "Ras Tanura", "Khafji", "Abqaiq", "Hafar Al Batin",
    ],
  },
  {
    code: "05",
    name: "Al-Qassim",
    nameAr: "القصيم",
    cities: ["Buraydah", "Unaizah", "Ar Rass", "Al Mithnab", "Al Bukayriyah", "Riyadh Al Khabra"],
  },
  {
    code: "06",
    name: "Ha'il",
    nameAr: "حائل",
    cities: ["Ha'il", "Baqaa", "Al Ghazalah", "Ash Shinan", "Mawqaq"],
  },
  {
    code: "07",
    name: "Tabuk",
    nameAr: "تبوك",
    cities: ["Tabuk", "Umluj", "Duba", "Haql", "Al Wajh", "Taima", "NEOM"],
  },
  {
    code: "08",
    name: "Northern Borders",
    nameAr: "الحدود الشمالية",
    cities: ["Arar", "Rafha", "Turaif", "Al Uwayqilah"],
  },
  {
    code: "09",
    name: "Jazan",
    nameAr: "جازان",
    cities: ["Jazan", "Sabya", "Abu Arish", "Samtah", "Farasan", "Fifa", "Ad Darb"],
  },
  {
    code: "10",
    name: "Najran",
    nameAr: "نجران",
    cities: ["Najran", "Sharurah", "Habuna", "Badr Al Janub", "Yadamah"],
  },
  {
    code: "11",
    name: "Al Bahah",
    nameAr: "الباحة",
    cities: ["Al Bahah", "Baljurashi", "Al Mandaq", "Al Makhwah", "Qilwah", "Al Aqiq"],
  },
  {
    code: "12",
    name: "Al Jawf",
    nameAr: "الجوف",
    cities: ["Sakaka", "Dumat Al Jandal", "Qurayyat", "Tabarjal"],
  },
  {
    code: "14",
    name: "Asir",
    nameAr: "عسير",
    cities: [
      "Abha", "Khamis Mushait", "Bisha", "Mahayil Asir", "Al Namas",
      "Rijal Almaa", "Sarat Abidah", "Tathlith", "Dhahran Al Janub",
    ],
  },
];

export function getRegionOptions() {
  return regions.map((r) => ({
    label: `${r.name} — ${r.nameAr}`,
    value: r.code,
  }));
}

export function getCityOptions(regionCode: string) {
  const region = regions.find((r) => r.code === regionCode);
  return (region?.cities ?? []).map((c) => ({
    label: c,
    value: c,
  }));
}
