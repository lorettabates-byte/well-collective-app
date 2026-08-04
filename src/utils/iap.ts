import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";

const RC_IOS_KEY = import.meta.env.VITE_REVENUECAT_IOS_KEY as string | undefined;
const ENTITLEMENT_ID = "membership";

let _configured = false;

export async function initIAP(email: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !RC_IOS_KEY) return;

  if (!_configured) {
    try {
      await Purchases.configure({ apiKey: RC_IOS_KEY, appUserID: email || null });
      _configured = true;
      console.log("[IAP] configure() succeeded, key prefix:", RC_IOS_KEY.slice(0, 10));
    } catch (err) {
      console.error("[IAP] configure() FAILED:", JSON.stringify(err));
    }
  }
}

export async function purchaseMembership(): Promise<{
  success: boolean;
  error?: string;
  userCancelled?: boolean;
}> {
  try {
    const configCheck = await Purchases.isConfigured();
    if (!configCheck.isConfigured) {
      return { success: false, error: "IAP not initialized. Please restart the app and try again." };
    }
    const { current } = await Purchases.getOfferings();
    if (!current?.availablePackages?.length) {
      return { success: false, error: "No subscription packages available. Please try again shortly." };
    }
    const pkg = current.availablePackages[0];
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    const isActive = result.customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    return { success: isActive };
  } catch (err: unknown) {
    const e = err as { userCancelled?: boolean; message?: string; code?: string | number };
    if (e.userCancelled) return { success: false, userCancelled: true };
    const detail = e.code ? ` [code ${e.code}]` : "";
    console.error("[IAP] purchaseMembership error:", JSON.stringify(err));
    return { success: false, error: (e.message || "Purchase failed. Please try again.") + detail };
  }
}

export async function checkIAPStatus(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !RC_IOS_KEY) return false;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

export async function restoreIAPPurchases(): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}
