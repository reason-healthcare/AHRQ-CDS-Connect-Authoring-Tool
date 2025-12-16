import isEmpty from 'lodash/isEmpty';

interface Coding {
  code?: string;
  display?: string;
}

interface CodeableConcept {
  text?: string;
  coding?: Coding[];
}

interface Quantity {
  value?: number | null;
  code?: string;
  unit?: string;
}

interface Range {
  low?: Quantity;
  high?: Quantity;
}

interface Ratio {
  numerator?: Quantity;
  denominator?: Quantity;
}

interface Period {
  start?: string;
  end?: string;
}

interface Identifier {
  value?: string;
}

interface HumanName {
  text?: string;
  given?: string[];
  family?: string[];
}

interface Annotation {
  text?: string;
}

interface Address {
  city?: string;
  state?: string;
  country?: string;
}

interface ContactPoint {
  value?: string;
}

interface Reference {
  display?: string;
  reference?: string;
}

export function coding(c: Coding | null | undefined): string {
  if (c == null) {
    return '';
  }

  const text = isEmpty(c.display) ? c.code : c.display;
  return text || '';
}

export function codeableConcept(c: CodeableConcept | null | undefined): string {
  if (c == null) {
    return '';
  }

  // Prefer the concept's text property
  if (!isEmpty(c.text)) {
    return c.text || '';
  }
  // If no text property, loop through codings looking for display (or first code as last resort)
  if (!isEmpty(c.coding)) {
    let name = c.coding.map(c2 => c2.display).find(d => !isEmpty(d));
    if (name == null && c.coding.length > 0) {
      name = c.coding[0].code;
    }
    return name || '';
  }
  return '';
}

export function quantity(q: Quantity | null | undefined): string {
  if (q == null) {
    return '';
  }

  const value = q.value != null ? q.value : '<null>';
  if (!isEmpty(q.code)) {
    return `${value} ${q.code}`;
  } else if (!isEmpty(q.unit)) {
    return `${value} ${q.unit}`;
  }
  return `${value}`;
}

export function range(r: Range | null | undefined): string {
  if (r == null) {
    return '';
  }

  if (r.low && r.high) {
    return `${quantity(r.low)} - ${quantity(r.high)}`;
  } else if (r.low) {
    return `min: ${quantity(r.low)}`;
  } else if (r.high) {
    return `max: ${quantity(r.high)}`;
  }
  return '';
}

export function ratio(r: Ratio | null | undefined): string {
  if (r == null) {
    return '';
  }

  if (r.numerator && r.denominator) {
    return `${quantity(r.numerator)} / ${quantity(r.denominator)}`;
  } else if (r.numerator) {
    return `${quantity(r.numerator)} / <missing>`;
  } else if (r.denominator) {
    return `<missing> / ${quantity(r.denominator)}`;
  }
  return '';
}

export function period(p: Period | null | undefined): string {
  if (p == null) {
    return '';
  }

  if (p.start && p.end) {
    return `${p.start} - ${p.end}`;
  } else if (p.start) {
    return `start: ${p.start}`;
  } else if (p.end) {
    return `end: ${p.end}`;
  }
  return '';
}

export function identifier(i: Identifier | null | undefined): string {
  if (i == null) {
    return '';
  }

  if (i.value != null) {
    return i.value;
  }
  return '';
}

export function humanName(n: HumanName | null | undefined): string {
  if (n == null) {
    return '';
  }

  if (!isEmpty(n.text)) {
    return n.text || '';
  } else if (!isEmpty(n.given) && !isEmpty(n.family)) {
    return `${n.given[0]} ${n.family[0]}`;
  } else if (!isEmpty(n.given)) {
    return n.given[0] || '';
  } else if (!isEmpty(n.family)) {
    return n.family[0] || '';
  }
  return '';
}

export function annotation(n: Annotation | null | undefined): string {
  if (n == null) {
    return '';
  }

  if (n.text != null) {
    if (n.text.length > 50) {
      return `${n.text.slice(0, 47)}...`;
    }
    return n.text;
  }
  return '';
}

export function address(a: Address | null | undefined): string {
  if (a == null) {
    return '';
  }

  const parts: string[] = [];
  if (!isEmpty(a.city)) {
    parts.push(a.city || '');
  }
  if (!isEmpty(a.state)) {
    parts.push(a.state || '');
  }
  if (!isEmpty(a.country)) {
    parts.push(a.country || '');
  }

  return parts.join(', ');
}

export function contactPoint(cp: ContactPoint | null | undefined): string {
  if (cp == null) {
    return '';
  }

  if (cp.value != null) {
    return cp.value;
  }
  return '';
}

export function reference(r: Reference | null | undefined): string {
  if (r == null) {
    return '';
  }

  if (!isEmpty(r.display)) {
    return r.display || '';
  } else if (!isEmpty(r.reference)) {
    return r.reference || '';
  }
  return '';
}

// Note: We don't try to parse sampled data.  We just indicate it is sampled data.
export function sampledData(a: unknown): string {
  if (a == null) {
    return '';
  }
  return '<sampled data>';
}

// Note: We don't try to parse attachment.  We just indicate it is an attachment.
export function attachment(a: unknown): string {
  if (a == null) {
    return '';
  }
  return '<attachment>';
}

// Note: We don't try to parse timing.  We just indicate it is a timing.
export function timing(t: unknown): string {
  if (t == null) {
    return '';
  }
  return '<timing>';
}

// Note: We don't try to parse signature.  We just indicate it is a signature.
export function signature(t: unknown): string {
  if (t == null) {
    return '';
  }
  return '<signature>';
}
