import { format, formatDistanceToNow, parse, parseISO } from 'date-fns';

export function renderDate(dateTime: string | null | undefined): string {
  if (!dateTime) return '';
  return formatDistanceToNow(parseISO(dateTime), { addSuffix: true });
}

export function convertDateForPicker(date: string | null | undefined): Date | null {
  if (!date) return null;
  return parse(date, 'yyyy-MM-dd', new Date());
}

export function convertTimeForPicker(time: string | null | undefined): Date | null {
  if (!time) return null;
  return parse(time, 'HH:mm:ss', new Date());
}

export function convertPickerDateToCQL(date: Date | null | undefined): string | null {
  if (!date) return null;
  return format(date, 'yyyy-MM-dd');
}

export function convertPickerTimeToCQL(time: Date | null | undefined): string | null {
  if (!time) return null;
  return format(time, 'HH:mm:ss');
}
