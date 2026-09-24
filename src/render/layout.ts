/** HUD / spawn layout locks (spec-frames.md). */

/** Reserved HUD band from top of playfield inset (~56px). */
export const HUD_BOTTOM = 56;

/** No target center/edge under HUD: spawnY > HUD_BOTTOM + 24 */
export const SPAWN_Y_MIN = HUD_BOTTOM + 24;

export const HUD_PAD_X = 16;
export const HUD_PAD_TOP = 16;
