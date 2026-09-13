import type { SubscriptionPlan } from "./types";

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free Plan",
    price: 0,
    period: "/ month",
    features: [
      "1 Store Profile",
      "10 Products",
      "Basic Visibility",
      "Standard Support",
    ],
    limitations: [
      "No Boosted Posts",
      "No Advanced Analytics",
      "No Seller Badge",
    ],
    ctaText: "Start Free",
  },
  {
    id: "pro",
    name: "Pro Seller",
    price: 12000,
    period: "DA / year",
    features: [
      "5 Store Profiles",
      "200 Products",
      "Advanced Analytics",
      "Seller Badge",
    ],
    benefits: [
      "Priority Support",
      "Boosted visibility in search",
      "Save 6 000 DA compared to monthly",
    ],
    ctaText: "Subscribe Now",
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: 35000,
    period: "DA / month",
    features: [
      "Unlimited Store Profiles",
      "Unlimited Products",
      "White-label Dashboard",
      "Priority Seller Badge",
    ],
    benefits: [
      "Dedicated Account Manager",
      "Custom Branding",
      "API Access",
      "Multi-user Team Access",
    ],
    ctaText: "Contact Sales",
  },
];
