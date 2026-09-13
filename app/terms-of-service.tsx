import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/layout/ScreenContainer";

const LAST_UPDATED = "April 17, 2026";

export default function TermsOfServiceScreen() {
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
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <Text className="font-mont-bold text-xl text-white">
            Terms of Service
          </Text>
        </View>

        <View className="px-4 pb-8">
          <Text className="font-mont text-xs text-text-secondary mb-4">
            Last updated: {LAST_UPDATED}
          </Text>

          <Section title="1. Acceptance of Terms">
            By downloading, installing, or using the HASIO mobile application
            or visiting hasio.com (together, the "Platform"), you agree to be
            bound by these Terms of Service ("Terms"). If you do not agree, do
            not use the Platform. We reserve the right to update these Terms at
            any time. Continued use after changes constitutes acceptance.
          </Section>

          <Section title="2. Account Registration">
            You must provide accurate and complete information when creating an
            account. You are responsible for maintaining the confidentiality of
            your login credentials and for all activity under your account. You
            must be at least 16 years old to use the Platform. Each person may
            only maintain one account.
          </Section>

          <Section title="3. User Roles & Responsibilities">
            The Platform supports multiple user roles:{"\n\n"}
            <BulletList
              items={[
                "Customers: may browse, purchase products, and interact with reels and services.",
                "Sellers (Fournisseur, Importateur, Grossiste): may list products, manage orders, participate in B2B offers and demands. Sellers must provide truthful product descriptions, accurate pricing in Algerian Dinar (DA), and fulfill orders in a timely manner.",
                "Freelancers: may list services and manage client requests. Freelancers must deliver services as described and maintain professional communication.",
              ]}
            />
          </Section>

          <Section title="4. Marketplace Rules">
            <BulletList
              items={[
                "All product listings must be accurate, lawful, and not misleading.",
                "Prices must be displayed in Algerian Dinar (DA).",
                "Sellers are solely responsible for the quality, legality, and delivery of their products.",
                "HASIO is a platform connecting buyers and sellers — we are not a party to transactions between users.",
                "B2B offers, bids, and demand requests are binding once accepted by both parties.",
                "Users must not list prohibited items including counterfeit goods, weapons, drugs, or any items illegal under Algerian law.",
              ]}
            />
          </Section>

          <Section title="5. Orders, Payments, Refunds & Returns">
            <BulletList
              items={[
                "All orders are currently processed as Cash on Delivery (COD).",
                "Buyers must provide accurate delivery information (name, phone, address, wilaya, commune).",
                "Sellers must process orders promptly and update order status (pending → processing → shipped → delivered).",
                "Either party may not cancel an order once it has been marked as 'shipped' without mutual agreement.",
                "HASIO does not handle payments directly and is not responsible for payment disputes between users.",
                "Returns and refunds are negotiated directly between the buyer and the seller. HASIO does not mediate refunds but may suspend sellers who systematically refuse reasonable returns for defective or misrepresented goods.",
              ]}
            />
          </Section>

          <Section title="6. Content, Reels & Moderation">
            <BulletList
              items={[
                "You retain ownership of content you post (products, reels, comments, services).",
                "By posting content, you grant HASIO a non-exclusive, worldwide license to display, distribute, and promote your content within the Platform.",
                "Content must not be offensive, defamatory, fraudulent, or violate any third-party rights.",
                "Any user may report content (product, service, reel, comment, offer, profile) via the in-app report button. We aim to review reports within 48 hours and may remove content, warn, or suspend accounts.",
                "Any user may block other users. Blocked users' content is hidden from your feeds.",
                "We reserve the right to remove any content that violates these Terms without notice.",
              ]}
            />
          </Section>

          <Section title="7. Prohibited Conduct">
            You agree not to:{"\n\n"}
            <BulletList
              items={[
                "Use the Platform for any illegal or unauthorized purpose.",
                "Create fake accounts, impersonate others, or misrepresent your identity.",
                "Manipulate reviews, ratings, likes, or engagement metrics.",
                "Harass, threaten, or abuse other users.",
                "Attempt to gain unauthorized access to the Platform, servers, or user data.",
                "Scrape, crawl, or use automated means to access the Platform.",
                "Interfere with or disrupt the Platform's functionality.",
              ]}
            />
          </Section>

          <Section title="8. Zero-Tolerance Policy">
            We have a zero-tolerance policy for:{"\n\n"}
            <BulletList
              items={[
                "Child sexual abuse material (CSAM) or content that sexualizes minors.",
                "Terrorist content, incitement to violence, or extremist recruitment.",
                "Hate speech targeting protected groups (religion, ethnicity, gender, orientation, disability).",
                "Non-consensual intimate content or sexual content involving any non-consenting party.",
                "Human trafficking, weapons trafficking, or narcotics trafficking.",
              ]}
            />
            {"\n"}
            Violations will result in immediate account termination, removal of
            all content, and reporting to Algerian and applicable foreign
            authorities.
          </Section>

          <Section title="9. Subscriptions & Pro Features">
            Certain features may require a Pro subscription. Pro access is
            currently granted and managed by HASIO administrators and is not
            yet sold through in-app billing. If and when in-app purchases are
            enabled on Android, all digital-goods billing will be processed
            through Google Play Billing in accordance with Google Play's
            payments policy. Subscription terms, pricing, and features are
            displayed within the Platform. We reserve the right to modify
            subscription offerings and pricing with reasonable notice.
          </Section>

          <Section title="10. Third-Party Delivery Providers">
            Shipments are handled by third-party Algerian delivery providers
            (Yalidine, ZR Express, Maystro) when a seller chooses to ship an
            order through them. Your use of those services is subject to each
            provider's own terms and conditions. HASIO is not responsible
            for carrier delays, damage in transit, or lost parcels; disputes
            concerning shipment should be raised with the carrier and the
            seller.
          </Section>

          <Section title="11. Limitation of Liability">
            HASIO is provided "as is" without warranties of any kind. To the
            maximum extent permitted by law:{"\n\n"}
            <BulletList
              items={[
                "We are not liable for any indirect, incidental, or consequential damages.",
                "We are not responsible for the quality, safety, or legality of products or services listed by users.",
                "We are not responsible for the conduct of any user, whether online or offline.",
                "Our total liability shall not exceed the amount you paid to us in the 12 months preceding the claim.",
              ]}
            />
          </Section>

          <Section title="12. Account Termination & Deletion">
            We may suspend or terminate your account at any time if you violate
            these Terms or engage in prohibited conduct. Upon termination, your
            right to use the Platform ceases immediately. You may delete your
            account at any time: in the mobile app via Profile → Delete
            Account, or on the web at https://www.hasio.com/account-deletion.
            Deletion is immediate and irreversible.
          </Section>

          <Section title="13. Governing Law & General Provisions">
            These Terms are governed by the laws of the People's Democratic
            Republic of Algeria. Any disputes arising from these Terms shall be
            resolved in the courts of Algiers, Algeria. If any provision of
            these Terms is held unenforceable, the remaining provisions remain
            in full force. These Terms, together with our Privacy Policy,
            constitute the entire agreement between you and HASIO regarding
            the Platform.
          </Section>

          <Section title="14. Contact Us" last>
            If you have questions about these Terms of Service, contact us
            at:{"\n\n"}
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
      <Text className="font-mont-bold text-base text-white mb-2">{title}</Text>
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
