import { Doctor, TimeSlot, VisitType } from './types';

export const DOCTORS: Doctor[] = [
  { id: 1, name: '王醫師', specialty: '一般內科', image: 'https://picsum.photos/id/1062/100/100' },
  { id: 2, name: '李醫師', specialty: '心臟科', image: 'https://picsum.photos/id/1025/100/100' },
  { id: 3, name: '張醫師', specialty: '小兒科', image: 'https://picsum.photos/id/1012/100/100' },
  { id: 4, name: '陳醫師', specialty: '骨科', image: 'https://picsum.photos/id/1005/100/100' },
  { id: 5, name: '林醫師', specialty: '中醫針灸', image: 'https://picsum.photos/id/1011/100/100' },
  { id: 6, name: '周醫師', specialty: '家醫科', image: 'https://picsum.photos/id/1027/100/100' },
];

export const TIME_SLOTS: TimeSlot[] = [
  { id: 't1', label: '10:00–11:00' },
  { id: 't2', label: '11:00–12:00' },
  { id: 't3', label: '13:00–14:00' },
  { id: 't4', label: '14:00–15:00' },
];

export const VISIT_TYPES: VisitType[] = [
  { id: 'initial', label: '初診', deduction: '10', value: '初診' },
  { id: 'internal', label: '內科', deduction: '5', value: '內科' },
  { id: 'acupuncture', label: '針灸', deduction: '5', value: '針灸' },
];
