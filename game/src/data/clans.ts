// Clãs e linhagens da criação de personagem (seção 7).
// Nenhum clã começa com poderes desbloqueados: `hereditary` descreve o que poderá ser despertado no futuro,
// e a descrição exibida ao jogador não revela requisitos secretos.

export interface Clan {
  id: string;
  name: string;
  /** Texto público mostrado na ficha. */
  blurb: string;
  /** Linhagem associada (para sistemas futuros). Não é exibida ao jogador. */
  hereditary?: string;
  /** Bônus iniciais pequenos e coerentes com o clã. */
  bonus: Partial<Record<string, number>>;
  /** Clã fora de Konoha precisa de explicação para viver na vila. */
  rareInKonoha?: boolean;
}

export const CLANS: Clan[] = [
  { id: 'sem-cla', name: 'Sem clã', blurb: 'Sem herança de sangue. Seu caminho depende só de treino, estudo e escolhas.', bonus: { Inteligência: 1, Resistência: 1 } },
  { id: 'uchiha', name: 'Uchiha', blurb: 'Um sobrenome que pesa em Konoha desde a noite do massacre.', hereditary: 'sharingan', bonus: { Ninjutsu: 1, Percepção: 1 } },
  { id: 'hyuga', name: 'Hyūga', blurb: 'Clã tradicional, conhecido pelo estilo de combate de palma suave.', hereditary: 'byakugan', bonus: { Percepção: 1, Taijutsu: 1 } },
  { id: 'uzumaki', name: 'Uzumaki', blurb: 'Um nome quase esquecido, ligado a reservas de chakra fora do comum.', hereditary: 'uzumaki-vitalidade', bonus: { Chakra: 1, Vitalidade: 1 }, rareInKonoha: true },
  { id: 'senju', name: 'Senju', blurb: 'Descendentes de uma linhagem fundadora, hoje dispersa.', hereditary: 'senju-vitalidade', bonus: { Vitalidade: 1, Chakra: 1 }, rareInKonoha: true },
  { id: 'nara', name: 'Nara', blurb: 'Família de estrategistas, criadores de cervos e manipuladores de sombras.', hereditary: 'sombras', bonus: { Inteligência: 2 } },
  { id: 'yamanaka', name: 'Yamanaka', blurb: 'Floristas da vila e especialistas em técnicas da mente.', hereditary: 'mente', bonus: { Percepção: 1, Genjutsu: 1 } },
  { id: 'akimichi', name: 'Akimichi', blurb: 'Clã de grande força física e apetite ainda maior.', hereditary: 'expansao', bonus: { Força: 1, Vitalidade: 1 } },
  { id: 'aburame', name: 'Aburame', blurb: 'Reservados, vivem em simbiose com insetos.', hereditary: 'insetos', bonus: { Percepção: 1, 'Controle de chakra': 1 } },
  { id: 'inuzuka', name: 'Inuzuka', blurb: 'Lutam lado a lado com cães ninja desde a infância.', hereditary: 'canino', bonus: { Velocidade: 1, Percepção: 1 } },
  { id: 'sarutobi', name: 'Sarutobi', blurb: 'Família ligada à liderança da vila e a muitas naturezas de chakra.', bonus: { Ninjutsu: 1, Inteligência: 1 } },
  { id: 'kaguya', name: 'Kaguya', blurb: 'Clã guerreiro do País da Água, praticamente extinto.', hereditary: 'shikotsumyaku', bonus: { Força: 1, Resistência: 1 }, rareInKonoha: true },
  { id: 'hozuki', name: 'Hōzuki', blurb: 'Família de Kirigakure com afinidade incomum com a água.', hereditary: 'hidratacao', bonus: { Resistência: 1, Chakra: 1 }, rareInKonoha: true },
  { id: 'yuki', name: 'Yuki', blurb: 'Linhagem perseguida no País da Água por causa do próprio sangue.', hereditary: 'hyoton', bonus: { 'Controle de chakra': 1, Velocidade: 1 }, rareInKonoha: true },
  { id: 'kurama', name: 'Kurama', blurb: 'Família de Konoha conhecida pelo talento em ilusões.', hereditary: 'genjutsu-kurama', bonus: { Genjutsu: 2 } },
  { id: 'chinoike', name: 'Chinoike', blurb: 'Um clã apagado dos registros oficiais.', hereditary: 'ketsuryugan', bonus: { Percepção: 1, Resistência: 1 }, rareInKonoha: true },
  { id: 'fuma', name: 'Fūma', blurb: 'Antigo clã de mercenários, hoje espalhado pelo País do Arroz.', bonus: { Bukijutsu: 1, Velocidade: 1 }, rareInKonoha: true },
];

export const CLAN_NAMES = CLANS.map((c) => c.name);
export const clanByName = (name: string) => CLANS.find((c) => c.name === name) ?? CLANS[0];

export const VILLAGES = ['Konoha', 'Suna', 'Kiri', 'Kumo', 'Iwa'] as const;
export const PASTS = ['Família de artesãos', 'Aprendiz de mensageiro', 'Família de viajantes', 'Órfão da vila'] as const;
export const TALENTS = ['Percepção', 'Controle de chakra', 'Taijutsu', 'Inteligência', 'Bukijutsu'] as const;
export const ATTRIBUTE_PICKS = ['Vitalidade', 'Chakra', 'Velocidade', 'Força'] as const;

/** História de origem coerente com aldeia e clã (seção 7). */
export function origin(p: { village: string; clan: string; past: string }): string {
  let t = p.village === 'Konoha'
    ? 'Você cresceu na Vila da Folha.'
    : `Você nasceu em ${p.village} e vive em Konoha sob a tutela de uma família credenciada pela Academia.`;
  const clan = clanByName(p.clan);
  if (clan.id === 'uchiha') t += ' Sua família vivia fora do distrito Uchiha na noite do massacre. Você herdou o nome, e ainda está aprendendo o que ele significa.';
  else if (clan.rareInKonoha) t += ' Um ramo disperso do seu clã preservou o sobrenome em segredo.';
  if (p.past === 'Órfão da vila') t += ' Você mora sozinho num apartamento pago pela vila.';
  else if (p.past === 'Família de viajantes') t += ' Sua família passou anos na estrada antes de se fixar aqui.';
  t += ' Você entra na turma de Iruka para o último período antes do exame de graduação.';
  return t;
}
