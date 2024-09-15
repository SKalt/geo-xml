export type assert_eq<Actual extends Expected, Expected> = [Actual] extends [
  Expected
]
  ? [Expected] extends [Actual]
    ? true
    : false
  : never;
