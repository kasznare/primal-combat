export type BattleOutcome = "ongoing" | "player_defeated" | "opponent_defeated";

export function getBattleOutcome(
  playerHealth: number | null | undefined,
  opponentHealth: number | null | undefined
): BattleOutcome {
  if ((playerHealth ?? 0) <= 0) {
    return "player_defeated";
  }

  if ((opponentHealth ?? 1) <= 0) {
    return "opponent_defeated";
  }

  return "ongoing";
}
