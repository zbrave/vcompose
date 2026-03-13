const X_OFFSET = 250;
const Y_SPACING = 150;
const BBOX_WIDTH = 200;
const BBOX_HEIGHT = 100;
const MAX_ITERATIONS = 10;

function hasOverlap(
  pos: { x: number; y: number },
  existing: { x: number; y: number }[],
): boolean {
  return existing.some(
    (e) =>
      Math.abs(pos.x - e.x) < BBOX_WIDTH && Math.abs(pos.y - e.y) < BBOX_HEIGHT,
  );
}

export function calculateRecommendedPosition(
  sourcePosition: { x: number; y: number },
  existingPositions: { x: number; y: number }[],
  index: number,
): { x: number; y: number } {
  const candidate = {
    x: sourcePosition.x + X_OFFSET,
    y: sourcePosition.y + index * Y_SPACING,
  };

  let iterations = 0;
  while (hasOverlap(candidate, existingPositions) && iterations < MAX_ITERATIONS) {
    candidate.y += Y_SPACING;
    iterations++;
  }

  return { x: candidate.x, y: candidate.y };
}
