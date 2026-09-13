import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/layout/ScreenContainer";

const LAST_UPDATED = "April 17, 2026";

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card mr-3"
          >
            <Ionicons name="arrow-back" size={20} color="#0D1A12" />
          </Pressable>
          <Text className="font-mont-bold text-xl text-text-primary">
            Privacy Policy
          </Text>
        </View>

        <View className="px-4 pb-8">
          <Text className="font-mont text-xs text-text-secondary mb-4">
            Last updated: {LAST_UPDATED}
          </Text>

          <Section title="1. Introduction">
            HASIO ("we", "our", or "us") operates the HASIO mobile
            application and the hasio.com website (together, the "Platform").
            This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use the Platform. By using the
            Platform, you agree to the collection and use of information in
            accordance with this policy.
          </Section>

          <Section title="2. Information We Collect">
            <BulletList
              items={[
                "Account Information: name, email address, phone number, and password when you create an account.",
                "Profile Information: profile photo, business name, and seller type that you provide.",
                "Transaction Data: order history, cart items, favorites, bids, offers, demand requests, and service requests you create or participate in.",
                "Content: products, reels, services, promotions, comments, and reviews you post.",
                "Device Information: device type, operating system, and unique device identifiers.",
                "Push Notification Token: your Expo push token (stored in your user record) so we can send you order, bid, and activity notifications.",
                "Behavioral / Interaction Data: product views, dwell time, likes, shares, comments, searches, and category browsing. Used to personalize recommendations. Automatically deleted after 90 days.",
                "Location Data: the wilaya and commune you manually enter at checkout for delivery purposes. We do NOT collect GPS or precise device location.",
                "Crash & Diagnostic Data: stack traces, breadcrumbs, and anonymized user ID collected via Sentry when the app encounters an error.",
              ]}
            />
          </Section>

          <Section title="3. How We Use Your Information">
            <BulletList
              items={[
                "Provide, maintain, and improve the Platform and its features.",
                "Process transactions and send related notifications (order updates, bid results, service requests).",
                "Send push notifications about orders, offers, and relevant activity.",
                "Personalize your experience with product, reel, and service recommendations.",
                "Facilitate communication between buyers and sellers.",
                "Monitor and analyze usage trends to improve the Platform.",
                "Detect, prevent, and address technical issues, abuse, and fraud.",
                "Moderate reported content and enforce our Terms of Service.",
              ]}
            />
          </Section>

          <Section title="4. Data Storage & Security">
            Your data is stored on secure servers provided by Convex
            (AWS eu-west-1). We use industry-standard security measures including
            encrypted connections (HTTPS/TLS), authentication tokens, rate
            limiting, SSRF protection on server-side image fetches, and access
            controls. However, no method of electronic transmission or storage
            is 100% secure, and we cannot guarantee absolute security.
          </Section>

          <Section title="5. App Permissions">
            The Android app requests the following permissions:{"\n\n"}
            <BulletList
              items={[
                "INTERNET: required to communicate with our backend.",
                "POST_NOTIFICATIONS: required on Android 13+ to deliver push notifications. You can deny or revoke this at any time from system settings.",
                "READ_MEDIA_IMAGES / READ_EXTERNAL_STORAGE: required when you upload product photos, avatars, or banners.",
                "CAMERA: optional, only used if you choose to capture a photo directly from the upload screen.",
              ]}
            />
          </Section>

          <Section title="6. Data Sharing & Sub-Processors">
            We do not sell your personal information. We share data only with
            the parties below and only to operate the Platform:{"\n\n"}
            <BulletList
              items={[
                "Other Users: your public profile, products, services, and reels are visible to other users. Phone numbers are shared only when both parties agree to a transaction (accepted bid, accepted service request, accepted demand response).",
                "Convex (AWS eu-west-1): database and file storage provider.",
                "Expo (USA): push notification delivery.",
                "Google (USA): Google Sign-In (if you choose it).",
                "Sentry (Germany / USA): crash reporting; receives stack traces, breadcrumbs, device info, and an anonymized user ID.",
                "OpenRouter, Anthropic, Google Gemini (USA): AI smart search, auto-description, and image studio. Product images and text are sent only when you actively trigger these features.",
                "Yalidine, ZR Express, Maystro (Algeria): delivery providers. When a seller ships your order, we send them your name, phone, address, wilaya, and commune.",
                "Legal Requirements: when required by law, regulation, or legal process.",
              ]}
            />
            {"\n"}
            Some of these providers are located outside Algeria and the European
            Union. Data transferred to them is protected by the providers'
            standard contractual terms and encryption in transit.
          </Section>

          <Section title="7. Legal Basis for Processing (GDPR)">
            If you are located in the European Union, we process your personal
            data on the following legal bases:{"\n\n"}
            <BulletList
              items={[
                "Performance of contract: creating your account, processing orders, delivering services you request.",
                "Legitimate interest: fraud prevention, abuse detection, analytics, and improving the Platform.",
                "Consent: push notifications, optional AI features, and optional camera/photo access. You can withdraw consent at any time.",
                "Legal obligation: complying with Algerian and applicable foreign law.",
              ]}
            />
          </Section>

          <Section title="8. Your Rights">
            You have the right to:{"\n\n"}
            <BulletList
              items={[
                "Access and update your personal information through your profile settings.",
                "Permanently delete your account at any time — no email required. In the mobile app: Profile → Delete Account. On the web: https://www.hasio.com/account-deletion. Deletion is immediate and irreversible.",
                "Opt out of push notifications through your device settings or by clearing the token from Profile.",
                "Request a copy of your data by contacting us.",
                "Object to processing, request correction, or lodge a complaint with a supervisory authority (EU users).",
              ]}
            />
            {"\n"}
            When you delete your account, your personal data is removed from our
            database immediately. Past orders and messages are preserved for the
            other party's records but your personal fields are anonymized (name
            replaced with "Deleted user", phone and shipping address cleared).
          </Section>

          <Section title="9. Data Retention">
            <BulletList
              items={[
                "Account data (profile, cart, favorites, push token): kept while your account is active. Removed immediately on account deletion.",
                "Behavioral event data used for recommendations: automatically deleted after 90 days.",
                "Orders and messages: retained indefinitely for the other party's records; your personal fields are anonymized if you delete your account.",
                "Moderation reports: retained for an audit trail so we can act on repeat violations.",
                "Crash / diagnostic data in Sentry: retained per Sentry's default retention (typically 90 days) with anonymized user ID.",
              ]}
            />
          </Section>

          <Section title="10. Cookies & Local Storage">
            On the web, we use a session cookie managed by better-auth to keep
            you signed in. On mobile, we use AsyncStorage to remember whether
            you have completed onboarding and whether you are browsing as a
            guest. We do not use third-party advertising cookies or trackers.
          </Section>

          <Section title="11. Children's Privacy">
            The Platform is not intended for children under the age of 16. We do
            not knowingly collect personal information from children under 16.
            If we discover that a child under 16 has provided us with personal
            information, we will delete it promptly.
          </Section>

          <Section title="12. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the new policy on the
            Platform and updating the "Last updated" date. Your continued use
            of the Platform after changes constitutes acceptance of the updated
            policy.
          </Section>

          <Section title="13. Contact Us" last>
            Data controller: HASIO, Algiers, Algeria.{"\n\n"}
            If you have questions about this Privacy Policy, or wish to exercise
            any of the rights above, contact us at:{"\n\n"}
            <Text className="font-mont-semibold text-primary">
              contact@hasio.com
            </Text>
          </Section>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View className={last ? "" : "mb-5"}>
      <Text className="font-mont-bold text-base text-text-primary mb-2">{title}</Text>
      <Text className="font-mont text-sm text-text-secondary leading-[22px]">
        {children}
      </Text>
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item, i) => (
        <Text
          key={i}
          className="font-mont text-sm text-text-secondary leading-[22px] mb-1.5"
        >
          {"\u2022  "}
          {item}
        </Text>
      ))}
    </>
  );
}
