import "server-only";

import type { Firestore } from "firebase-admin/firestore";
import type { DataStore, QueryOptions, StoredDoc } from "./types";

/** Removes undefined values; Firestore rejects them. */
function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => clean(item)) as unknown as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const output: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      if (inner !== undefined) output[key] = clean(inner);
    }
    return output as T;
  }
  return value;
}

export class FirestoreStore implements DataStore {
  readonly kind = "firestore" as const;

  constructor(private readonly db: Firestore) {}

  async get<T>(collection: string, id: string): Promise<StoredDoc<T> | null> {
    const snap = await this.db.collection(collection).doc(id).get();
    if (!snap.exists) return null;
    return { ...(snap.data() as T), id: snap.id };
  }

  async set<T>(collection: string, id: string, data: T): Promise<void> {
    await this.db
      .collection(collection)
      .doc(id)
      .set(clean(data) as Record<string, unknown>, { merge: false });
  }

  async merge<T>(collection: string, id: string, data: Partial<T>): Promise<void> {
    await this.db
      .collection(collection)
      .doc(id)
      .set(clean(data) as Record<string, unknown>, { merge: true });
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.db.collection(collection).doc(id).delete();
  }

  private buildQuery(collection: string, options: QueryOptions = {}) {
    let query: FirebaseFirestore.Query = this.db.collection(collection);
    for (const clause of options.where ?? []) {
      query = query.where(clause.field, clause.op, clean(clause.value));
    }
    for (const order of options.orderBy ?? []) {
      query = query.orderBy(order.field, order.direction);
    }
    return query;
  }

  async all<T>(collection: string): Promise<Array<StoredDoc<T>>> {
    return this.query<T>(collection);
  }

  async query<T>(collection: string, options: QueryOptions = {}): Promise<Array<StoredDoc<T>>> {
    let query = this.buildQuery(collection, options);
    if (options.offset) query = query.offset(options.offset);
    if (typeof options.limit === "number") query = query.limit(options.limit);
    const snap = await query.get();
    return snap.docs.map((doc) => ({ ...(doc.data() as T), id: doc.id }));
  }

  async count(collection: string, options: QueryOptions = {}): Promise<number> {
    const query = this.buildQuery(collection, options);
    const snap = await query.count().get();
    return snap.data().count;
  }
}
