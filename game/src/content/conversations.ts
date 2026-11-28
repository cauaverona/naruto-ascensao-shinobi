import type { Campaign } from '../state/campaign';
import { bond } from '../systems/relations';

type Topic = readonly [title: string, question: string, supportive: string, pragmatic: string, confidence: string];

const topics: Record<string, Topic> = {
  naruto: ['O que significa ser Hokage', 'Quando eu virar Hokage, ninguém mais vai fingir que eu não existo. Você acha que eu dou conta?', 'Então vou te cobrar quando você for o primeiro da fila para me aplaudir!', 'Tá! Primeiro eu acerto o Bunshin. Depois o resto da vila vai ter que me alcançar.', 'Quando ninguém fica para comer comigo, eu conto as tigelas até a vontade de ir embora passar. Hoje foi diferente. Quer dividir uma?'],
  sasuke: ['Um treino sem plateia', 'Sem ninguém olhando, você ainda faria o mesmo esforço?', 'Se você também voltar amanhã, eu guardo o alvo da esquerda para você.', 'Finalmente alguém que prefere corrigir um golpe a comemorar antes da hora.', 'Quando erro um arremesso, ainda espero ouvir meu irmão dizer onde deixei o cotovelo. Agora eu mesmo olho. Você pode me avisar se vir.'],
  sakura: ['A pressão de acertar', 'Eu sei a teoria, mas fico repetindo os selos até doer a mão. Como você escolhe a hora de parar?', 'É. Quando a mão treme, já estou praticando o erro. Amanhã me avisa se eu passar do ponto.', 'Vou dividir a sequência em três. Se eu errar, dá para saber onde foi.', 'Passei tanto tempo provando que eu sabia as respostas que esqueci que também posso fazer perguntas. Na próxima missão, quero discutir o plano antes de sair.'],
  emi: ['Recados pelas ruas', 'Todo mundo me entrega bilhetes, mas ninguém pergunta se eu queria estar correndo. Você gosta de ter gente contando com você?', 'É bom alguém lembrar que eu posso dizer que hoje não dá.', 'Uma rota por quarteirão e uma pausa entre elas. Eu devia desenhar isso.', 'Uma senhora deixou uma carta comigo e se mudou antes que eu pudesse devolver. Ainda guardo o envelope. Acho que um dia vou procurar por ela.'],
  daichi: ['Além da força', 'Meu pai diz que a melhor kunai cede um pouco antes de quebrar. Eu só queria aprender a dar um golpe forte. O que você acha?', 'Você fala quase igual a ele. Talvez eu devesse pedir que me mostre outra vez.', 'Então vou testar qual postura aguenta meu peso sem travar o joelho.', 'Eu treino duro porque, quando eu errava na forja, terminavam o serviço por mim. Aqui eu quero que me deixem tentar de novo.'],
  ino: ['Liderar sem tomar conta', 'Se eu vejo alguém fazendo uma coisa mal, quero pegar e fazer. Como a gente aprende a confiar no resto da equipe?', 'Eu posso perguntar se ela quer ajuda antes de pegar o trabalho da mão dela.', 'Boa. Combinamos quem cuida do quê e praticamos a troca antes de sair.', 'Às vezes eu sei exatamente quais flores oferecer a alguém, mas não sei o que dizer. Com você eu consigo tentar primeiro as palavras.'],
  shikamaru: ['O melhor plano possível', 'Se eu precisar explicar um plano inteiro quando todo mundo está correndo, já perdi. O que dá para combinar antes?', 'Certo. Eu também devia perguntar qual sinal é mais fácil para cada um.', 'Dois sinais, um para recuar e outro para separar. Qualquer coisa a mais vira ruído.', 'O Chōji me espera até quando já sabe que eu vou demorar. Foi com ele que eu aprendi que esperar por alguém pode fazer parte do plano.'],
  choji: ['O lanche de depois', 'Eu trouxe duas porções. Uma só é para depois do treino. Se eu dividir agora, estraga o plano?', 'Dividir faz parte do plano então. Toma a que tem mais tempero.', 'Tá bom, uma agora e a outra fica guardada para o fim. Eu marco o intervalo.', 'Na primeira vez que me deixaram de fora de um treino, o Shikamaru sentou comigo. Por isso sempre levo uma porção a mais.'],
  kiba: ['Trabalhar com Akamaru', 'O Akamaru percebe quando eu estou nervoso e sai correndo antes do meu sinal. Como eu mostro para ele que ainda é hora de esperar?', 'Eu também posso ficar mais perto dele antes da largada. Ele não tem que adivinhar tudo sozinho.', 'Um assobio para esperar e dois para ir. Vamos treinar devagar primeiro.', 'Quando eu achei que tinha perdido o Akamaru na chuva, fiquei parado para ele me encontrar. Foi a primeira vez que eu deixei ele me guiar.'],
  hinata: ['Terminar a própria frase', 'Na hora de explicar minha postura, eu falo baixo e alguém acaba respondendo por mim. Posso tentar explicar para você?', 'Obrigada por esperar. Eu queria começar pelo pé de trás. É ele que segura meu peso.', 'Vou mostrar uma vez sem falar. Depois me diz o que você percebeu no apoio.', 'Eu ensaio o que quero dizer antes de entrar no Campo. Da próxima vez que eu ficar quieta, me pergunta o que eu vi. Eu quero responder.'],
  shino: ['Observar em silêncio', 'Quando uma trilha perde as marcas, muita gente acelera. Como você decidiria se vale parar?', 'Ficar quieto junto de alguém ajuda. Dá para ouvir o que cada um costuma ignorar.', 'Boa ideia. Deixamos uma marca e comparamos dois caminhos antes de andar mais.', 'Meus insetos precisam voltar antes que eu siga. Quando você fez sinal para todo mundo esperar, eu soube que tinha entendido.'],
  'rock-lee': ['Descanso também é treino', 'Anotei que faria mais cem chutes se errasse o último. Meu joelho está tremendo. O que você faria?', 'Você tem razão. Vou descansar e amanhã conto só os chutes que fiz direito.', 'Vou trocar os chutes por dez repetições lentas da postura, sem forçar o joelho.', 'No começo eu escondia o caderno dos outros. Agora deixo a página aberta. Quero que vejam tudo o que errei antes de conseguir.'],
  neji: ['Uma abertura na guarda', 'Se eu conheço o primeiro passo de alguém, costumo prever o segundo. O que faria você mudar o seu?', 'Se fosse para voltar e buscar um companheiro, faz sentido. Vou observar isso no próximo treino.', 'Faz sentido. Se eu ensinar o meu padrão a você, posso treinar contra alguém que já o conhece.', 'Por muito tempo eu confundia o que as pessoas esperavam de mim com o que eu podia fazer. Você às vezes recua quando eu esperaria um ataque. Ainda estou aprendendo a fazer o mesmo.'],
  tenten: ['O peso da bolsa de armas', 'Eu trouxe o dobro de shuriken de que preciso. Se alguém ficar sem nada, como você prefere que eu passe a reserva?', 'Um gesto rápido e eu me aproximo. Dá para combinar isso com todo mundo antes.', 'Vou separar a reserva num bolso só, para ninguém precisar procurar no meio da luta.', 'Meu primeiro alvo tinha uma marca de cada erro. Era feio, mas foi o primeiro que eu fiz sozinha. É por isso que eu conserto o equipamento daqui.'],
};

