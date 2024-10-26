type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type LowerAscii =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z';
type LowerHex = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';
type UpperHex = Uppercase<LowerHex>;
type HexDigit = Digit | LowerHex | UpperHex;
type UpperAscii = Uppercase<LowerAscii>;

type NameStartChar = LowerAscii | UpperAscii | '_' | ':';
type NameChar = NameStartChar | Digit | '.';
type Err<Msg> = { error: Msg };
type NoMatch<Prefix extends string, Str extends string> = Err<'no match'> & {
  Prefix: Prefix;
  Str: Str;
};

type Derivative<Prefix extends string, Str> =
  Str extends string ?
    string extends Str ? Err<'type "string" cannot be matched'>
    : Str extends '' ? ''
    : Str extends `${Prefix}${infer Rest}` ? Rest
    : NoMatch<Prefix, Str>
  : Err<'Str is not a string'> & { Str: Str };

type Many0<Prefix extends string, Str extends string> =
  Derivative<Prefix, Str> extends infer Result ?
    Result extends NoMatch<any, any> ? Str
    : Result extends Err<any> ? Result
    : Result extends string ?
      Result extends '' ?
        ''
      : Many0<Prefix, Result>
    : Err<'unreachable'> & { Prefix: Prefix; Str: Str; Result: Result }
  : Err<'unreachable'> & { Prefix: Prefix; Str: Str };
type Many1<Prefix extends string, Str extends string> =
  Derivative<Prefix, Str> extends infer Result ?
    Result extends Err<any> ? Result
    : Result extends string ?
      Result extends '' ?
        ''
      : Many0<Prefix, Result>
    : Err<'unreachable'> & { Prefix: Prefix; Str: Str; Result: Result }
  : never;

/** consumes 0 or more name characters */
type MatchNameChars<S extends string> = Many0<NameChar, S>;

/** consumes a name, which must be at least 1 character long */
type MatchName<S extends string> =
  Derivative<NameStartChar, S> extends infer Result ?
    Result extends Err<any> ? Result
    : Result extends string ?
      Result extends '' ?
        ''
      : MatchNameChars<Result>
    : Err<'unreachable'> & { S: S; Result: Result }
  : Err<'unreachable'> & { S: S };

export type NameStr<S extends string> =
  MatchName<S> extends infer Result ?
    Result extends '' ?
      S // matched
    : Result // error
  : Err<'unreachable'> & { S: S };

{
  type _ = NameStr<'abc'>;
  const _: _ = 'abc';
}
{
  type _ = NameStr<'0a'>;
  {
    const _: _['error'] = 'no match';
  }
}

type MatchRefBody<S extends string> =
  S extends `#x${infer Rest extends string}` ? Many1<HexDigit, Rest>
  : S extends `#${infer Rest extends string}` ? Many1<Digit, Rest>
  : MatchName<S>;

type MatchRef<S extends string> =
  MatchRefBody<S> extends infer Result ?
    Result extends Err<any> ? Result
    : Result extends `;${infer Rest extends string}` ? Rest
    : Err<'missing semicolon'> & { S: S; Result: Result }
  : Err<'unreachable'> & { S: S };

// https://www.w3.org/TR/REC-xml/#NT-AttValue
type MatchAttValue<S> =
  S extends string ?
    S extends '' ? ''
    : S extends `${infer NextChar}${infer Rest extends string}` ?
      NextChar extends '"' ? Err<'unescaped quote'>
      : NextChar extends '<' ? Err<'unescaped "<"'>
      : NextChar extends '&' ?
        MatchRef<Rest> extends infer Result ?
          Result extends Err<any> ?
            Result
          : MatchAttValue<Result>
        : Err<'unreachable'> & { S: S }
      : MatchAttValue<Rest>
    : Err<'unreachable'> & { S: S }
  : Err<'S is not a string'> & { S: S };

export type AttValueStr<S extends string> =
  MatchAttValue<S> extends infer Result ?
    Result extends '' ?
      S
    : Result
  : Err<'unreachable'>;

{
  type _ = AttValueStr<'&lt;foo'>;
  const _: _ = '&lt;foo';
}
