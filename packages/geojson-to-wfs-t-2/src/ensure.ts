/**
 * common checks, coercions, and informative errors/ warnings
 */

/**
 * Ensures a layer.id format of an input id.
 * @function
 * @param lyr layer name
 * @param id id, possibly already in correct layer.id format.
 * @return a correctly-formatted gml:id
 */
export const makeId = (lyr: string, id: string): string => {
  if (!id || id.includes(".")) throw new Error(`invalid id "${id}"`);
  if (!lyr || lyr.includes(".")) throw new Error(`invalid layer "${lyr}"`);
  if (lyr) return `${lyr}.${id}`;
  return id;
};

/**
 * return a correctly-formatted typeName
 * @function
 * @param ns namespace
 * @param layer layer name
 * @param typeName typeName to check
 * @return a correctly-formatted typeName
 * @throws if typeName it cannot form a typeName from ns and layer
 */
/*export*/ const getTypeName = (
  ns: string,
  layer: string,
  typeName?: string
): string => {
  if (!typeName && !(ns && layer)) {
    throw new Error(
      `no typename possible: ${JSON.stringify(
        { typeName, ns, layer },
        null,
        2
      )}`
    );
  }
  return typeName || `${layer}`;
};