type FollowUp = readonly [title: string, question: string, supportive: string, pragmatic: string];
const followUps: Record<string, FollowUp> = {
  naruto: ['A primeira missão', 'Qual seria a primeira missão que você contaria para a vila inteira?', 'Mesmo se fosse buscar um gato? Gostei. O importante é voltar com ele!', 'Uma em que eu consiga mostrar o que aprendi. Sem começar derrubando metade da rua.'],
  sasuke: ['Cobrir a retaguarda', 'Se eu avançar antes do seu sinal, o que você faz?', 'Então eu posso esperar meio segundo. Você me avisa quando estiver na posição.', 'Certo. Se o sinal falhar, voltamos para o ponto de saída.'],
  sakura: ['Depois de uma luta', 'Quando todo mundo volta de um combate falando ao mesmo tempo, por onde você começaria?', 'Primeiro a gente confere quem se machucou. Eu sempre esqueço de perguntar como os outros estão.', 'Um relato por pessoa, na ordem em que tudo aconteceu. Assim a pista menos óbvia fica no papel.'],
  emi: ['A rota do telhado', 'Achei um caminho pelos telhados, mas o pessoal da rua fica bravo com o barulho. E agora?', 'Se eu perguntar a que horas incomoda, talvez eu consiga continuar passando por ali.', 'Vou anotar onde a telha é mais firme e cronometrar a volta pela rua.'],
  daichi: ['Uma lâmina emprestada', 'Meu pai me emprestou a primeira kunai que eu fiz. O cabo está torto. Você levaria mesmo assim?', 'Pode ficar na bolsa como lembrança. Eu não preciso arriscar a mão toda vez que quiser lembrar.', 'Vou testar a pega na madeira antes de tirar ela de casa.'],
  ino: ['Flores na saída da vila', 'Vi flores novas do lado do portão. Pensei em levar para o pessoal, mas cada um gosta de uma coisa.', 'Posso perguntar qual foi a primeira flor de que cada um se lembra.', 'Vou fazer um arranjo pequeno para deixarmos na sala. Sem precisar decidir por todo mundo.'],
  shikamaru: ['Quando o plano falha', 'Se você percebe que o plano deu errado, quem precisa saber primeiro?', 'Quem está mais exposto. Eu posso mandar o sinal de lá mesmo.', 'A pessoa que consegue mudar de posição primeiro. O resto segue o sinal combinado.'],
  choji: ['Um lugar à mesa', 'Tem gente que acha estranho parar para comer depois de errar feio num treino. Você ficaria?', 'Ainda bem. Eu queria companhia e nem sabia como pedir.', 'Vamos comer e, quando o pessoal estiver calmo, rever o que deu errado.'],
  kiba: ['Cheiro de chuva', 'O Akamaru sentiu chuva antes de todo mundo. Você continuaria uma patrulha assim?', 'Vou levar ele no ombro onde o chão fica escorregadio. Boa lembrar disso.', 'A gente revê a rota e marca o caminho de volta antes que os rastros sumam.'],
  hinata: ['Praticar o primeiro passo', 'Eu queria escolher o primeiro movimento no treino de hoje. Você deixa?', 'Obrigada. Vou tentar mesmo se eu precisar parar para respirar.', 'Você segura a guarda e me avisa no momento em que ela abrir.'],
  shino: ['Um rastro interrompido', 'Encontrei pegadas que somem na margem. O grupo quer cruzar logo. Você esperaria?', 'Eu esperaria com quem ficou para trás. Às vezes essa pessoa viu o que o resto perdeu.', 'Vou marcar a última pegada e comparar as duas margens antes de decidir.'],
  'rock-lee': ['Treino em dupla', 'Você acha melhor repetirmos o golpe mais forte ou o que mais erramos?', 'Podemos alternar. Eu corrijo sua postura e você corrige a minha.', 'Começamos pelo que falha e gravamos quantos saem limpos. Sem dobrar as repetições.'],
  neji: ['Voltar em formação', 'Quando um companheiro fica para trás, você espera o chamado ou volta por ele?', 'Eu voltaria com você. Só precisamos avisar quem segue na frente.', 'Um sinal combinado evita que os dois voltem e deixem a frente vazia.'],
  tenten: ['Uma arma a menos', 'Se o seu último arremesso cair fora do campo, o que você faz com a mão livre?', 'Eu posso cobrir sua retirada. Dá para recarregar quando você chegar perto.', 'Guardamos uma ferramenta para esse momento. Vou praticar a troca com você.'],
};

