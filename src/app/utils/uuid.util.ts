import { v4 } from 'uuid';

export const uuid = (): string => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  } else {
    return v4();
  }
}
