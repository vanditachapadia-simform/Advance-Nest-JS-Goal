import { ForcedSubject } from '@casl/ability';

export const actions: string[] = [
  'read',
  'manage',
  'create',
  'update',
  'delete',
];

export const subjects: string[] = ['article', 'users', 'all'];

export type Abilities = [
  (typeof actions)[number],
  (
    | (typeof subjects)[number]
    | ForcedSubject<Exclude<(typeof subjects)[number], 'all'>>
  ),
];
