/**
 * Minimal in-memory cache with time-to-live (TTL) expiration.
 *
 * Used to avoid repeated round-trips to MongoDB Atlas for data that changes
 * rarely (e.g. role permissions). Entries expire after `ttlMs` and are lazily
 * evicted on read, so no background sweeper is required.
 */
export class TtlCache<T> {
  private readonly store = new Map<string, { value: T; expiresAt: number }>();

  constructor(private readonly ttlMs: number) {}

  /**
   * Returns the cached value for `key` when present and not expired,
   * otherwise undefined.
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Stores `value` under `key` with the cache TTL.
   */
  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /**
   * Removes a single entry. Useful to invalidate the cache right after the
   * underlying data changes.
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Removes every entry. Useful for tests or global invalidation.
   */
  clear(): void {
    this.store.clear();
  }
}
