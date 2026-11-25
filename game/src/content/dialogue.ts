// Falas dos personagens. Variam por dia, período, vínculo, memória e acontecimentos do mundo.
// Nenhuma fala revela informação secreta antes de o jogador descobrir.
import type { Campaign } from '../state/campaign';
import { EXAM_DAY } from '../data/academy';

export function talk(c: Campaign, id: string): string[] {
  const name = c.profile.name;
  const n = c.npcs[id];
  const b = n?.bond ?? { amizade: 0, rivalidade: 0, respeito: 0, confianca: 0 };
  const examDone = !!c.events['exame-colegas'];
  switch (id) {
    case 'iruka':
      if (c.quest === 'matricula-ficha') return [`Bom dia! Você é ${name}, o aluno novo? A ficha de matrícula fica no quadro de avisos, ali perto da escada.`, 'Traga preenchida e eu coloco seu nome na lista.'];
      if (c.day >= EXAM_DAY - 1 && !examDone) return ['O exame de graduação está chegando. A prova prática é o Bunshin no Jutsu.', 'Durma cedo. Um shinobi cansado erra os selos mais simples.'];
      if (c.period === 1) return ['Tarde livre não é tarde perdida. O Campo de Treino fica a oeste, seguindo a rua.', b.respeito > 10 ? 'Tenho reparado no seu esforço. Continue assim.' : 'Os troncos, os alvos e a pedra perto do lago: cada um treina uma coisa diferente.'];
      return [`Nos vemos na aula, ${name}.`];
    case 'naruto':
      if (c.events['pegadinha-monumento'] === 'evitada' && c.day <= 8) return ['...', 'Hmpf. Alguém contou para o Iruka-sensei. Eu ia fazer a pegadinha mais lendária da história.'];
      if (c.day === EXAM_DAY && c.period >= 1 && c.flags['exame:naruto'] === 'reprovado' && b.amizade >= 30) {
        c.flags['naruto-confidencia'] = true;
        return [`${name}... eu reprovei de novo. O clone saiu todo mole.`, 'Mas o Mizuki-sensei disse que tem um teste secreto pra quem reprovou! Hoje à noite! Não conta pra ninguém, tá?'];
      }
      if (c.period === 2) return ['Ichiraku é o melhor lámen do mundo! Um dia eu vou comer de graça aqui todo dia, quando eu for Hokage!'];
      if (c.period === 1) return b.amizade >= 20
        ? [`Ei, ${name}! O meu Bunshin sempre sai esquisito... treina comigo? Juntos a gente fica bom nisso!`]
        : ['Eu vou ser Hokage! Aí todo mundo vai ter que me reconhecer, tô falando sério!'];
      return ['Iruka-sensei disse para chegar antes do sino. Hoje eu consegui! Você viu, né?'];
    case 'sasuke':
      if (b.rivalidade >= 20) return ['...Você está melhorando. Não muito.'];
      if (c.period === 1) return ['Estou treinando. Se não tem nada para dizer, sai da frente dos alvos.'];
      return ['O pátio fica mais tranquilo antes da chamada. Dá para treinar um pouco enquanto a turma chega.'];
    case 'sakura':
      if (c.period === 1) return ['Eu revisei a teoria do chakra três vezes. O controle importa mais que a quantidade, sabia?', b.amizade >= 15 ? `Se quiser, estudamos juntos amanhã, ${name}.` : 'Você viu o Sasuke por aí?'];
      return ['Você também é da turma do Iruka-sensei? A entrada fica logo depois da escada.'];
    case 'emi':
      if (c.period === 2) return ['Levei o último recado do dia. Sabia que a tinta da loja de pincéis acabou ontem? Alguém comprou tudo!'];
      return ['Levo os recados da turma até o fim da rua. Se ouvir passos atrás de você, sou eu tentando chegar antes do sino!'];
    case 'daichi':
      return b.rivalidade >= 15 ? ['Da próxima vez eu não pego leve. Força ganha de truque, você vai ver.'] : ['Meu pai faz kunai na forja da rua de baixo. Eu prefiro usar os punhos mesmo.'];
    case 'ino': return [b.amizade >= 15 ? 'Se você me ajudar a revisar os selos, eu te ajudo com a mira.' : 'A próxima prova vai dizer quem estudou de verdade. Eu estou pronta.'];
    case 'shikamaru': return [b.respeito >= 10 ? 'Você viu a abertura antes de atacar. Isso poupa trabalho.' : 'Se escolher a posição certa, dá para resolver uma luta com metade do esforço.'];
    case 'choji': return [b.amizade >= 15 ? 'Divido meu lanche com você. Deixa só um pouco para o Shikamaru.' : 'Eu guardo meu lanche para depois do treino. Senão a fome vence antes de mim.'];
    case 'kiba': return [b.rivalidade >= 15 ? 'Você ganhou daquela vez. Eu e o Akamaru já sabemos como empatar.' : 'O Akamaru percebeu você antes de eu ouvir seus passos. Quer apostar corrida?'];
    case 'hinata': return [b.confianca >= 10 ? 'Eu consegui sustentar a postura durante todo o treino. Obrigada por me incentivar.' : 'Eu estou treinando a postura. Se eu respirar devagar, consigo me concentrar.'];
    case 'shino': return [b.respeito >= 10 ? 'Você também observa antes de avançar. É uma boa maneira de se manter em segurança.' : 'A trilha muda depois da chuva. Observe as marcas no chão antes de seguir.'];
    case 'kakashi': return ['Antes de sair da vila, confira onde estão seus companheiros.'];
    case 'asuma': return ['Quando alguém da equipe perde o ritmo, ajuste o seu. Cheguem juntos.'];
    case 'kurenai': return ['A primeira impressão pode enganar. Olhe de novo antes de tomar uma decisão.'];
    case 'naomi': return ['Revisem o equipamento e o trajeto no diário antes de partir.'];
    case 'gen':
      return ['Bom dia! Kunai, shuriken e onigiri fresquinho. Os primeiros clientes são sempre os que passam cedo pela Academia.'];
  }
  return ['...'];
}
