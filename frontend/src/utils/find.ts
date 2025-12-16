/**
 * Finds the closest element that matches the given tag, walking the parent tree until one is found
 * @param element - The element to start at
 * @param tagName - The tag name of the element to find
 * @return The matched element, or null if none is found
 */
export function findClosest(element: Node | null, tagName: string): Node | null {
  const expectedTagName = tagName.toUpperCase();
  let el: Node | null = element;
  while (el) {
    if ((el as Element).tagName === expectedTagName) {
      return el;
    }

    el = el.parentNode;
  }
  return null;
}

/**
 * Finds the value in the given object at the given path
 * @param object - The object to search in
 * @param path - The name of the path to find
 */
export function findValueAtPath(object: Record<string, unknown>, path: string | string[]): unknown {
  let pathArray: string[];
  if (typeof path === 'string') {
    pathArray = path.split('.');
  } else {
    pathArray = [...path];
  }

  if (pathArray.length > 1) {
    if (!pathArray[0].length) {
      pathArray.shift();

      return findValueAtPath(object, pathArray);
    }

    const e = pathArray.shift();
    if (e === undefined) {
      return object;
    }
    const nextObject = object[e];
    if (
      Object.prototype.toString.call(nextObject) === '[object Object]' ||
      Object.prototype.toString.call(nextObject) === '[object Array]'
    ) {
      return findValueAtPath(nextObject as Record<string, unknown>, pathArray);
    }

    return findValueAtPath({}, pathArray);
  }

  // Probably at the root
  if (
    pathArray[0] === undefined ||
    object[pathArray[0]] === undefined ||
    (object[pathArray[0]] as unknown[]).length === 0
  ) {
    return object;
  }

  return object[pathArray[0]];
}
