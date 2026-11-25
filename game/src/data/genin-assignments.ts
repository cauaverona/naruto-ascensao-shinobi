export const SEAL_CLUES = [
  { id: 'selo-livro', x: 256, y: 235, r: 20, label: 'Livro de entregas' },
  { id: 'selo-cera', x: 388, y: 275, r: 20, label: 'Lacre abandonado' },
  { id: 'selo-canhoto', x: 542, y: 250, r: 20, label: 'Canhoto da encomenda' },
] as const;

export const SEAL_DESTINATIONS = [
  { id: 'deposito', label: 'Depósito da vila' },
  { id: 'academia', label: 'Academia Ninja' },
  { id: 'posto', label: 'Posto de guarda' },
] as const;

export const SEAL_CASES = [
  { destination: 'deposito', clues: [
    'A Academia recebeu todos os volumes pela manhã. Não há entrega pendente para lá.',
    'O selo do posto usa a marca de uma torre. Neste pedaço de cera há o desenho de duas chaves.',
    'O recibo menciona repelente para a madeira e prateleiras novas. O lugar guarda material da vila.',
  ] },
  { destination: 'academia', clues: [
    'O depósito fechou a lista de recebimentos antes de a encomenda ser lacrada.',
    'O posto marca a cera com uma torre. O fragmento tem um traço em forma de pincel.',
    'O recibo separa o material em onze kits para a turma de Iruka.',
  ] },
  { destination: 'posto', clues: [
    'O livro da Academia registra giz e papel. A encomenda contém óleo e pavios.',
    'O depósito usa a marca de duas chaves. A cera encontrada tem o contorno de uma torre.',
    'O recibo pede que o material chegue antes da troca da guarda.',
  ] },
] as const;

export const PATROL_POSTS = [
  { id: 'patrulha-luz', x: 504, y: 212, r: 20, label: 'Lanterna da trilha' },
  { id: 'patrulha-fita', x: 282, y: 320, r: 20, label: 'Marca da ronda' },
] as const;

export const MAKI_SPOT = { x: 369, y: 306 } as const;

