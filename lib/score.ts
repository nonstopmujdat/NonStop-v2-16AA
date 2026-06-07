export function pointsForEvent(eventType: string) {
  if (eventType === '2PM') return 2;
  if (eventType === '3PM') return 3;
  if (eventType === 'FTM') return 1;
  return 0;
}

export function buildShotLabel(input: { assisted?: boolean; fastBreak?: boolean; secondChance?: boolean; andOne?: boolean; made?: boolean }) {
  if (!input.made) return 'K';
  const tags: string[] = [];
  if (input.assisted) tags.push('AB');
  if (input.fastBreak) tags.push('HH');
  if (input.secondChance) tags.push('IS');
  if (input.andOne) tags.push('FA');
  return tags.length ? tags.join('-') : 'B';
}
