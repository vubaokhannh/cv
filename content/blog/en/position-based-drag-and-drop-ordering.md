---
title: Position-based drag-and-drop ordering without rewriting the whole list
date: 2025-11-05
summary: How Krello reorders cards and lists with dnd-kit while keeping database writes to a minimum, using position values instead of renumbering everything.
tags: dnd-kit, React, PostgreSQL, Prisma, Kanban
---

Drag-and-drop is the heart of a Kanban board. In Krello I built the interface with React and **dnd-kit**, but the interesting engineering was not the dragging. It was a quiet question underneath: **when a card is dropped in a new place, what do we save?** My goal was **position-based reordering that minimizes unnecessary database updates**.

## The obvious approach and why it hurts

The first idea most people try is to store an integer index per card (0, 1, 2, 3…) and, after every move, renumber the cards. Moving one card to the top of a list of 50 then means up to **50 updates**:

- Writes are proportional to the **list size**, not to the size of the change.
- Concurrent edits conflict: two people reordering the same list can overwrite each other's numbers.
- It produces a lot of real-time traffic, since every renumbered card is a change to broadcast.

What we want is for **moving one card to touch one row**.

## Idea: leave gaps between positions

Instead of consecutive integers, store a **position** as a number with room around it. To place a card between two neighbours, give it a value **between** theirs. Only the moved card changes.

```text
A: 1000    B: 2000    C: 3000

Move C between A and B  ->  C: (1000 + 2000) / 2 = 1500
Result: A 1000, C 1500, B 2000     (one row updated)
```

Dropping at the very top uses a value smaller than the first card; at the very bottom, larger than the last.

```ts
function positionBetween(prev?: number, next?: number): number {
  if (prev === undefined && next === undefined) return 1000; // empty list
  if (prev === undefined) return next! / 2;                  // top
  if (next === undefined) return prev + 1000;                // bottom
  return (prev + next) / 2;                                  // in between
}
```

This is a sketch of the technique rather than Krello's exact code.

## Computing the new position on drop

On drop, dnd-kit tells me which item was dragged and which item it ended up over or after. The steps are:

1. From the **current, sorted** list, find the **neighbours** at the drop target.
2. Compute the new position between them.
3. **Optimistically** update the UI right away so the board feels instant.
4. Send **one request** with the card id, target list id and new position.
5. The server persists the single change and **broadcasts** it to others on the board.

Because the UI is updated before the server answers, the interface stays smooth. If the request fails, the client rolls back to the previous order and shows a message.

## Moving between lists

A card moving to another list changes **two things**: its list and its position within that list. That is still a single row update (`listId` and `position`). Lists are ordered the same way inside the board, so reordering lists uses the same technique.

## The catch: running out of room

Halving repeatedly eventually exhausts the available precision. After enough insertions between the same two neighbours, the values get too close to distinguish.

The standard answer is **rebalancing**: when the gap between neighbours drops below a threshold (or two positions become equal), renumber that **one list** back to evenly spaced values, for example 1000, 2000, 3000. That is a rare, bounded operation, so the common case stays cheap while correctness is preserved.

```ts
const MIN_GAP = 0.001;

if (next - prev < MIN_GAP) {
  await rebalance(listId); // evenly respace this list in a transaction
}
```

Choosing a **decimal or floating-point** type also affects how much room you have, so it is worth deciding deliberately which column type to use.

## Concurrency and consistency

Two users dragging in the same list at the same moment is the realistic stress case:

- Each move computes a position from **its own view** of the list. Because positions are values rather than indexes, two concurrent moves usually still produce a **consistent order**, and ties can be broken by a secondary key such as the card id.
- The server should **sort by position, then a stable tiebreaker**, so every client renders the same order.
- Real-time events carry the **new position**, so other clients simply insert the card at that value instead of recomputing indexes.

## What I like about this design

- **Small writes.** One moved card means one updated row.
- **Fits real-time naturally.** A move is a tiny event, easy to broadcast.
- **Friendly to concurrency.** No global renumbering that people can overwrite.
- **Simple reads.** The board is just `ORDER BY position`.

## Takeaways

- Do not store dense indexes if moves are frequent; store **positions with gaps**.
- A move should **touch only the moved row**.
- Plan for **rebalancing**, even if it rarely runs.
- Update the UI **optimistically** and roll back on failure.
- Add a **stable tiebreaker** so concurrent moves render identically everywhere.
