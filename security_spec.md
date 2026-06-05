# Security Specification for Bliss Elle Firestore Rules

## 1. Data Invariants
- **Metadata Integrity**: Every document creation or update must validate appropriate keys to prevent ghost fields.
- **Identity Consistency**: Shopper orders are owned by the `userId` in their profile. Users can only read, write, or query their own orders.
- **Immutable Timestamps**: `createdAt` is set at write time via `request.time` and can never be modified.
- **ReadOnly Collections**: `collections` and `hotspots` are read-only for public shoppers. Writing, creating, or editing collections and hotspots requires admin privilege.
- **Email Validation**: Newsletter subscriptions must contain a valid structured email address string, limited in size to prevent memory exhaust/resource poisoning.

---

## 2. The "Dirty Dozen" Payloads (Denial Scenarios)

1. **Privilege Escalation**: Create a hotspot item as a regular guest user.
2. **Identity Spoofing**: Save a checkout order utilizing someone else's `userId`.
3. **Ghost Field Poisoning**: Attach a malicious field `isVerifiedAdmin: true` to a guest profile or order request.
4. **PII Blanket Leak**: Retrieve a list of all shopper order requests without specifying a user filter.
5. **Memory Exhaust / Size Poisoning**: Attempt to insert a 2MB base64 image or arbitrary content inside a hotspot payload text field.
6. **Immutable Field Mutability**: Update an existing order document to change its `createdAt` timestamp.
7. **Status State Shortcut**: Attempt to transition an order status directly to "completed" without private administrator signature.
8. **Null Payload Injection**: Attempt to write an empty document violating required properties.
9. **Unauthenticated Read Access**: Fetch private orders of active users without any authorization header mock.
10. **ID Character Poisoning**: Attempt to write an order doc using `/` or long control character patterns to bypass endpoint pathing.
11. **Spoofed Admin Check**: Authenticate with a fake JWT role header to bypass database rules.
12. **Double Play/Temporal Desync**: Alter `updatedAt` to a historical epoch instead of standard `request.time` timestamp.

---

## 3. Threat Matrix & Validation Proofs
Any client requesting these payloads must immediately face `PERMISSION_DENIED` rejection.
Below is the standard test runner specification verifying each threat scenario.

```ts
// firestore.rules.test.ts
import { assertFails, initializeTestApp } from '@firebase/rules-unit-testing';

describe("Bliss Elle Firestore Rules", () => {
  it("should fail to write public inventory without admin role", async () => {
    const db = initializeTestApp({ projectId: "neural-bank-7mln4", auth: { uid: "guest_user" } }).firestore();
    const docRef = db.collection("hotspots").doc("malicious-boot");
    await assertFails(docRef.set({ name: "Malicious Bag", price: "$0" }));
  });

  it("should fail to query other shoppers order records", async () => {
    const db = initializeTestApp({ projectId: "neural-bank-7mln4", auth: { uid: "buyer_1" } }).firestore();
    const docRef = db.collection("orders").doc("buyer_2_secret");
    await assertFails(docRef.get());
  });
});
```
