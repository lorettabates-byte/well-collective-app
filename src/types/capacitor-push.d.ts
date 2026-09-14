// Ambient fallback for @capacitor/push-notifications.
// TypeScript uses this only when it cannot resolve the installed package
// (occurs under moduleResolution:"bundler" in some CI environments).
// Locally, the installed package's own dist/esm/index.d.ts takes precedence.
declare module "@capacitor/push-notifications" {
  export interface Token {
    value: string;
  }
  export interface RegistrationError {
    error: string;
  }
  export type PermissionState = "prompt" | "prompt-with-rationale" | "granted" | "denied";
  export interface PermissionStatus {
    receive: PermissionState;
  }
  export interface PluginListenerHandle {
    remove(): Promise<void>;
  }
  export interface PushNotificationsPlugin {
    checkPermissions(): Promise<PermissionStatus>;
    requestPermissions(): Promise<PermissionStatus>;
    register(): Promise<void>;
    addListener(event: "registration", listenerFunc: (token: Token) => void): Promise<PluginListenerHandle>;
    addListener(event: "registrationError", listenerFunc: (error: RegistrationError) => void): Promise<PluginListenerHandle>;
  }
  export declare const PushNotifications: PushNotificationsPlugin;
}
