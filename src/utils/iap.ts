import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";

const RC_IOS_KEY = import.meta.env.VITE_REVENUECAT_IOS_KEY as string | undefined;
const ENTITLEMENT_ID = "membership";

export async function initIAP(email: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !RC_IOS_KEY) return;
  try {
    await Purchases.configure({ apiKey: RC_IOS_KEY });
    if (email) await Purchases.logIn({ appUserID: email });
  } catch (err) {
    console.error("IAP init error:", err);
  }
}

export async function purchaseMembership(): Promise<{
  success: boolean;
  error?: string;
  userCancelled?: boolean;
}> {
  try {
    const { current } = await Purchases.getOfferings();
    if (!current?.availablePackages?.length) {
      return { success: false, error: "No subscription packages available. Please try again shortly." };
    }
    const pkg = current.availablePackages[0];
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    const isActive = result.customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    return { success: isActive };
  } catch (err: unknown) {
    const e = err as { userCancelled?: boolean; message?: string };
    if (e.userCancelled) return { success: false, userCancelled: true };
    return { success: false, error: e.message || "Purchase failed. Please try again." };
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
