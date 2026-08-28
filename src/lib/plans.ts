export const PLANS = {
  free:       { maxMembers: 50,   maxInstructors: 3,  maxClasses: 5,   price: 0 },
  basic:      { maxMembers: 200,  maxInstructors: 10, maxClasses: 20,  price: 100000 },
  pro:        { maxMembers: 500,  maxInstructors: 25, maxClasses: 50,  price: 500000 },
  enterprise: { maxMembers: 9999, maxInstructors: 99, maxClasses: 99, price: 1000000 },
} as const

export type PlanName = keyof typeof PLANS

export function getPlanLimits(plan: string) {
  return PLANS[plan as PlanName] || PLANS.free
}

// Return objek kolom limit Tenant utk di-set (create/update) dari nama plan.
// Satu sumber kebenaran: PlanName -> limits kolom tenant.
export function applyPlanLimits(plan: string) {
  const l = getPlanLimits(plan)
  return { maxMembers: l.maxMembers, maxInstructors: l.maxInstructors, maxClasses: l.maxClasses }
}
