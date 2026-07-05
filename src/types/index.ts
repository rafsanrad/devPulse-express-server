export const USER_ROLE = {
  maintainer: "maintainer",
  contributor: "contributor",
} as const;

export type ROLES = (typeof USER_ROLE)[keyof typeof USER_ROLE];