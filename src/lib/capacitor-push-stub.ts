// Web/PWA stub for @capacitor/push-notifications.
// Capacitor.isNativePlatform() returns false in the browser so none of these
// methods are ever called; they exist only so the bundler can resolve the import.
export const PushNotifications = {
  checkPermissions: async () => ({ receive: "denied" as const }),
  requestPermissions: async () => ({ receive: "denied" as const }),
  register: async () => {},
  addListener: async (_event: string, _handler: unknown) => ({ remove: async () => {} }),
};
export type Token = { value: string };
export type RegistrationError = { error: string };
