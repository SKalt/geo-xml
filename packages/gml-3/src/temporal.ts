// ©️ Steven Kalt
// Spdx-License-Identifier: PolyForm-Noncommercial-1.0.0 OR PolyForm-Free-Trial-1.0.0
import { attrs, Name, NsRegistry, tag, Text } from 'minimxml';
import { type ToGml, GML, type Gml } from './index.js';

export const timePosition =
  /* @__PURE__ */


    (time: Date, id?: string): ToGml =>
    (r?: NsRegistry): Gml => {
      r = r ?? new NsRegistry();
      const gml = r.getOrInsert('gml' as Name, GML);
      return tag(
        gml.qualify('TimePosition' as Name),
        attrs({ [gml.qualify('id' as Name)]: id }),
        time.toISOString() as Text,
      )(r);
    };

export const timeInstant =
  /* @__PURE__ */


    (time: Date, id?: string): ToGml =>
    (r?: NsRegistry) => {
      r = r ?? new NsRegistry();
      const gml = r.getOrInsert('gml' as Name, GML);
      return tag(
        gml.qualify('TimeInstant' as Name),
        attrs({ [gml.qualify('id' as Name)]: id }),
        timePosition(time, id),
      )(r);
    };
