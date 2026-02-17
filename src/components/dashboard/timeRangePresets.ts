export type TimeRangeValue =
  | '10m'
  | '30m'
  | '1h'
  | '3h'
  | '6h'
  | '12h'
  | '24h'
  | '2d'
  | '3d'
  | '1w'
  | '1mo'
  | 'custom';

export interface TimeRange {
  value: TimeRangeValue;
  label: string;
  start?: Date;
  end?: Date;
}

export const TIME_RANGE_PRESETS: Array<Pick<TimeRange, 'value' | 'label'>> = [
  { value: '10m', label: 'Last 10 minutes' },
  { value: '30m', label: 'Last 30 minutes' },
  { value: '1h', label: 'Last 1 hour' },
  { value: '3h', label: 'Last 3 hours' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '12h', label: 'Last 12 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '2d', label: 'Last 2 days' },
  { value: '3d', label: 'Last 3 days' },
  { value: '1w', label: 'Last 1 week' },
  { value: '1mo', label: 'Last 1 month' },
];
