/**
 * Narrow selected fields from a DB Row type to specific unions.
 *
 * Given a base type T (from Tables<'...'>) and an Overrides map,
 * replaces each key in Overrides with its narrower type.
 * Extra keys in Overrides (not in T) are added to the result.
 */
export type Narrow<T, Overrides extends Partial<Record<string, unknown>>> = {
  [K in keyof T]: K extends keyof Overrides ? Overrides[K] : T[K]
} & Omit<Overrides, keyof T>
