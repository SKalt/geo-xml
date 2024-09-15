import type { Digit, AlNum } from './char';
import type { MustMatch, Many0, Many1, Match } from './parser/derivatives';
import { assert_eq } from './utils';

// https://www.w3.org/TR/REC-xml/#NT-NameStartChar
// minus some valid non-ascii characters
type NameStartChar = AlNum | '_' | ':';
type NameChar = NameStartChar | '-' | '.';
type _Name<S extends string> = //
  MustMatch<NameStartChar, S> extends infer A extends string
    ? Many1<NameChar, A>
    : never;

type _EntityRef<S extends string> = //
  MustMatch<'&', S> extends infer A extends string
    ? _Name<A> extends infer B extends string
      ? MustMatch<';', B>
      : never
    : never;

type _CharRef<S extends string> = //
  MustMatch<'&#', S> extends infer A extends string
    ? Many1<Digit, A> extends infer B extends string
      ? MustMatch<';', B>
      : never
    : never;

type _c0 = assert_eq<_CharRef<'&#123;'>, ''>;

// https://www.w3.org/TR/REC-xml/#NT-AttValue

type _AttValue<S extends string> = //
  never;
