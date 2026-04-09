import { PromptType, SessionStatus } from "@/lib/constants";

export type SessionState = {
  id: string;
  code: string;
  status: SessionStatus;
  currentTeamIndex: number;
  round: number;
  currentPrompt: string | null;
  currentPromptType: PromptType | null;
  board: PromptType[];
  teams: Array<{
    id: string;
    name: string;
    position: number;
    captainClientId: string | null;
    lastDiceRoll: number | null;
    token: string;
  }>;
  activeTeamId: string | null;
};
