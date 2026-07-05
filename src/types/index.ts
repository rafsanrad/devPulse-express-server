export const USER_ROLE = {
  maintainer: "maintainer",
  contributor: "contributor",
} as const;

export type ROLES = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export interface TCreateIssue {
  title: string;
  description: string;
  type: "bug" | "feature_request";
}

export interface TIssueQuery {
  sort?: "newest" | "oldest";
  type?: "bug" | "feature_request";
  status?: "open" | "in_progress" | "resolved";
}