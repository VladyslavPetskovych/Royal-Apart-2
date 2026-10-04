// Room display order helpers (shared by /aparts and /siteRoyal routes).
// Rooms with a numeric `sortOrder` go first (ascending); rooms without it keep
// their original (natural MongoDB) order after them — so before anyone sets an
// order, the result is exactly the same as before.

function hasOrder(room) {
  return room != null && Number.isFinite(room.sortOrder);
}

function sortRooms(rooms) {
  if (!Array.isArray(rooms)) return rooms;
  return rooms
    .map((room, index) => ({ room, index }))
    .sort((a, b) => {
      const aHas = hasOrder(a.room);
      const bHas = hasOrder(b.room);
      if (aHas && bHas) {
        return a.room.sortOrder - b.room.sortOrder || a.index - b.index;
      }
      if (aHas) return -1;
      if (bHas) return 1;
      return a.index - b.index;
    })
    .map(({ room }) => room);
}

// sortOrder for a newly created room so it appears first.
async function getTopSortOrder(Model) {
  const top = await Model.findOne({ sortOrder: { $type: "number" } })
    .sort({ sortOrder: 1 })
    .select("sortOrder")
    .lean();
  return top && Number.isFinite(top.sortOrder) ? top.sortOrder - 1 : 0;
}

module.exports = { sortRooms, getTopSortOrder };
