import type { Digit } from '../char';
import type { assert_eq } from '../utils';
type NonEmpty<T extends string> = '' extends T ? never : T;

type _CheckPrefix<P extends string, S extends string> = string extends S | P
  ? never
  : P extends ''
  ? never
  : true;

export type Match<
  P extends string, // should be nonempty
  S extends string // should be specific
> = S extends `${P}${infer R extends string}` ? [true, R] : [false, S];

// type _err<T extends string> = assert_eq<T, `${T}!`>;
// type _e0 = _err<''>;

type _p0 = assert_eq<Match<'a', 'abc'>, [true, 'bc']>;
type _p1 = assert_eq<Match<'a', 'bc'>, [false, 'bc']>;
// type _p2 = assert_eq<MatchesPrefix<'', 'bc'>, never>; // FIXME: never
// type _p3 = assert_eq<MatchesPrefix<'', ''>, never>; // FIXME: never
type _p4 = assert_eq<Match<Digit, '123abc'>, [true, '23abc']>;

export type MustMatch<P extends string, S extends string> = Match<
  P,
  S
> extends [true, infer R extends string]
  ? R
  : never;

type Opt<P extends string, S extends string> = Match<P, S> extends [
  boolean,
  infer R
]
  ? R
  : never;

type _t0 = assert_eq<MustMatch<'a', 'abc'>, 'bc'>;
type _t1 = assert_eq<MustMatch<'x', 'abc'>, 'abc'>;
type _o0 = assert_eq<Opt<'x', 'abc'>, 'abc'>;

export type Many0<P extends string, S extends string> = Match<P, S> extends [
  true,
  infer R extends string
]
  ? Many0<P, R>
  : S;

export type Many1<P extends string, S extends string> = Match<P, S> extends [
  true,
  infer R extends string
]
  ? Many0<P, R>
  : never;

type _m0 = assert_eq<Many0<'a', 'aab'>, 'b'>;
type _m1 = assert_eq<Many1<'a', 'aab'>, 'b'>;
type _m2 = assert_eq<Many0<'x', 'abc'>, 'abc'>;
type _m3 = assert_eq<Many1<'x', 'abc'>, 'abc'>;
type _m4 = assert_eq<Many1<Digit, '123abc'>, 'abc'>;
type _m5 = assert_eq<Many0<Digit, '123abc'>, 'abc'>;

// type _ch0 = _CharRef<'&#123;'>;
// type _ch1 = Err<_CharRef<'&#123;'>>;
// type Distributive = [true, 'a'] | [false, 'b'];
// type Y<T extends [boolean, any]> = true extends T[0] ? T : never;
// type _y0 = Extract<Y<Distributive>, [true, any]>; // [true, "a"]
