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
  if (!id || id.includes('.')) throw new Error(`invalid id "${id}"`);
  if (!lyr || lyr.includes('.')) throw new Error(`invalid layer "${lyr}"`);
  if (lyr) return `${lyr}.${id}`;
  return id;
};
