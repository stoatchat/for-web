// Merge type provided by https://dev.to/lucianbc/union-type-merging-in-typescript-9al
export type Merge<T extends object> = {
  [k in CommonKeys<T>]: PickTypeOf<T, k>;
} & {
  [k in NonCommonKeys<T>]?: PickTypeOf<T, k>;
};

type PickTypeOf<T, K extends string | number | symbol> =
  K extends AllKeys<T> ? PickType<T, K> : never;

// eslint-disable-next-line
type PickType<T, K extends AllKeys<T>> = T extends { [k in K]?: any }
  ? T[K]
  : undefined;

type Subtract<A, C> = A extends C ? never : A;
type NonCommonKeys<T extends object> = Subtract<AllKeys<T>, CommonKeys<T>>;

// eslint-disable-next-line
type AllKeys<T> = T extends any ? keyof T : never;
type CommonKeys<T extends object> = keyof T;
