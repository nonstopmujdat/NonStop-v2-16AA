import { v4 as uuidv4 } from 'uuid';

export function createClientEventId(prefix = 'evt') {
  return `${prefix}_${Date.now()}_${uuidv4()}`;
}

export function createLinkedBasketId() {
  return `basket_${Date.now()}_${uuidv4()}`;
}
