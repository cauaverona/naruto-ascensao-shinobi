export type Tactic = 'rastreio' | 'bloqueio' | 'distracao';

interface Support {
  tactic: Tactic;
  plan: string;
  trail: string;
  supply: string;
}

export const SUPPORT: Record<string, Support> = {
  naruto: { tactic: 'distracao', plan: 'Um clone faz barulho enquanto você se aproxima pelo outro lado!', trail: 'O gato pulou na direção de onde vinha o cheiro de comida.', supply: 'Segure a tampa! O clone empilhou tudo e vai esquecer de fechá-la.' },
  sasuke: { tactic: 'bloqueio', plan: 'Eu fecho a saída. Observe a virada e só avance quando ele parar.', trail: 'Os galhos quebraram voltados para o esconderijo. Olhe a direção.', supply: 'A trava está empenada. Levante a tampa devagar e eu seguro a dobradiça.' },
  sakura: { tactic: 'rastreio', plan: 'Comparei as marcas com as do caminho. Vou indicar as passadas mais leves.', trail: 'Esta marca tem quatro dedos e não tem unha. É a trilha dele.', supply: 'Eu conferi o lacre e o número. É o material certo, pode levar.' },
  ino: { tactic: 'distracao', plan: 'Vou balançar uma folha perto do focinho. Quando ele olhar, avance.', trail: 'Ficou um pelo preso entre estas folhas. O vento não levou para longe.', supply: 'A fita roxa é a nossa marcação. Já separei a encomenda das caixas vazias.' },
  shikamaru: { tactic: 'bloqueio', plan: 'Corte a próxima curva. Eu fecho a volta, então ele perde velocidade na virada.', trail: 'Ele evita a terra aberta. Vai acabar na única saída com sombra.', supply: 'Desamarrar aqui dá menos trabalho do que arrastar a caixa inteira. Já soltei o nó.' },
  choji: { tactic: 'distracao', plan: 'Eu abro meu lanche. O cheiro compra um tempo para você se aproximar.', trail: 'Tem migalhas junto das patas. Eu sei por onde ele foi.', supply: 'Já tirei a pedra do caminho. Dá para levantar a caixa sem forçar as costas.' },
  kiba: { tactic: 'rastreio', plan: 'Akamaru pegou o cheiro. Siga a trilha e avance quando ele parar de farejar.', trail: 'O cheiro fica mais forte aqui. Akamaru, mostre a marca que a gente procura!', supply: 'Akamaru achou o estojo seco. Os outros pegaram umidade do lago.' },
  hinata: { tactic: 'rastreio', plan: 'Vejo por onde ele passou. Posso mostrar a janela antes de você dar o passo.', trail: 'Tem algo se mexendo atrás das folhas. A trilha passa por ali.', supply: 'Há uma rachadura na base. Apoie pela lateral para não perder o conteúdo.' },
  shino: { tactic: 'rastreio', plan: 'Meus insetos marcam por onde ele passou. Preste atenção à trilha que aparecer.', trail: 'Os insetos voltaram por este caminho. A terra ainda está mexida.', supply: 'Os insetos verificaram a madeira. Esta caixa é a única que ainda não abriu.' },
  emi: { tactic: 'distracao', plan: 'Eu imito o chamado do dono. Quando ele virar a cabeça, faça seu movimento.', trail: 'Ouvi um miado perto desta trilha quando passei com os recados.', supply: 'Já conferi o destino e preparei a alça. Leve por este caminho, que é mais curto.' },
  daichi: { tactic: 'bloqueio', plan: 'Eu seguro a passagem estreita. Ele vai precisar parar antes de voltar.', trail: 'Eu vi a terra cair deste tronco. Alguma coisa passou depressa por aqui.', supply: 'A caixa era pesada. Enfiei uma cunha por baixo e agora dá para levar.' },
};

export const MENTOR_LESSON: Record<string, string> = {
  kakashi: 'Os sinos chamam atenção. Repare em quem fica fora do seu campo de visão.',
  asuma: 'Quem cobre a retirada é tão importante quanto quem chega primeiro.',
  kurenai: 'Antes de avançar, confirme o que viu. Uma distração muda a leitura do campo.',
  naomi: 'Marquem o ponto de encontro agora. Se o plano mudar, todo mundo sabe para onde voltar.',
};

