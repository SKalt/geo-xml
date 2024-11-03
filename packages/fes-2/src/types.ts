// ©️ Steven Kalt
// Spdx-License-Identifier: PolyForm-Noncommercial-1.0.0 OR PolyForm-Free-Trial-1.0.0

export const enum FilterType {
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
