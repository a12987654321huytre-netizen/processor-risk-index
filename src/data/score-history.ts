/**
 * Score history. Rankings are allowed to move.
 *
 * This file is the previous published snapshot. After a research pass, enrich
 * compares live scores to PREVIOUS_SNAPSHOT and attaches rankDelta.
 *
 * First all-50 publication: 6 September 2026. No prior complete leaderboard
 * exists, so deltas start empty. The next pass will show movement.
 */
export const LAST_RECALCULATED = "6 September 2026";
export const LAST_RECALCULATED_ISO = "2026-09-06";

export type ScoreSnapshot = {
  overall: number;
  rank: number;
  confidence: number;
};

/** Previous published index. Empty until the next recalculation has something to diff against. */
export const PREVIOUS_SNAPSHOT: Record<string, ScoreSnapshot> = {};
