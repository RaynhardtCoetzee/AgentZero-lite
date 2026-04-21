// AgentZero Lite — billing layer removed
// Tier → credit grant amounts. Authoritative source used by both the
// subscription service and any future admin tooling. Changing a value here
// does NOT retroactively re-grant historical subscriptions.

export const PRO_CREDITS_PER_CYCLE = 10_000;
export const FOUNDING_CREDITS_ONE_TIME = 50_000;
