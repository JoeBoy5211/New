import { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const TIKTOK_NOTE =
  'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .58.05.88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z';

/**
 * Full-color brand icons (never monochrome).
 * Built on react-native-svg per Expo SDK 57 docs
 * (https://docs.expo.dev/versions/v57.0.0/sdk/svg.md).
 */
export function InstagramColorIcon({ size = 24 }: { size?: number }) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = `ig-${gid}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#FEDA75" />
          <Stop offset="0.5" stopColor="#D62976" />
          <Stop offset="1" stopColor="#4F5BD5" />
        </LinearGradient>
      </Defs>
      <Rect x="2" y="2" width="20" height="20" rx="5.5" fill={`url(#${id})`} />
      <Rect x="7" y="7" width="10" height="10" rx="2.8" fill="none" stroke="#fff" strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="2.5" fill="none" stroke="#fff" strokeWidth="1.8" />
      <Circle cx="16.9" cy="7.1" r="1.3" fill="#fff" />
    </Svg>
  );
}

export function TikTokColorIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={TIKTOK_NOTE} fill="#25F4EE" transform="translate(-1.2 0.8)" />
      <Path d={TIKTOK_NOTE} fill="#FE2C55" transform="translate(1.2 -0.8)" />
      <Path d={TIKTOK_NOTE} fill="#010101" />
    </Svg>
  );
}

export function TelegramColorIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill="#229ED9" />
      <Path
        d="M9.04 15.9l-.38 3.78c.55 0 .79-.24 1.08-.52l2.6-2.48 5.38 3.94c.99.55 1.69.26 1.96-.91L22.9 6.6c.32-1.45-.52-2.02-1.48-1.66L2.6 12.1c-1.42.55-1.4 1.34-.24 1.7l4.83 1.5L18.4 8.5c.53-.35 1.01-.16.61.2"
        fill="#fff"
      />
    </Svg>
  );
}
