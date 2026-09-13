// Expo Router 57 (SDK 56+) no longer works with the standalone `@react-navigation/*`
// packages — it ships its own vendored fork. `expo-router/js-top-tabs` exports the
// material top tab navigator already wrapped in `withLayoutContext`, so this file is
// a thin alias that keeps every call site unchanged.
//
// Swipe between tabs (`swipeEnabled`) must stay enabled — it is core UX.
import type { TabNavigationState } from "expo-router";

export { TopTabs as MaterialTopTabs } from "expo-router/js-top-tabs";

/** Equivalent to react-navigation's `ParamListBase`, which expo-router does not re-export. */
type RouteParamList = Record<string, object | undefined>;

/**
 * Props the navigator passes to a custom `tabBar`.
 *
 * expo-router 57 declares its own `MaterialTopTabBarProps` as `any & { … }`, which
 * TypeScript collapses to plain `any` — every `state.routes.map(…)` callback then
 * becomes implicitly `any` under `strict`. Declaring the fields our tab bars actually
 * use keeps them type-safe. Swap back to the upstream type once it is fixed.
 */
export type TopTabBarProps = {
  state: TabNavigationState<RouteParamList>;
  navigation: { navigate: (name: string) => void };
  /** Unused by our tab bars, but the navigator always supplies it. */
  descriptors: Record<string, unknown>;
};
