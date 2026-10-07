// Returns the moves that turn `oldOrder` into `newOrder` when applied one
// after another, in the shape of Shopify's MoveInput. Both lists must hold the
// same IDs. Products that are already in place are skipped.
export function computeMoves(oldOrder: string[], newOrder: string[]) {
  const current = [...oldOrder];
  const moves: { id: string; newPosition: string }[] = [];

  newOrder.forEach((id, position) => {
    if (current[position] === id) return;

    current.splice(current.indexOf(id), 1);
    current.splice(position, 0, id);
    moves.push({ id, newPosition: String(position) });
  });

  return moves;
}
