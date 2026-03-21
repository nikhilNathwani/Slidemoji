// Shared game configuration
// NOTE: 4x4 difficulty is stashed in feature/4x4-difficulty branch
// Current MVP is 3x3 only for simplicity
export const GRID_SIZE = 3;

// Legacy: kept for potential future difficulty expansion
export const DIFFICULTIES = [{ size: 3, label: "Normal", display: "3×3" }];

// Grid layout (used by gridHelpers.js)
export const GRID_VIEWPORT_PADDING = 40; // Padding on each side of viewport
export const GRID_RIDGE_BORDER = 16; // Ridge border width (8px each side)
export const GRID_MAX_SIZE = 420; // Max grid content size in px (reduced for better vertical centering)
