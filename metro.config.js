// Sentry must wrap the BASE Metro config (debug-id injection + source map upload),
// then NativeWind layers on top. Order matters.
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { withNativeWind } = require("nativewind/metro");

const config = getSentryExpoConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
