// TimePeriod
// <gml:beginPosition>2000-01-01T00:00:00Z</gml:beginPosition>
// <gml:begin>2000-01-01T00:00:00Z</gml:begin>
// or
// <gml:endPosition>2000-01-01T00:00:00Z</gml:endPosition>

import { attrs, Name, Namespaces, tag, Text } from 'packages/minimxml/src';
import { Gml, GML } from '.';

// TimePosition
export const timePosition = (
  time: Date,
  namespaces: Namespaces,
  { id }: { id?: string },
): Gml => {
  const gml = namespaces.getOrInsert('gml' as Name, GML);
  return tag(
    gml.qualify('TimePosition' as Name),
    attrs({ [gml.qualify('id' as Name)]: id }),
    time.toISOString() as Text,
  );
};

export const timeInstant = (
  time: Date,
  namespaces: Namespaces,
  { id }: { id?: string },
): Gml => {
  const gml = namespaces.getOrInsert('gml' as Name, GML);
  return tag(
    gml.qualify('TimeInstant' as Name),
    attrs({ [gml.qualify('id' as Name)]: id }),
    timePosition(time, namespaces, {}),
  );
};
