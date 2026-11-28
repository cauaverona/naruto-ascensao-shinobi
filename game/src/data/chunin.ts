import type { Spot } from '../render/maps/types';

type Answer = readonly [label: string, correct?: true];
export interface TacticalQuestion {
  id: string;
  prompt: string;
  answers: readonly Answer[];
  explanation: string;
}

export const TACTICAL_QUESTIONS: readonly TacticalQuestion[] = [
  {
    id: 'mensagem',
    prompt: 'A rota de um mensageiro ficou exposta. Um companheiro ferido consegue andar com ajuda. Como você entrega a mensagem sem separar o time?',
    answers: [['Dividir a cobertura e usar uma rota alternativa juntos', true], ['Mandar todos pela rota exposta para ganhar tempo'], ['Levar a mensagem sozinho enquanto os outros esperam']],
    explanation: 'Uma rota alternativa e cobertura em revezamento preservam a mensagem e permitem retirar o companheiro.',
  },
  {
    id: 'pergaminho',
    prompt: 'Na floresta, sua equipe encontra um pergaminho à vista e uma linha fina esticada entre duas raízes. Qual é sua primeira ordem?',
    answers: [['Pedir que o mais rápido puxe o pergaminho'], ['Marcar a linha, cobrir a área e verificar suas extremidades', true], ['Cortar a linha de onde está']],
    explanation: 'Uma linha pode acionar um alarme ou uma armadilha. Localizar as extremidades revela o risco antes de tocar nela.',
  },
  {
    id: 'neblina',
    prompt: 'A neblina esconde a margem. Vocês precisam atravessar e ninguém consegue ver a outra ponta da ponte. Como mantêm a formação?',
    answers: [['Correr em fila para sair da neblina depressa'], ['Separar-se para procurar os dois extremos'], ['Combinar um sinal de parada e avançar até o próximo ponto seguro', true]],
    explanation: 'Um sinal comum permite parar a formação inteira, mesmo sem contato visual constante.',
  },
  {
    id: 'chakra',
    prompt: 'Um aliado já está com pouco chakra. O grupo adversário vigia de longe e ainda não percebeu sua equipe. Como você aproveita a situação?',
    answers: [['Guardar chakra e mudar de posição pela cobertura antes de agir', true], ['Pedir ao aliado que abra a luta com sua técnica mais cara'], ['Usar uma técnica à vista só para descobrir como o inimigo reage']],
    explanation: 'Cobertura e reposicionamento preservam o elemento surpresa e evitam gastar a reserva antes do confronto.',
  },
  {
    id: 'ordem',
    prompt: 'Seu batedor avisa que a trilha estreita ficou bloqueada. O resto da equipe ainda está seguindo a ordem antiga. O que você comunica primeiro?',
    answers: [['A explicação inteira de como o bloqueio se formou'], ['A ordem de parar e o ponto de reunião alternativo', true], ['Um pedido para cada um escolher uma nova rota']],
    explanation: 'Uma ordem curta evita que a formação continue entrando no trecho bloqueado. Os detalhes podem vir depois.',
  },
  {
    id: 'troca',
    prompt: 'Um time adversário propõe trocar pergaminhos. Os dois grupos estão cansados. Como você aceita a troca com segurança?',
    answers: [['Largar o pergaminho e ir buscá-lo depois'], ['Enviar todos para cercar quem trouxe a oferta'], ['Combinar um ponto visível e conferir os selos antes da troca', true]],
    explanation: 'Conferir os selos num ponto visível dá às duas equipes uma condição clara para terminar a troca.',
  },
  {
    id: 'reserva',
    prompt: 'Você tem dois batedores e a rota de volta ainda não foi verificada. Os dois se oferecem para seguir a mesma pista. Como distribui a equipe?',
    answers: [['Um verifica a pista, o outro cobre a retirada e ambos têm um ponto de encontro', true], ['Os dois seguem a pista e decidem quando voltar'], ['A equipe inteira segue imediatamente para nunca perder contato']],
    explanation: 'Conferir a pista e a retirada em paralelo evita descobrir tarde demais que o caminho de volta foi fechado.',
  },
];

export const WRITTEN_QUESTIONS = 5;
export const WRITTEN_PASS = 4;

export const FOREST_ROUTES = {
  norte: {
    label: 'Passarela das raízes',
    scout: { id: 'chunin-rota-norte', label: 'Mirante da passarela', x: 170, y: 108, r: 24 },
    scroll: { id: 'classico-ceu', label: 'Pergaminho do Céu · Passarela', x: 330, y: 110, r: 22 },
    cache: { id: 'chunin-reserva-norte', label: 'Marca de suprimentos no tronco', x: 411, y: 104, r: 22 },
  },
  sul: {
    label: 'Pedras do vau',
    scout: { id: 'chunin-rota-sul', label: 'Entrada do vau', x: 150, y: 252, r: 24 },
    scroll: { id: 'classico-ceu', label: 'Pergaminho do Céu · Vau', x: 321, y: 241, r: 22 },
    cache: { id: 'chunin-reserva-sul', label: 'Bolsa presa nas pedras', x: 383, y: 244, r: 22 },
  },
} satisfies Record<string, { label: string; scout: Spot; scroll: Spot; cache: Spot }>;

export type ForestRoute = keyof typeof FOREST_ROUTES;
