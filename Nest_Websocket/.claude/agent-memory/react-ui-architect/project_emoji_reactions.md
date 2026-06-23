---
name: project-emoji-reactions
description: Emoji picker and message reactions feature added to the chat frontend
metadata:
  type: project
---

Emoji picker + message reactions were implemented without any external emoji library — all Unicode strings inline.

**Socket events added:**
- `add_reaction` / `remove_reaction` emitted from client via `socketService.addReaction / removeReaction`
- `reaction_added` / `reaction_removed` received from server via `socketService.onReactionAdded / onReactionRemoved`

**Store actions added to `useChatStore`:** `addReaction(messageId, reaction)` and `removeReaction(messageId, userId, emoji)`. Both loop over all conversations in the `messages` map to find the target message by id.

**Key design decisions:**
- `EmojiPicker` is a standalone `Popover`-based component with category tabs (Smileys, Gestures, Objects, Nature), 32 emojis per category, anchored above the trigger element.
- Emoji inserts at cursor position using `inputRef` + `selectionStart/End` + `requestAnimationFrame` to restore focus.
- `MessageBubble` now requires `currentUserId: string` and `conversationId: string` (both passed down from `MessageList` → `ChatWindow`).
- Reactions are grouped client-side with `groupReactions()` helper producing `Map<emoji, {count, userIds}>`.
- Clicking an existing reaction pill or quick-reaction picker toggles: add if not reacted, remove if already reacted.
- Quick-reaction popover shows 6 emojis: 👍 ❤️ 😂 😮 😢 🙏. Shown on message hover via `onMouseEnter/Leave`.

**Why:** No external emoji library to avoid bundle bloat and dependency churn.
**How to apply:** When extending reactions (e.g., full emoji search), keep EmojiPicker self-contained and avoid adding emoji-picker-react or similar packages.
