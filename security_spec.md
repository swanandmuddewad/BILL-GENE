# Security Specification - BillGen Pro

## Data Invariants
1. An Item must have a unique ID.
2. An Item must be owned by the user who created it (`userId`).
3. Only the owner can read, update, or delete their items.
4. All IDs must be strictly alphanumeric with underscores or dashes.
5. Item names and prices must be valid (reasonable sizes and types).

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Creating an item with a `userId` that does not match `request.auth.uid`.
2. **Access Violation (Read)**: Attempting to get an item belonging to another user.
3. **Access Violation (Update)**: Attempting to update an item belonging to another user.
4. **Access Violation (Delete)**: Attempting to delete an item belonging to another user.
5. **Shadow Fields**: Adding an unauthorized field like `isAdmin: true` to an item.
6. **Type Mismatch**: Setting `boxPrice` to a string instead of a number.
7. **Size Violation**: Setting a name longer than 100 characters.
8. **ID Poisoning**: Using a 2KB string as a document ID.
9. **State Shortcut**: (N/A for this simple app, but general principle).
10. **PII Leak**: (N/A for this app, but general principle).
11. **Timestamp Spoofing**: Providing a client-side `updatedAt` instead of `request.time`.
12. **Malicious Query**: Trying to list items without filtering by `userId`.

## Test Runner (Verifies Denials)
(Standard firestore rules tests would be implemented here if a test environment was available).