export function conversation(c: Campaign, id: string) {
  const topic = topics[id];
  if (!topic || !c.npcs[id]?.alive) return;
  const key = `conversa:${id}`;
  if (c.flags[key] === c.day) return;
  const met = typeof c.flags[key] === 'number';
  if (met && c.npcs[id].bond.confianca >= 12 && !c.flags[`${key}:pessoal`]) {
    return { label: 'Conversar em particular', text: topic[4], personal: true, answers: [{ id: 'ouvir', label: 'Agradecer pela confiança' }] };
  }
  const followUp = met && c.flags[`${key}:tema`] !== 'outro';
  const [label, text] = followUp ? followUps[id] : topic;
  return {
    label, text, personal: false, followUp,
    answers: [{ id: 'acolher', label: 'Responder com apoio' }, { id: 'planejar', label: 'Propor uma solução prática' }],
  };
}

export function answerConversation(c: Campaign, id: string, answer: string): string | undefined {
  const available = conversation(c, id);
  if (!available?.answers.some(({ id }) => id === answer)) return;
  const key = `conversa:${id}`;
  const topic = topics[id];
  if (available.personal) {
    c.flags[`${key}:pessoal`] = true;
    c.flags[key] = c.day;
    bond(c, id, { amizade: 8, confianca: 8 }, `Conversou em particular sobre ${topic[0].toLocaleLowerCase('pt-BR')}.`);
    return 'Eu queria falar disso faz tempo. Valeu por me ouvir.';
  }
  const subject = available.followUp ? followUps[id] : topic;
  c.flags[key] = c.day;
  c.flags[`${key}:tema`] = available.followUp ? 'outro' : 'primeiro';
  const supportive = answer === 'acolher';
  bond(c, id, supportive ? { amizade: 5, confianca: 5 } : { respeito: 5, confianca: 5 }, `Conversou sobre ${subject[0].toLocaleLowerCase('pt-BR')}.`);
  return supportive ? subject[2] : subject[3];
}
