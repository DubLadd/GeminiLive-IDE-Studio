# Security Specification & Test Invariants (Zero-Trust ABAC)

## 1. Data Invariants

1. **User Identity Invariant**:
   - Every document written to `/users/{userId}` must strictly match the authenticated user's UID (`request.auth.uid == userId`).
   - Unauthenticated writes or reads to `/users/{userId}` are strictly rejected.
   - User document deletion is disallowed via client SDK to prevent orphaned data.

2. **App Gallery Invariant**:
   - Every prototype written to `/apps/{appId}` must have `incoming().userId == request.auth.uid`.
   - Modifying someone else's app prototype is strictly rejected.
   - Deleting someone else's app prototype is strictly rejected.
   - List queries must strictly filter by `userId == request.auth.uid` to prevent user query scraping.

3. **Public Health Check**:
   - `/test/connection` is explicitly readable for live connectivity checks.
   - Writes to `/test/**` are blocked.

4. **Catch-All Invariant**:
   - Any collection or path not explicitly granted is denied by default (`match /{document=**} { allow read, write: if false; }`).

---

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)

1. **Ghost Field Injection**: Adding arbitrary admin flags (`{ isAdmin: true, role: 'superadmin' }`) into `/users/{userId}`.
2. **Identity Spoofing**: User A creating or updating `/users/userB` with User A's token.
3. **Unauthenticated Read**: Attempting to read `/users/{userId}` without a valid Firebase auth token.
4. **Unauthenticated Write**: Attempting to set or modify `/users/{userId}` anonymously.
5. **Cross-Tenant App Poisoning**: User A attempting to update `/apps/{appId}` owned by User B.
6. **Cross-Tenant App Deletion**: User A attempting to delete `/apps/{appId}` owned by User B.
7. **Orphaned App Creation**: Creating an app with `userId` set to an arbitrary or spoofed UID.
8. **Denial-of-Wallet Payload**: Creating an app with a title exceeding 200 characters or injecting malformed payloads.
9. **Global User Scraping**: Attempting a collection query on `/users` without document ID bounds.
10. **Public Connection Write Attack**: Attempting to write or delete `/test/connection`.
11. **System Path Traversal**: Attempting to read or write `/system_configs/default` or arbitrary non-allowlisted documents.
12. **Null-Auth Write**: Direct unauthenticated REST mutation against the Firestore endpoints.
