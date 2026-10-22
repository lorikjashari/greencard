export interface WhereClause {
  field: string;
  op: "==" | "!=" | "in" | ">" | ">=" | "<" | "<=" | "array-contains";
  value: unknown;
}

export interface QueryOptions {
  where?: WhereClause[];
  orderBy?: Array<{ field: string; direction: "asc" | "desc" }>;
  limit?: number;
  offset?: number;
}

export type StoredDoc<T> = T & { id: string };

/**
 * Minimal document-store interface.
 *
 * Both the file-backed demo store and Firestore implement this. Domain
 * repositories depend only on this interface, so business rules are
 * identical in demo and production.
 */
export interface DataStore {
  readonly kind: "file" | "runtime-cache" | "firestore";
  get<T>(collection: string, id: string): Promise<StoredDoc<T> | null>;
  set<T>(collection: string, id: string, data: T): Promise<void>;
  merge<T>(collection: string, id: string, data: Partial<T>): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  query<T>(collection: string, options?: QueryOptions): Promise<Array<StoredDoc<T>>>;
  count(collection: string, options?: QueryOptions): Promise<number>;
  all<T>(collection: string): Promise<Array<StoredDoc<T>>>;
}

export interface BlobStore {
  readonly kind: "file" | "runtime-cache" | "firebase";
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ data: Buffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
  /** Short-lived URL. File store returns an application route instead. */
  signedUrl(key: string, expiresMs?: number): Promise<string | null>;
}
