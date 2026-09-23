import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Send,
  ShieldCheck,
  Star,
} from "lucide-react-native";
import { setHasSeenOnboarding } from "@/lib/onboardingStorage";
import { useLanguage, type Translate } from "@/i18n/LanguageContext";
import type { RootScreenProps } from "@/navigation/types";

type Props = RootScreenProps<"Onboarding"> & {
  onCompleted?: () => void;
};

type IconComponent = typeof ShieldCheck;

interface Feature {
  icon: IconComponent;
  label: string;
  iconColor?: string;
  iconBg?: string;
}

interface Slide {
  key: string;
  image: number;
  imagePosition: "top" | "bottom";
  showBrand: boolean;
  title: string;
  subtitle: string;
  features?: Feature[];
}

const GREEN = "#16A34A";
const AMBER = "#F59E0B";
const SOFT_GREEN = "#EAF9EE";
const SOFT_AMBER = "#FEF3E2";

function buildSlides(t: Translate): Slide[] {
  return [
    {
      key: "discover",
      image: require("../../assets/onboarding/1st-cropped.png"),
      imagePosition: "bottom",
      showBrand: true,
      title: t("on.s1t"),
      subtitle: t("on.s1s"),
    },
    {
      key: "explore",
      image: require("../../assets/onboarding/2nd.png"),
      imagePosition: "top",
      showBrand: false,
      title: t("on.s2t"),
      subtitle: t("on.s2s"),
      features: [
        {
          icon: ShieldCheck,
          label: t("on.fVerified"),
          iconColor: GREEN,
          iconBg: SOFT_GREEN,
        },
        {
          icon: ClipboardList,
          label: t("on.fWide"),
          iconColor: GREEN,
          iconBg: SOFT_GREEN,
        },
        {
          icon: Star,
          label: t("on.fTrusted"),
          iconColor: AMBER,
          iconBg: SOFT_AMBER,
        },
      ],
    },
    {
      key: "booking",
      image: require("../../assets/onboarding/3rd.png"),
      imagePosition: "top",
      showBrand: false,
      title: t("on.s3t"),
      subtitle: t("on.s3s"),
      features: [
        {
          icon: CalendarCheck,
          label: t("on.fMenu"),
          iconColor: GREEN,
          iconBg: SOFT_GREEN,
        },
        {
          icon: CalendarDays,
          label: t("on.fDetails"),
          iconColor: GREEN,
          iconBg: SOFT_GREEN,
        },
        {
          icon: Send,
          label: t("on.fSend"),
          iconColor: GREEN,
          iconBg: SOFT_GREEN,
        },
      ],
    },
  ];
}

function BrandHeader() {
  const { t } = useLanguage();
  return (
    <View style={styles.brandBlock}>
      <View style={styles.brandRow}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <Text style={styles.brand} accessibilityRole="header">
          Caternet
        </Text>
      </View>
      <Text style={styles.tagline}>{t("on.tagline")}</Text>
    </View>
  );
}

function FeatureRow({ features }: { features: Feature[] }) {
  return (
    <View style={styles.featureRow}>
      {features.map((f, i) => {
        const Icon = f.icon;
        const isLast = i === features.length - 1;
        return (
          <View key={f.label} style={styles.featureCell}>
            <View style={styles.featureItem}>
              <View
                style={[
                  styles.featureIconCircle,
                  { backgroundColor: f.iconBg ?? SOFT_GREEN },
                ]}
              >
                <Icon size={24} color={f.iconColor ?? GREEN} strokeWidth={2} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
            {!isLast ? (
              <ChevronRight
                size={16}
                color="#D4D9DE"
                strokeWidth={2.5}
                style={styles.featureChevron}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function SlideView({ slide, width }: { slide: Slide; width: number }) {
  const { height: winHeight } = useWindowDimensions();
  const topImageHeight = Math.round(
    Math.min(400, Math.max(300, winHeight * 0.44)),
  );

  if (slide.imagePosition === "top") {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={[styles.topImageWrap, { height: topImageHeight }]}>
          <Image
            source={slide.image}
            style={styles.topImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
        <View style={styles.topContent}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
          {slide.features ? <FeatureRow features={slide.features} /> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.bottomContent}>
        <BrandHeader />
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>
      <View style={styles.bottomImageWrap}>
        <Image
          source={slide.image}
          style={styles.bottomImage}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
    </View>
  );
}

export default function OnboardingScreen({ navigation, onCompleted }: Props) {
  const { width } = useWindowDimensions();
  const { t } = useLanguage();
  const slides = useMemo(() => buildSlides(t), [t]);
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await setHasSeenOnboarding();
    onCompleted?.();
    navigation.replace("PhoneAuth");
  };

  const goNext = () => {
    if (index === slides.length - 1) {
      void finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) setIndex(first.index);
    },
  ).current;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={styles.list}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 55 }}
        renderItem={({ item }) => <SlideView slide={item} width={width} />}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
      />

      <View style={styles.footer}>
        <View
          style={styles.dots}
          accessibilityLabel={t("on.step", { i: index + 1, n: slides.length })}
        >
          {slides.map((s, i) => (
            <View
              key={s.key}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <Pressable
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel={
            index === slides.length - 1 ? t("on.start") : t("on.next")
          }
          style={({ pressed }) => [styles.nextBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <ArrowRight size={22} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  list: { flex: 1, backgroundColor: "#FFFFFF" },
  slide: { flex: 1, backgroundColor: "#FFFFFF" },
  // ---- Slide 1 (brand + text top, image bottom, like main.png screen 1) ----
  bottomContent: { paddingHorizontal: 24, paddingTop: 12 },
  brandBlock: { marginBottom: 20 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 12 },
  brand: {
    fontSize: 26,
    fontWeight: "800",
    color: "#172126",
    letterSpacing: -0.3,
  },
  tagline: { fontSize: 12.5, color: "#64727A", marginTop: 5, lineHeight: 17 },
  title: {
    fontSize: 31,
    fontWeight: "800",
    color: "#172126",
    lineHeight: 37,
    letterSpacing: -0.4,
  },
  subtitle: { fontSize: 14, color: "#64727A", lineHeight: 21, marginTop: 10 },
  bottomImageWrap: { flex: 1, marginTop: 8, justifyContent: "flex-start" },
  bottomImage: {
    width: "100%",
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // ---- Slides 2-3 (image top, text bottom, like main.png screens 2-3) ----
  topImageWrap: { width: "100%", backgroundColor: "#FFFFFF" },
  topImage: { width: "100%", height: "100%", backgroundColor: "#FFFFFF" },
  topContent: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 8 },
  // ---- Feature row (3 soft circles + chevrons) ----
  featureRow: {
    flexDirection: "row",
    marginTop: 26,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  featureCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  featureItem: { alignItems: "center", width: 96 },
  featureIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#344054",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 15,
  },
  featureChevron: { marginTop: 19, marginHorizontal: -2 },
  // ---- Footer (dots left, round green arrow right) ----
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 26,
    backgroundColor: "#FFFFFF",
  },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#E3E6E8" },
  dotActive: { width: 22, backgroundColor: "#16A34A" },
  nextBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.85 },
});
