import type { SetStoreFunction } from "solid-js/store";

import { ReactiveMap } from "@solid-primitives/map";

import type { Client } from "../Client.js";
import type { Hydrators } from "../hydration/index.js";
import { ObjectStorage } from "../storage/ObjectStorage.js";

/**
 * Abstract Collection type
 */
export abstract class Collection<T> {
  /**
   * Get an existing object
   * @param id Id
   * @returns Object
   */
  abstract get(id: string): T | undefined;

  /**
   * Check whether an id exists in the Collection
   * @param id Id
   * @returns Whether it exists
   */
  abstract has(id: string): boolean;

  /**
   * Delete an object
   * @param id Id
   */
  abstract delete(id: string): void;

  /**
   * Number of stored objects
   * @returns Size
   */
  abstract size(): number;

  /**
   * Iterable of keys in the map
   * @returns Iterable
   */
  abstract keys(): IterableIterator<string>;

  /**
   * Iterable of values in the map
   * @returns Iterable
   */
  abstract values(): IterableIterator<T>;

  /**
   * Iterable of key, value pairs in the map
   * @returns Iterable
   */
  abstract entries(): IterableIterator<[string, T]>;

  /**
   * Execute a provided function over each key, value pair in the map
   * @param cb Callback for each pair
   */
  abstract forEach(
    cb: (value: T, key: string, map: Map<string, T>) => void,
  ): void;

  /**
   * List of values in the map
   * @returns List
   */
  toList(): T[] {
    return [...this.values()];
  }

  /**
   * Filter the collection by a given predicate
   * @param predicate Predicate to satisfy
   */
  filter(predicate: (value: T, key: string) => boolean): T[] {
    const list: T[] = [];
    for (const [key, value] of this.entries()) {
      if (predicate(value, key)) {
        list.push(value);
      }
    }

    return list;
  }

  /**
   * Map the collection using a given callback
   * @param cb Callback
   */
  map<O>(cb: (value: T, key: string) => O): O[] {
    const list: O[] = [];
    for (const [key, value] of this.entries()) {
      list.push(cb(value, key));
    }

    return list;
  }

  /**
   * Find some value based on a predicate
   * @param predicate Predicate to satisfy
   */
  find(predicate: (value: T, key: string) => boolean): T | undefined {
    for (const [key, value] of this.entries()) {
      if (predicate(value, key)) {
        return value;
      }
    }
  }
}

/**
 * Collection backed by a Solid.js Store
 */
export abstract class StoreCollection<T, V> extends Collection<T> {
  #storage = new ObjectStorage<V>();
  #objects = new ReactiveMap<string, T>();
  #closed = false;
  readonly getUnderlyingObject: (id: string) => V;
  readonly updateUnderlyingObject: SetStoreFunction<Record<string, V>>;

  /**
   * Construct store backed collection
   */
  constructor() {
    super();
    this.getUnderlyingObject = (key) => this.#storage.get(key) ?? ({} as V);
    const set = this.#storage.set;
    // Wrapper function that makes the update a no-op if this collection is closed.
    this.updateUnderlyingObject = ((...args: Parameters<typeof set>) => {
      if (!this.#closed) set(...args);
    }) as typeof set;
  }

  /**
   * Get an existing object
   * @param id Id
   * @returns Object
   */
  get(id: string): T | undefined {
    return this.#objects.get(id);
  }

  /**
   * Check whether an id exists in the Collection
   * @param id Id
   * @returns Whether it exists
   */
  has(id: string): boolean {
    return this.#objects.has(id);
  }

  /**
   * Delete an object
   * @param id Id
   */
  delete(id: string): void {
    this.#objects.delete(id);
    this.#storage.set(id, undefined as never);
  }

  /**
   * Close the collection, disallowing any further creation or adding.
   * @internal
   */
  _close(): void {
    this.#closed = true;
  }

  get closed(): boolean {
    return this.#closed;
  }

  /**
   * Drop every object held by this collection. If this collection is not
   * closed, _clear is a no-op.
   * @returns Whether the clear ran
   * @internal
   */
  _clear(): boolean {
    if (!this.#closed) return false;
    for (const id of [...this.#objects.keys()]) {
      this.delete(id);
    }
    return true;
  }

  /**
   * Create a new instance of an object
   * @param id Id
   * @param type Type
   * @param instance Instance
   * @param context Context
   * @param data Data
   */
  create(
    id: string,
    type: keyof Hydrators,
    instance: T,
    context: unknown,
    data?: unknown,
  ): void {
    if (this.#closed) return;
    this.#storage.hydrate(id, type, context, data);
    this.#objects.set(id, instance);
  }

  /**
   * Hydrate a new instance of an object. This function does not add the object to the collection.
   * @param id Id
   * @param type Type
   * @param instance Instance
   * @param context Context
   * @param data Data
   */
  protected hydrate(type: keyof Hydrators, context: unknown, data: object): V {
    return this.#storage.hydrateOnly(type, context, data);
  }

  /**
   * Add a previously hydrated object to the collection
   * @param id Id
   * @param instance Instance
   * @param hydrated Hydrated
   */
  protected add(id: string, instance: T, hydrated: V) {
    if (this.#closed) return;
    this.#storage.add(id, hydrated);
    this.#objects.set(id, instance);
  }

  /**
   * Check whether an object is partially defined
   * @param id Id
   * @returns Whether it is a partial
   */
  isPartial(id: string): boolean {
    return !!(this.getUnderlyingObject(id) as { partial: boolean }).partial;
  }

  /**
   * Number of stored objects
   * @returns Size
   */
  size(): number {
    return this.#objects.size;
  }

  /**
   * Iterable of keys in the map
   * @returns Iterable
   */
  keys(): IterableIterator<string> {
    return this.#objects.keys();
  }

  /**
   * Iterable of values in the map
   * @returns Iterable
   */
  values(): IterableIterator<T> {
    return this.#objects.values();
  }

  /**
   * Iterable of key, value pairs in the map
   * @returns Iterable
   */
  entries(): IterableIterator<[string, T]> {
    return this.#objects.entries();
  }

  /**
   * Execute a provided function over each key, value pair in the map
   * @param cb Callback for each pair
   * @returns Iterable
   */
  forEach(cb: (value: T, key: string, map: Map<string, T>) => void): void {
    return this.#objects.forEach(cb);
  }
}

/**
 * Generic class collection backed by store
 */
export class ClassCollection<T, V> extends StoreCollection<T, V> {
  readonly client: Client;

  /**
   * Create generic class collection
   * @param client Client
   */
  constructor(client: Client) {
    super();
    this.client = client;
  }
}
