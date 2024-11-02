import {
  attr,
  attrs,
  escapeStr,
  type Name,
  NsRegistry,
  tag,
  ToXml,
  type Xml,
} from 'minimxml';
import { FilterType } from './types.js';
import { FES } from './index.js';

type FesExpr = ToXml<typeof FES> & { readonly _expr: unique symbol };

/**
 * @see  {@link https://docs.ogc.org/is/09-026r2/09-026r2.html#38 | OGC 09-026r2 section 7.5}
 * @param value
 * @param namespaces
 * @param options
 * @returns
 */
export const literal = (
  value: Xml<any>,
  namespaces: NsRegistry,
  options: { type?: Name } = {},
): FesExpr => {
  const fes = namespaces.getOrInsert('fes' as Name, FES);
  const result: ToXml<typeof FES> = tag(
    fes.qualify('Literal' as Name),
    attrs({ type: options.type }),
    value,
  );
  return result as FesExpr;
};

/**
 * @see {@link https://docs.ogc.org/is/09-026r2/09-026r2.html#41|09-026r2 section 7.6}
 * @param params
 * @returns
 */
export const func = (
  name: string,
  namespaces: NsRegistry,
  args: Xml<typeof FES>[],
): ToXml<typeof FES> => {
  const fes = namespaces.getOrInsert('fes' as Name, FES);
  const result: ToXml<typeof FES> = tag(
    fes.qualify('Function' as Name),
    attrs({ name }),
    ...args,
  );
  return result as FesExpr;
};

/**
 *
 * @see {@link https://docs.ogc.org/is/09-026r2/09-026r2.html#33 | OGC 09-026r2 section 7.4}
 * @param ref an XPath expression
 * @param namespaces a mutable object collecting XML namespace declarations
 * @returns a `fes:ValueReference` element
 */
export const valueReference = (
  ref: string,
  namespaces: NsRegistry,
): ToXml<typeof FES> => {
  const fes = namespaces.getOrInsert('fes' as Name, FES);
  const result: ToXml<typeof FES> = tag(
    fes.qualify('ValueReference' as Name),
    [],
    escapeStr(ref),
  );
  return result as FesExpr;
};

type _BinaryComparisonType =
  | FilterType.PropertyIsEqualTo
  | FilterType.PropertyIsNotEqualTo
  | FilterType.PropertyIsLessThan
  | FilterType.PropertyIsGreaterThan
  | FilterType.PropertyIsLessThanOrEqualTo
  | FilterType.PropertyIsGreaterThanOrEqualTo;

export const enum MatchActionType {
  All = 'All',
  Any = 'Any',
  One = 'One',
}

const _binaryComparison =
  (op: _BinaryComparisonType) =>
  (
    a: FesExpr,
    b: FesExpr,
    namespaces: NsRegistry,
    options: { matchCase?: boolean; matchAction?: MatchActionType } = {},
  ): ToXml<typeof FES> => {
    const fes = namespaces.getOrInsert('fes' as Name, FES);
    const { matchAction, matchCase } = options;
    return tag(fes.qualify(op), attrs({ matchCase, matchAction }), a, b);
  };

export const propertyIsEqualTo = _binaryComparison(
  FilterType.PropertyIsEqualTo,
);
export const propertyIsNotEqualTo = _binaryComparison(
  FilterType.PropertyIsNotEqualTo,
);
export const propertyIsLessThan = _binaryComparison(
  FilterType.PropertyIsLessThan,
);
export const propertyIsGreaterThan = _binaryComparison(
  FilterType.PropertyIsGreaterThan,
);
export const propertyIsLessThanOrEqualTo = _binaryComparison(
  FilterType.PropertyIsLessThanOrEqualTo,
);
export const propertyIsGreaterThanOrEqualTo = _binaryComparison(
  FilterType.PropertyIsGreaterThanOrEqualTo,
);
/** @see {@link https://docs.ogc.org/is/09-026r2/09-026r2.html#51|09-026r2 section 7.7.3.4: PropertyIsLike operator} */
export const propertyIsLike = (
  property: string,
  value: string,
  namespaces: NsRegistry,
  options: {
    matchCase?: boolean;
    wildCard?: string;
    singleChar?: string;
    escapeChar?: string;
  } = { wildCard: '*', singleChar: '#', escapeChar: '!' },
): ToXml<typeof FES> => {
  const { matchCase, wildCard, singleChar, escapeChar } = options;
  const fes = namespaces.getOrInsert('fes' as Name, FES);

  return tag(
    fes.qualify('PropertyIsLike' as Name),
    attrs({ matchCase, wildCard, singleChar, escapeChar }),
    valueReference(property, namespaces),
    literal(escapeStr(value), namespaces),
  );
};

/**
 * @see {@link https://docs.ogc.org/is/09-026r2/09-026r2.html#52|09-026r2 section 7.7.3.5 PropertyIsNull operator}
 * @param property an {@link FesExpr} representing a property, typically a {@link valueReference}
 */
export const propertyIsNull = (
  property: FesExpr,
  namespaces: NsRegistry,
): ToXml<typeof FES> => {
  const fes = namespaces.getOrInsert('fes' as Name, FES);
  return tag(fes.qualify('PropertyIsNull' as Name), [], property);
};

export const propertyIsNil = (
  property: FesExpr,
  namespaces: NsRegistry,
  nilReason?: string,
): ToXml<typeof FES> => {
  const fes = namespaces.getOrInsert('fes' as Name, FES);
  return tag(
    fes.qualify('PropertyIsNil' as Name),
    attrs({ nilReason }),
    property,
  );
};
/** @see {@link https://docs.ogc.org/is/09-026r2/09-026r2.html#54|09-026r2 7.7.3.7 PropertyIsBetween operator} */
export const propertyIsBetween = (
  property: FesExpr,
  lower: FesExpr, // inclusive
  upper: FesExpr, // inclusive
  namespaces: NsRegistry,
): ToXml<typeof FES> => {
  const fes = namespaces.getOrInsert('fes' as Name, FES);
  return tag(
    fes.qualify('PropertyIsBetween' as Name),
    [],
    property,
    tag(fes.qualify('LowerBoundary'), [], lower),
    tag(fes.qualify('UpperBoundary'), [], upper),
  );
};

/** construct a `<fes:ResourceId rid=??/>` element */
export const idFilter =
  (id: string): ToXml<typeof FES> =>
  (namespaces: NsRegistry): Xml<typeof FES> => {
    const fes = namespaces.getOrInsert('fes' as Name, FES);
    return tag(fes.qualify('ResourceId' as Name), [attr('rid', escapeStr(id))])(
      namespaces,
    );
  };
