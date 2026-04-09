export const PROMPT_TYPES = ["MOVE", "TALK", "CREATE", "WILDCARD"] as const;
export type PromptType = (typeof PROMPT_TYPES)[number];

export const SESSION_STATUSES = ["WAITING", "ACTIVE", "ENDED"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];
