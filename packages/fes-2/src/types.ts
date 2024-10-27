import { Gml } from 'packages/gml-3/src';

const enum FilterType {
  // binary comparisons
  PropertyIsEqualTo = 'PropertyIsEqualTo',
  PropertyIsNotEqualTo = 'PropertyIsNotEqualTo',
  PropertyIsLessThan = 'PropertyIsLessThan',
  PropertyIsGreaterThan = 'PropertyIsGreaterThan',
  PropertyIsLessThanOrEqualTo = 'PropertyIsLessThanOrEqualTo',
  PropertyIsGreaterThanOrEqualTo = 'PropertyIsGreaterThanOrEqualTo',

  PropertyIsLike = 'PropertyIsLike',
  PropertyIsNull = 'PropertyIsNull',
  PropertyIsNil = 'PropertyIsNil',
  PropertyIsBetween = 'PropertyIsBetween',

  // binary spatial filters
  Equals = 'Equals',
  Disjoint = 'Disjoint',
  Touches = 'Touches',
  Within = 'Within',
  Overlaps = 'Overlaps',
  Crosses = 'Crosses',
  Intersects = 'Intersects',
  Contains = 'Contains',
  // distance
  DWithin = 'DWithin',
  Beyond = 'Beyond',
  // spatial relations
  BBOX = 'BBOX',

  // temporal
  After = 'After',
  Before = 'Before',
  Begins = 'Begins',
  BegunBy = 'BegunBy',
  TContains = 'TContains',
  During = 'During',
  EndedBy = 'EndedBy',
  Ends = 'Ends',
  TEquals = 'TEquals',
  Meets = 'Meets',
  MetBy = 'MetBy',
  TOverlaps = 'TOverlaps',
  OverlappedBy = 'OverlappedBy',
  AnyInteracts = 'AnyInteracts',

  ResourceId = 'ResourceId',
}

type Eq = {
  type: FilterType.PropertyIsEqualTo;
  property: string;
  value: string | number | boolean | bigint;
};
type Neq = {
  type: FilterType.PropertyIsNotEqualTo;
  property: string;
  value: string | number | boolean | bigint;
};
type Lt = {
  type: FilterType.PropertyIsLessThan;
  property: string;
  value: string | number | bigint;
};
type Gt = {
  type: FilterType.PropertyIsGreaterThan;
  property: string;
  value: string | number | bigint;
};
type Lte = {
  type: FilterType.PropertyIsLessThanOrEqualTo;
  property: string;
  value: string | number | bigint;
};
type Gte = {
  type: FilterType.PropertyIsGreaterThanOrEqualTo;
  property: string;
  value: string | number | bigint;
};
type Like = {
  type: FilterType.PropertyIsLike;
  property: string;
  value: string;
};
type Null = {
  type: FilterType.PropertyIsNull;
  property: string;
};
type Nil = {
  type: FilterType.PropertyIsNil;
  property: string;
};
type Between = {
  type: FilterType.PropertyIsBetween;
  property: string;
  min: string | number | bigint;
  max: string | number | bigint;
};
type SpatialEq = {
  type: FilterType.Equals;
  property: string;
  geometry: Gml;
};
type SpatialDisjoint = {
  type: FilterType.Disjoint;
  property: string;
  geometry: Gml;
};

type Touches = {
  type: FilterType.Touches;
  property: string;
  geometry: Gml;
};

type Within = {
  type: FilterType.Within;
  property: string;
  geometry: Gml;
};

type Overlaps = {
  type: FilterType.Overlaps;
  property: string;
  geometry: Gml;
};
type Crosses = {
  type: FilterType.Crosses;
  property: string;
  geometry: Gml;
};
type Intersects = {
  type: FilterType.Intersects;
  property: string;
  geometry: Gml;
};
type Contains = {
  type: FilterType.Contains;
  property: string;
  geometry: Gml;
};
type DWithin = {
  type: FilterType.DWithin;
  property: string;
  geometry: Gml;
  distance: number | bigint;
  units: string;
};
type Beyond = {
  type: FilterType.Beyond;
  property: string;
  geometry: Gml;
  distance: number | bigint;
  units: string;
};
type BBOX = {
  type: FilterType.BBOX;
  property: string;
  geometry: Gml;
};

type After = {
  type: FilterType.After;
  property: string;
  value: string;
};

type Before = {
  type: FilterType.Before;
  property: string;
  value: string;
};
type Begins = {
  type: FilterType.Begins;
  property: string;
  value: string;
};
type BegunBy = {
  type: FilterType.BegunBy;
  property: string;
  value: string;
};
type TContains = {
  type: FilterType.TContains;
  property: string;
  value: string;
};
type During = {
  type: FilterType.During;
  property: string;
  value: string;
};
type EndedBy = {
  type: FilterType.EndedBy;
  property: string;
  value: string;
};
type Ends = {
  type: FilterType.Ends;
  property: string;
  value: string;
};
type TEquals = {
  type: FilterType.TEquals;
  property: string;
  value: string;
};
type Meets = {
  type: FilterType.Meets;
  property: string;
  value: string;
};
type MetBy = {
  type: FilterType.MetBy;
  property: string;
  value: string;
};
type TOverlaps = {
  type: FilterType.TOverlaps;
  property: string;
  value: string;
};
type OverlappedBy = {
  type: FilterType.OverlappedBy;
  property: string;
  value: string;
};
type AnyInteracts = {
  type: FilterType.AnyInteracts;
  property: string;
  value: string;
};
type ResourceId = {
  type: FilterType.ResourceId;
  id: string;
};
