# Firestore Database Schema for Slidemoji

## Firestore Basics (for SQL folks)

**SQL → Firestore mapping:**

```
Database → Firebase Project
Table    → Collection
Row      → Document
Column   → Field
```

**Example:**

```
SQL:                          NoSQL (Firestore):
users (table)                 users (collection)
├─ id=1, name=John           ├─ "user123" (document)
├─ id=2, name=Jane           │  ├─ name: "John"
└─ id=3, name=Bob            │  └─ email: "john@..."
														 ├─ "user456" (document)
														 └─ "user789" (document)

puzzles (table)               puzzles (collection)
├─ id=1, emoji=🎉           ├─ "1" (document)
├─ id=2, emoji=🎂           │  ├─ emoji: "🎉"
└─ id=3, emoji=🎈           │  └─ emojiName: "..."
														 └─ "2" (document)
```

**Key differences:**

- ✅ Documents can have nested objects (no JOINs!)
- ✅ No rigid schema (flexible fields)
- ✅ Document ID = row identifier

---

## Collection: `users/{userId}`

Each authenticated user gets ONE document:

```javascript
{
	// Identity (from Google Auth)
	uid: "abc123...",
	email: "user@example.com",
	displayName: "John Doe",
	createdAt: Timestamp,
	updatedAt: Timestamp,

	// User Preferences
	preferences: {
		darkMode: true,
		soundEnabled: true,
		showNumbers: true,
		gridSize: 3,                      // Last played difficulty (3x3 or 4x4)
	},
```
