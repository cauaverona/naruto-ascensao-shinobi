// Amizade, rivalidade, respeito e confiança, com memória dos acontecimentos (seções 6 e 19).
import type { Bond, Campaign } from '../state/campaign';

export function bond(c: Campaign, id: string, delta: Partial<Bond>, memory?: string) {
  const n = c.npcs[id];
  if (!n) return;
  for (const [k, v] of Object.entries(delta) as [keyof Bond, number][]) {
    n.bond[k] = Math.max(-100, Math.min(100, n.bond[k] + v));
  }
  if (memory && !n.memory.includes(memory)) {
    n.memory.unshift(memory);
    if (n.memory.length > 12) n.memory.length = 12;
  }
}

export function remembers(c: Campaign, id: string, memory: string): boolean {
  return c.npcs[id]?.memory.includes(memory) ?? false;
}

export function bondLabel(b: Bond): string {
  if (teamAffinity(b) === 2) return 'Laço forte';
  if (b.rivalidade >= 30 && b.respeito >= 20) return 'Rival respeitado';
  if (b.amizade >= 45) return 'Amigo próximo';
  if (b.amizade >= 20) return 'Amigo';
  if (b.rivalidade >= 25) return 'Rival';
  if (b.amizade <= -20) return 'Desafeto';
  if (b.amizade > 0 || b.respeito > 0) return 'Colega';
  return 'Desconhecido';
}

export function teamAffinity(b: Bond | undefined): 0 | 1 | 2 {
  if (!b) return 0;
  if (b.confianca >= 45 && Math.max(b.amizade, b.respeito) >= 45) return 2;
  if (b.confianca >= 20 && Math.max(b.amizade, b.respeito) >= 20) return 1;
  return 0;
}
