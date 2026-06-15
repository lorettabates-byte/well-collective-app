export interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  expiresAt: string;
}

export function isActiveMember(): boolean {
  try {
    const raw = window.localStorage.getItem("memberMembershipStatus");
    if (!raw) return false;
    const cached = JSON.parse(raw) as { active?: boolean };
    return cached.active === true;
  } catch {
    return false;
  }
}

export function getTrialStatus(trialEndsAt?: string): TrialStatus {
  if (!trialEndsAt) {
    return { isActive: false, daysRemaining: 0, expiresAt: "" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(trialEndsAt);
  endDate.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    isActive: daysRemaining > 0,
    daysRemaining: Math.max(0, daysRemaining),
    expiresAt: trialEndsAt,
  };
}
