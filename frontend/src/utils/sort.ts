import { getPatientFirstName, type PatientData } from 'utils/patients';

const sortDifference = (a: string | number, b: string | number): number => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

export function sortAlphabeticallyByKey<T extends Record<string, unknown>>(key: keyof T, key2?: keyof T) {
  return function sortFunc(a: T, b: T): number {
    if (a[key] === b[key]) {
      if (key2) {
        return sortDifference(a[key2] as string | number, b[key2] as string | number);
      }
      return 0;
    }
    return sortDifference(a[key] as string | number, b[key] as string | number);
  };
}

export function sortAlphabeticallyByPatientName(
  a: { name?: { given?: string[] } },
  b: { name?: { given?: string[] } }
): number {
  const aName = getPatientFirstName(a as PatientData);
  const bName = getPatientFirstName(b as PatientData);

  if (aName > bName || (aName && !bName)) {
    return 1;
  } else if (aName < bName || (!aName && bName)) {
    return -1;
  }
  return 0;
}

export function sortMostRecent(a: { updatedAt?: string }, b: { updatedAt?: string }): number {
  if (a.updatedAt > b.updatedAt || (a.updatedAt && !b.updatedAt)) {
    return -1;
  } else if (a.updatedAt < b.updatedAt || (!a.updatedAt && b.updatedAt)) {
    return 1;
  }
  return 0;
}

export function sortByDateEdited(a: { updatedAt?: string }, b: { updatedAt?: string }): number {
  return sortMostRecent(a, b);
}

export function sortByDateCreated(a: { createdAt?: string }, b: { createdAt?: string }): number {
  if (a.createdAt > b.createdAt || (a.createdAt && !b.createdAt)) {
    return -1;
  } else if (a.createdAt < b.createdAt || (!a.createdAt && b.createdAt)) {
    return 1;
  }
  return 0;
}

export function sortByName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name);
}

export function sortByVersion(a: { version: string }, b: { version: string }): number {
  const aprRegex = /\b\d{1}\.\d{1}\.\d{1}\b/;
  if (a.version.match(aprRegex) && b.version.match(aprRegex)) {
    const digitsA = a.version.split('.').map(strNumeral => parseInt(strNumeral, 10));
    const digitsB = b.version.split('.').map(strNumeral => parseInt(strNumeral, 10));

    for (let digitIndex = 0; digitIndex < 3; digitIndex++) {
      if (digitsA[digitIndex] > digitsB[digitIndex]) return -1;
      else if (digitsA[digitIndex] === digitsB[digitIndex]) continue;
      else return 1;
    }
    return 0;
  } else if (a.version.match(aprRegex) && !b.version.match(aprRegex)) {
    return -1;
  } else if (!a.version.match(aprRegex) && b.version.match(aprRegex)) {
    return 1;
  } else if (a.version === '' && b.version !== '') {
    return 1;
  } else if (a.version !== '' && b.version === '') {
    return -1;
  } else {
    return Math.sign(a.version.localeCompare(b.version, 'en'));
  }
}
