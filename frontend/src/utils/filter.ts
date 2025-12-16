interface Suppressable {
  suppress?: boolean;
}

export default function filterUnsuppressed<T extends Suppressable>(items: T[]): T[] {
  return items.filter(item => !item.suppress);
}
