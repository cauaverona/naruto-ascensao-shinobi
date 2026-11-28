# Status do desenvolvimento

**Versão atual** 0.5.11, revisão de arte dos mapas recentes da Etapa 4 do [Projeto Mestre](Projeto_Mestre.md).
**Jogar:** abra `naruto_ascensao_v0.5.11.html` no navegador. Funciona offline.

## O que mudou na 0.5.11

- Vale do Fim, Floresta da Morte, Estrada do Riacho, Vila da Ponte, Arena Chūnin e Fronteira da Areia receberam arte, paletas e caminhos próprios.
- As colisões, entradas, saídas e interações de missão acompanham a nova arte. A abertura de saves antigos recupera posições bloqueadas em pontos caminháveis.
- Os pergaminhos do Céu e da Terra e o embrulho avulso têm sprites próprios. O cenário usa versões menores para manter a proporção com os personagens.
- Passaram 116 testes automatizados. No Chrome, foram conferidos os seis mapas no atlas, as travessias, os duelos, a retomada de saves e os retornos para Konoha.

## O que mudou na 0.5.10

- A lista de jornadas e a importação usam a mesma validação. Um save incompleto aparece como ilegível, e uma posição gravada dentro de uma parede ou fora do mapa é recuperada em um ponto caminhável.
- Aulas, graduação, pistas, capturas e vitórias de missão gravam o progresso antes das falas de resultado. Um treino de luta interrompido pode ser retomado. O treino concluído grava a ação e o resultado juntos.
- A travessia encerrada deixa de reaparecer na conversa de Tazuna. A carta dele liga o resultado da ponte ao Exame Chūnin. A volta de Sasuke ganha uma fala de encerramento, e a equipe ativa reflete o desfecho em que ele parte.
- Passaram 102 testes automatizados. No Chrome em 1366 × 768, uma única campanha foi da criação e matrícula até o relato de Iruka no Vale. A verificação acelerou deslocamentos, simulou os comandos dos minijogos e ajustou os atributos do personagem de teste para os duelos do Clássico. Conferiu treino cancelado e extra, oito aulas, reprovação e repescagem, todas as missões Rank D e a progressão pelos 16 capítulos.
- No Edge foram verificados a herança Yuki, a compra e troca de equipamentos, a retomada de treinos, a exportação de um JSON e a alcançabilidade dos pontos e saídas nos nove mapas. O atlas foi conferido em 1920, 1024 e 412 px. O Chrome e o Edge abriram o HTML offline e importaram jornadas, com compatibilidade confirmada para saves gerados pelas versões 0.2.0, 0.3.0, 0.4.4 e 0.5.9.

## O que mudou na 0.5.9

- O Vale ganhou cachoeira, laje de travessia, mirante para falar com a equipe e um abrigo opcional que recupera vida, chakra e resistência uma vez.
- Sasuke sinaliza o Katon, os golpes e as aberturas do duelo. A reconciliação considera o vínculo e a decisão na torre. A vitória no duelo fica salva até o jogador confirmar o desfecho.
- Iruka recebe um relato diferente conforme a decisão do jogador. O Diário registra o resultado e a entrega. Campanhas que já terminaram preservam seu final.
- Passaram 97 testes automatizados. A revisão no Chrome para PC partiu de saves da v0.5.8, percorreu o Vale a pé e conferiu o retorno por conversa, o resgate após vitória, a partida no modo Fiel e a despedida sem duelo. Foram testados a rendição, a retomada depois de vencer, o relato adiado e a abertura do HTML offline.

## O que mudou na 0.5.8

- A busca por Sasuke começa com a reunião da equipe. Um aliado pode acompanhar o jogador pela passarela ou pelo vau e dar cobertura no duelo. O plano pode mudar até confirmar o rastro do outro lado do riacho.
- A rota norte dá acesso a um selo ilusório no alarme. A rota sul permite ajudar Maki na margem. Cada ação opcional reduz a resistência inicial da sentinela. O adversário sinaliza o disfarce, a investida, os arremessos e a abertura.
- O Diário registra o caminho, o aliado e a preparação. O encontro a leste libera a viagem ao Vale do Fim. Saves que já chegaram ao Vale continuam a partir dali.
- Passaram 91 testes automatizados. No Chrome para PC, as duas rotas foram percorridas a pé com saves da v0.5.7. A revisão confirmou troca de rota, saída e retomada com Iruka, recarga antes e depois do duelo, rendimento da preparação em combate, rendição e nova tentativa, e entrada no Vale. O HTML abriu offline.

## O que mudou na 0.5.7

- O Ichiraku e a ronda da praça dão pistas que podem ser investigadas em qualquer ordem. O sensei ajuda a equipe a preparar a retirada de Naruto.
- É possível guiar Naruto pelos becos, usando o sinal da lanterna, ou conter Kisame para abrir caminho pela praça. Kisame dá sinais antes de formar cópias, erguer a lâmina pesada e baixar a guarda.
- O relatório muda conforme a rota e registra a ajuda na relação com Naruto. Pistas, escolta e rota aparecem no Diário e ficam salvas entre sessões.
- Passaram 86 testes automatizados. No Chrome para PC, as duas rotas foram percorridas a pé com saves da v0.5.6. A revisão conferiu troca de plano, sinal incorreto, troca de mapa sem duplicar Naruto, retomada após recarregar, rendição, vitória em sete rodadas e avanço à Equipe de resgate. O HTML abriu offline.

## O que mudou na 0.5.6

- O posto oeste e a vigia da duna sul podem ser visitados em qualquer ordem. A recepção na fronteira leva em conta como a equipe evacuou Konoha. A vigia ensina a reconhecer uma abertura na guarda de areia.
- Acordo com Gaara leva à mensageira e à carta de passagem. Vitória no duelo leva ao posto de socorro, que trata a equipe e entrega um registro de feridos. Tsunade reage à informação que o jogador leva à casa de chá.
- O mapa indica o próximo contato e o Diário registra quem já foi consultado. Campanhas que já chegaram à busca por Tsunade retomam pela pista correspondente à decisão salva.
- Passaram 82 testes automatizados. No Chrome para PC, as duas rotas foram percorridas a pé a partir de saves da v0.5.5. Foram conferidos adiamento, recarga durante a missão, rendição e nova tentativa, vitória em seis rodadas, recuperação no posto de socorro e avanço ao próximo capítulo. O HTML abriu offline.

## O que mudou na 0.5.5

- Após a final do Exame Chūnin, a equipe pode preparar os becos laterais ou liberar o corredor central em combate. A guarda permite trocar de rota enquanto a passagem ainda está pendente.
- Os moradores do mercado e da Academia seguem o jogador até a baliza e o posto de socorro. A ordem é livre. O progresso de cada grupo aparece no Diário e persiste após recarregar.
- O invasor anuncia os arremessos e os momentos em que baixa a guarda. O relatório encerra a evacuação, fortalece os vínculos da equipe e libera a viagem à fronteira de Suna.
- Passaram 77 testes automatizados. No Chrome em 1440 × 850, foram percorridas as duas rotas a pé com um save da v0.5.4. Foram conferidos sinal incorreto, rendição, troca de rota, recarga durante a escolta e avanço imediato ou adiado até Suna. O HTML abriu offline.

## O que mudou na 0.5.4

- Gaara anuncia a guarda de areia, a investida pesada e a abertura quando baixa a defesa. A estratégia de reagir aos avisos foi testada em 80 simulações com um perfil Genin.
- O Diário identifica os pergaminhos do Céu e da Terra como pendentes, em posse ou entregues à torre. Também mostra a reserva usada na troca e recupera os estados de campanhas antigas pelo capítulo salvo.
- Passaram 74 testes automatizados. No Chrome para PC, a troca e a entrega atualizaram o Diário de um save da v0.5.3. A final foi vencida em sete rodadas usando os avisos, a promoção persistiu após recarregar e o HTML abriu offline.

## O que mudou na 0.5.3

- A prova escrita sorteia cinco situações a cada tentativa entregue, exige quatro acertos e explica os erros no fim. O Diário mostra a melhor nota.
- A Floresta da Morte tem um riacho com duas travessias. A passarela exige observar a patrulha e o vau exige equilíbrio com chakra. Aliados que dominam a tática adequada dão mais margem no desafio, e a confiança aumenta o bônus.
- A equipe pode conseguir o pergaminho da Terra em duelo ou negociar depois de encontrar um pergaminho do Céu avulso. A banca explica a decisão sobre a patente após a final.
- O batedor do Som anuncia o preparo das cópias, os arremessos e a recuperação de chakra. O equilíbrio foi exercitado em 80 simulações com atributos de Genin.
- Passaram 72 testes automatizados. No Chrome em 1440 × 850, foram conferidos abandono, reprovação e nova tentativa na prova, as duas travessias, troca, rendição e vitória no duelo. Um save antigo dentro do riacho foi recuperado na margem, e a versão final abriu offline.

## O que mudou na 0.5.2

- No cais, a equipe encontra duas pistas em ordem livre e registra cada uma no Diário. Antes do duelo na ponte, o jogador evacua os dois grupos de trabalhadores. Um rastreador de confiança dá mais tempo para observar a rota segura na neblina.
- Haku e Zabuza anunciam investidas especiais e aberturas. A travessia e o descanso depois do duelo com Haku recuperam a equipe. Os recursos usados em combate continuam saindo do estoque.
- Em 80 simulações por adversário, o perfil de teste Genin venceu Haku em 80 e Zabuza em 75 usando as pistas. Repetir taijutsu diante de Zabuza venceu em 39 das mesmas 80.
- Passaram 67 testes automatizados. No Chrome em 1440 × 850, foram conferidos os objetivos em ordem livre, adiamento, os dois duelos com atributos de Genin, a evacuação, a retomada de um save anterior e a abertura offline.

## O que mudou na 0.5.1

- Dezesseis capítulos conectam a travessia, a ponte, o Exame Chūnin, a invasão, a fronteira de Suna, o retorno de Tsunade e o Vale do Fim. A equipe pode voltar a Konoha para se preparar e retomar a viagem com Iruka.
- A banca promove por desempenho e decisão de liderança. A rota de Sasuke considera o modo de história, a decisão na floresta e a confiança acumulada.
- Hyūga e Uchiha podem despertar suas primeiras técnicas na Pedra de meditação conforme o avanço e os atributos exigidos.
- Passaram 65 testes automatizados. No Chrome em 1440 × 850, uma campanha de teste percorreu os 16 capítulos com deslocamentos acelerados e atributos elevados. Foram conferidos erro na prova, derrota e revanche, retorno a Konoha, recarga, promoção e um final alternativo. A build abriu offline.

## O que mudou na 0.5.0

- Depois da decisão sobre a escolta, Tazuna oferece a partida no momento escolhido pelo jogador. A equipe percorre a Estrada do Riacho, investiga os rastros e faz acampamento após a ponte. O progresso fica no Diário e é preservado ao retornar a Konoha.
- Passaram 61 testes automatizados. No Chrome em 1440 × 850, teclado e mouse foram usados para conferir a persistência dos vínculos, o bônus no teste dos sinos, a partida adiada, a caminhada até o acampamento, a recarga e o retorno a Konoha. O HTML final abriu offline.

## O que mudou na 0.4.13

- Quatorze colegas oferecem dois assuntos e uma conversa particular desbloqueada pela confiança. As respostas dão amizade ou respeito e a Ficha registra os momentos compartilhados.
- Companheiros selecionados para apoiar ampliam a faixa no teste dos sinos e reduzem a resistência inicial da rival no duelo da ronda. A aba Relações mostra os requisitos e bônus.

## O que mudou na 0.4.12

- Dezessete retratos de conversa em pixel art, na grade de 40 × 40, adotam o enquadramento de rosto e ombros do retrato de Naruto.
- Os 57 testes automatizados passaram. As 17 conversas e o retrato original de Naruto foram conferidos no Chrome. A versão offline abriu diálogos no tamanho de celular com um save da v0.4.11.

## O que mudou na 0.4.11

- As quatro missões Rank D ficam disponíveis até o jogador aceitar. A opção Treinar primeiro pausa o objetivo e registra a missão adiada no Diário. Missões que já estavam em andamento em saves antigos continuam do ponto salvo.
- Nas manhãs livres depois da graduação, o Calendário permite avançar para a tarde. Os pontos do Campo também oferecem a escolha ao interagir.
- Tazuna conversa diretamente com o jogador e aceita retomar a negociação mais tarde. O marcador da escolta aponta para ele na Rua da Academia.
- A Ficha mostra os atributos efetivos, a contribuição das luvas e da bolsa para o poder de combate e a proteção do colete equipado.
- Em telas estreitas, o relógio e o objetivo ficam abaixo das barras de status.
- Passaram 57 testes automatizados. No Chrome com toque emulado, uma campanha nova foi da matrícula à decisão com Tazuna, com deslocamentos acelerados. Foram conferidos o adiamento e a retomada das missões, os dois caminhos para passar à tarde e a Ficha com luvas. A versão abriu offline.

## O que mudou na 0.4.10

- As faixas de graduação foram afinadas e ajustadas acima dos olhos dos NPCs, com referências para cada pose de rosto.
- Depois da graduação, a Ficha permite usar a bandana na testa, no pescoço, no braço ou na cintura ou guardá-la. A prévia acompanha a escolha em tempo real e a campanha grava a posição.
- Passaram 51 testes automatizados. No Chrome foram conferidos 520 quadros, as cinco escolhas, o menu em tela móvel e a persistência após recarregar um save antigo. A build abriu offline.

## O que mudou na 0.4.9

- Os nove exercícios do Campo de Treino cobrem os doze atributos visíveis. A Ficha indica o ponto de treino e o Diário registra a nota e o progresso dos atributos.
- A prova do caderno Yuki fica na Pedra de meditação após a conclusão da Vida Genin. Exige Ninjutsu 4, Controle de chakra 5 e 60% no exercício. A recompensa é Estilhaços de Gelo, técnica inicial criada para o jogo. O gelo hereditário de Haku aparece no [episódio 14 oficial](https://naruto-official.com/de/anime/naruto1/list/01_238).
- Estilhaços de Gelo funciona a média e longa distância e reduz em 2 a iniciativa do alvo na próxima rodada se houver um acerto fora da guarda.
- Passaram 50 testes automatizados. No Chrome, um save da v0.4.8 do dia 8 treinou nos novos pontos e conservou a ação após cancelar. Outro save, no fim da Vida Genin, passou pela prova Yuki, recarregou a técnica e aplicou geada em duelo. A build abriu offline.

## O que mudou na 0.4.8

- Os 17 NPCs aprovados na galeria usam seus sprites e retratos próprios. Os quadros de caminhada cobrem as quatro direções.
- Os duelos mostram preparação do golpe, ataque, arremesso, guarda, selos, impacto e esquiva. Lee e Guy têm chutes, e os Hyūga usam palmas.
- Contornos claros receberam contraste, pequenos furos de amostragem foram fechados e as bandanas acompanham a pose após o exame.
- A verificação no Chrome conferiu 612 quadros, 17 retratos, bandanas, NPCs caminhando no Campo de Treino e duelos com Lee e Hinata. A edição offline abriu sem rede.

## O que mudou na 0.4.7

- Uma jornada pode ser exportada em JSON e importada em um slot vazio de outra cópia do jogo. Arquivos incompatíveis são recusados.
- A ronda de Maki salva o estoque restante de kunai e shuriken ao fim do duelo. Treinos devolvem as armas usadas.
- Passaram 46 testes automatizados. No Chrome com tela e toque emulados, a jornada foi da graduação à decisão sobre Tazuna com recargas entre objetivos. O teste confirmou gasto após vitória e derrota na ronda, devolução no treino e transferência do save para o HTML offline. O teste em um celular físico segue pendente.

## O que mudou na 0.4.6

- Os sprites voltaram ao visual da v0.4.4. As bandanas acompanham a silhueta da pose. Sakura usa o protetor sobre o laço e Lee na cintura.
- Quem reprova no exame pode treinar nos dias livres e fazer a repescagem na data marcada. Saves do dia 11 retomam esse ciclo.
- O posto de selos oferece treino solo das técnicas aprendidas, com efeitos por técnica e opção de repetir. Interromper a sessão devolve o controle sem descontar ação ou chakra. O Campo oferece até dois treinos extras depois das ações da tarde.
- A guarda vale na própria rodada. A distância fica limitada a três zonas, e de longe o taijutsu aproxima o lutador para preparar o golpe seguinte.
- A versão passou em 44 testes automatizados. No Chrome, um save da v0.4.4 do dia 11 retomou os treinos, permitiu interromper sessões e chegou à aprovação na repescagem. Também foram conferidas quatro direções das bandanas, a guarda contra Lee e a abertura offline.

## O que mudou na 0.4.4

- A aba Mapa compõe o cenário com o mesmo terreno, prédios e objetos usados na exploração.
- A Rua da Academia, o Campo de Treino e a sala de Iruka têm mapas consultáveis. A lista de pontos permite realçar um local. As passagens abrem a prévia da área de destino no menu.
- A posição do jogador aparece na área em que ele está. O objetivo e as pistas acompanham a missão ativa, inclusive quando ficam em outra área. A captura de Tora indica os rastros até que o esconderijo seja descoberto.
- **Verificação da 0.4.4.** 39 testes automatizados e build. No Chrome, o HTML offline abriu as três áreas, realçou um local, respondeu a toque emulado a 390 px e mostrou as três pistas de Tora antes da descoberta.

## O que mudou na 0.4.3

- Rock Lee, Neji, Tenten e Guy aparecem no Campo de Treino na primeira tarde. Os três Genin têm visual, falas, vínculos e duelos próprios.
- No rodízio do Time 3, o jogador pede a Guy um parceiro de preferência antes da formação das equipes. Após a graduação, Guy confirma a vaga, sorteia o segundo parceiro e mantém o terceiro na reserva. A preferência pode ser alterada ou removida antes da formação. Equipes já formadas ficam registradas no save.
- Lee fecha passagens, Neji rastreia e Tenten distrai. As táticas entram nos sinos e nas missões com as mesmas regras aplicadas aos outros colegas.
- Os sprites usam a folha base do jogo com variações de cabelo, roupa e paleta. Tenten tem um corte de dois coques desenhado no mesmo renderizador.
- A formação original do Time 3 foi consultada na [coluna oficial de Rock Lee](https://naruto-official.com/en/news/01_1652). O rodízio é uma adaptação jogável.
- **Verificação da 0.4.3.** 39 testes automatizados, TypeScript e build. No Chrome, a primeira tarde teve os quatro NPCs no campo, um duelo com Lee e o pedido de vaga. Um checkpoint de graduação confirmou Guy, Lee e Tenten na equipe, o teste dos sinos e a ajuda de Lee na missão de suprimentos.

## O que mudou na 0.4.2

- **O lacre trocado.** Três pistas em Konoha revelam o destino de uma encomenda. O caso varia por jornada. Um colega pode ajudar a interpretar uma pista, e a resposta certa rende 120 ryō.
- **A ronda das lanternas.** A equipe confere dois postos no Campo de Treino e enfrenta Maki, uma Genin da guarda. O apoio escolhido altera a distância inicial ou o fôlego da adversária. A derrota permite tentar de novo, e o relatório da vitória vale 150 ryō.
- As missões entraram depois de Tora. Saves que já chegaram a Tazuna passam a ter acesso aos dois trabalhos e conservam a decisão registrada sobre a escolta.
- O livro, o lacre, o recibo e os postes de ronda foram desenhados em Canvas na grade da pixel art do jogo. Maki usa o renderizador de personagens com cabelo, traje e paleta próprios.
- **Verificação da 0.4.2.** TypeScript, build e 34 testes automatizados. No Chrome, o HTML offline passou pelas duas missões a partir de um save de teste na devolução de Tora, com retomadas entre objetivos. O teste conferiu resposta errada, escolha certa, rendição, nova abertura de combate, vitória, pagamento e conversa com Tazuna. Uma segunda rodada percorreu toda a campanha em um novo slot até Tazuna, com exploração acelerada. A captura de Tora foi concluída com toque emulado no Chrome a 390 × 844. Um save compatível com a v0.4.1 retomou com as novas missões e preservou a decisão da escolta.

## O que mudou na 0.4.1

- A equipe se divide na tarefa dos suprimentos. Cada colega guarda uma caixa e ajuda a conferir o material.
- As escolhas de apoio alteram os sinos e a captura de Tora. Rastrear mostra a abertura, bloquear prolonga o tempo disponível e distrair cobre um erro. A equipe e a semente da jornada determinam qual rastro é fresco e onde Tora está.
- Tora, rastros e caixas foram desenhados em Canvas para a mesma grade de pixel art do jogo. Controles de tempo têm um botão próprio para toque.
- Colegas têm preferências na IA para pressão, guarda, alcance e fintas. Impacto, golpe defendido, esquiva e clone têm apresentação distinta.
- A graduação dá uma nota a partir da prova escrita, dos selos, do domínio do Bunshin e do controle de chakra. O exame mostra a nota, as parcelas e o mínimo para aprovação.
- **Verificação da 0.4.1.** 33 testes automatizados e compilação de TypeScript e Vite. No Chrome, uma jornada nova percorreu a matrícula, as oito aulas, a graduação, o teste dos sinos, as duas missões D e o encontro com Tazuna. A automação acelerou a exploração e usou os controles e menus, sem teletransporte ou edição do save. O HTML offline foi aberto separadamente para verificar criação e retomada, e o mapa foi revisado no layout de 390 × 844.

## O que mudou na 0.4.0

- **Fundação:** criação e interface reaproveitadas, mapa local com posição, objetivo e saídas. Saves antigos recebem os novos NPCs preservando aparência, progresso e vínculos.
- **Academia:** Ino, Shikamaru, Chōji, Kiba, Hinata e Shino têm visual próprio, assento, rotina, diálogo, atributos, exame e duelos. Iruka oferece reposição das aulas perdidas.
- **Combate:** efeitos em pixels desenhados pelo Canvas para antecipação, impacto, guarda, aura e fumaça. Bunshin cria cópias, Henge troca o visual do lutador e Kawarimi deixa um tronco na substituição. Katon e Kage Bunshin entram em duelos da Vida Genin. As referências foram usadas para estudar timing, sem importar sprites das folhas.
- **Vida Genin:** dois colegas e um sensei por equipe, com sorteio pela semente do save. O modo Alternativo permite combinações com os integrantes da Equipe 7. A rota em que o jogador substitui Naruto usa Kakashi. As demais podem ter Asuma, Kurenai, Naomi ou Kakashi, conforme a rota.
- **Progressão:** encontro com o sensei, teste dos sinos, coleta de suprimentos, captura de Tora e prólogo da escolta de Tazuna. Loja e inventário permitem comprar, equipar e trocar luvas, bolsa e colete com benefícios em combate. A sessão continua disponível para treino e exploração após o prólogo.
- A travessia para o País das Ondas, o combate com Zabuza e o Exame Chūnin pertencem à continuação do Clássico.
- **Verificação da 0.4.0:** 28 testes automatizados, checagem TypeScript e compilação. No Chrome, a build offline passou por criação, matrícula, exame a partir de um checkpoint do dia 10, graduação, prova dos sinos, equipar as luvas pelo inventário, missões D, prólogo, duelo com Ino e teste de layout de 390 × 844. O teste usou pontos de retomada para as transições longas.

## O que mudou na 0.3.2

- A lista de jornadas permite excluir um save com confirmação. A exclusão preserva os demais slots e recusa um save alterado em outra aba desde que a confirmação foi aberta.
- A ficha tem 13 penteados, 14 cores de cabelo, 6 modelos de roupa, 14 cores de traje e 4 opções de cachecol, incluindo sem cachecol. Óculos, máscara, presilha e brinco têm acabamentos que podem ser escolhidos por amostras de cor.
- A prévia pode ser girada para os quatro lados e mostra a caminhada sob demanda. Jaquetas de treino, coletes utilitários e camadas cruzadas foram desenhados para o protagonista com a [galeria oficial do anime](https://naruto-official.com/en/special/anime-gallery) e as [referências de vestuário shinobi](https://naruto-official.com/en/news/01_1429) como inspiração.
- A cicatriz, os bigodes e as marcas vermelhas seguem os pixels da pele. Os detalhes dos trajes e do cachecol respeitam o contorno do personagem em repouso e andando.
- A opção **Feminino** tem um corte adicional, **Rabo lateral**. Os 13 cortes originais e o desenho do personagem continuam disponíveis com a mesma aparência.
- A verificação local incluiu 24 testes automatizados, compilação e testes no Chrome de criação, retomada, exclusão e layout com 390 px de largura.

## O que mudou na 0.3.1

- **Personagem:** na criação, só o nome e a aparência são escolhidos. Clã, aldeia, afinidade, talento, atributo e histórico são sorteados ao começar e revelados na abertura. Clãs comuns saem com mais frequência; linhagens raras são surpresas.
- **Aparência ampliada:**
  - 8 tons de pele, 14 cores de cabelo e 14 cores de traje.
  - 10 penteados: curto, franja, preso, rabo alto, chiquinhas, coque, trança, espetado, longo e cacheado.
  - 8 cores de cachecol e 7 cores de pano da bandana.
  - 4 acessórios: óculos, máscara, faixa na testa e curativo.
  - 3 marcas no rosto: cicatriz, bigodes e marcas vermelhas.
- **Som:** trilha original sintetizada (pentatônica Hirajoshi, cordas dedilhadas), baixinha, com uma versão mais rápida no combate. Clique ao passar o mouse e ao confirmar nos menus. Liga e desliga na tela de título e no menu Sistema.
- **Seta de objetivo:** mostra para onde ir. Fica em cima do alvo quando ele está na tela, na borda quando está fora, e aponta a saída quando o alvo está em outro mapa.

## O que mudou na 0.3.0

A campanha agora acontece no mesmo mundo da cena de referência da 0.2.2. Antes, a cena bonita era só uma demonstração e a campanha rodava a versão 0.2.0 dentro de um iframe, com outro mapa e outra arte. Na 0.3.0 existe um jogo só, em tela cheia, com interface de jogo.

## Funcionalidades implementadas e testadas

- **Telas de jogo:** título com Continuar, Jogar e Controles; seleção de jornada com o retrato do personagem; ficha de matrícula com abas (identidade, aparência, origem e mundo), prévia girando e opção de sortear tudo. Navegação por teclado, mouse e toque.
- **Criação de personagem:** nome, sexo, aldeia, 17 clãs (ou sorteio), afinidade elemental, talento, atributo inicial, histórico, aparência e configurações de mundo (dificuldade e fidelidade à história). Nenhum clã começa com poderes desbloqueados. Personagens Uchiha e de clãs raros recebem uma origem coerente.
- **Mundo:** três mapas, todos em pixel art na grade de 16 px:
  - Rua da Academia, a cena de referência, estendida para o sul.
  - Campo de Treino, novo.
  - Sala de aula de Iruka, nova.

  Câmera em tela cheia com escala inteira de pixels, transições com fade, letreiro com o nome do lugar e iluminação de tarde e de noite com lampiões.
- **NPCs simulados:** Iruka, Naruto, Sasuke, Sakura, Emi (original), Daichi (original) e Sr. Gen (original).
  - Cada um tem idade, patente, clã, atributos, técnicas, personalidade, objetivos, rotina por período, vínculos e memória.
  - Eles treinam sozinhos todo dia.
- **Calendário:** dias da semana, manhã (aula), tarde (3 ações de treino) e noite (Ichiraku, conversas, dormir em casa). Mesada semanal.
- **Academia:** matrícula no dia 1 e oito aulas com minijogos:
  - Teoria do chakra
  - Combate corpo a corpo
  - Henge
  - Armas de arremesso
  - Kawarimi
  - Bunshin
  - História de Konoha
  - Revisão

  Quem falta à aula de uma técnica pode ter aula de reforço com Iruka à tarde.
- **Treino:** quatro minijogos que dão evolução de atributo e domínio:
  - Troncos: tempo do golpe.
  - Alvos: mira de kunai.
  - Meditação: manter o chakra dentro da faixa.
  - Selos: sequência de selos.

  O treino tem custo de resistência e fadiga.
- **Combate por turnos:**
  - Três zonas de distância e iniciativa por velocidade.
  - Ações: taijutsu, kunai e shuriken com estoque, avançar, recuar, defender (com contra-ataque), concentrar chakra e render-se.
  - Técnicas: Bunshin (clones ilusórios que atraem golpes), Kawarimi (substituição oculta) e Henge (disfarce que prepara um golpe crítico). Podem falhar conforme o domínio.
  - A IA tem personalidade e só usa informação pública, sem ler a substituição preparada pelo jogador.
  - Dá para desafiar colegas à tarde; há duelos nas aulas dos dias 3 e 9.
- **Exame de graduação (dia 10):** prova escrita, sequência de selos e Bunshin. Aprovado vira Genin e ganha a bandana, que aparece no sprite. Reprovado faz repescagem em 3 dias.
- **Mundo dinâmico:** acontecimentos com janela, pré-requisitos, escolhas e consequências.
  - Convite para a pegadinha do monumento: aceitar, recusar ou avisar Iruka muda o que acontece.
  - Exame dos colegas: Naruto reprova na fidelidade máxima, a menos que o jogador tenha treinado o Bunshin com ele.
  - Noite do pergaminho proibido: só acontece se Naruto reprovou, e Naruto pode ou não aprender o Kage Bunshin.
  - Alternativa oculta, se Naruto passou: o plano de Mizuki não é forçado.
  - Formação das equipes: o jogador pode assumir o lugar de Naruto na Equipe 7.
- **Relações:** amizade, rivalidade, respeito e confiança, com memória de acontecimentos e falas que mudam conforme o vínculo.
- **Itens e loja:** kunai, shuriken e onigiri; lámen no Ichiraku recupera resistência.
- **Menu de pausa:** ficha (atributos com barra de progresso, nível, poder de combate, reputação), técnicas, relações, diário, calendário, itens e sistema (salvar, zoom, voltar).
- **Salvamento:**
  - Três slots, salvamento automático e manual.
  - Formato versionado (schema 3) com migração automática dos saves da v0.2.0.
  - Proteção contra sobrescrita por outra aba e tratamento de save ilegível.
- **Celular:** direcional e botão A na tela, HUD reorganizado e combate em escala 1x para telas estreitas.

## Testes realizados

- **Automatizados (Vitest), 21 testes:**
  - Combate: substituição, clones, falha de técnica, determinismo, rendição, IA sem acesso à substituição oculta, estoque de armas.
  - Campanha: criação, sorteio determinístico, salvar e ler, conflito entre abas, migração da v0.2.0, slot ilegível.
  - Progressão, calendário e NPCs treinando.
  - Mundo dinâmico: Naruto reprova e a noite do pergaminho acontece; Naruto passa e Mizuki não é forçado; jogador na Equipe 7; pegadinha evitada.
- **No navegador (Chrome):**
  - Fluxo completo do quadro de avisos à aula do dia 2.
  - Duelo do início ao fim.
  - Minijogo de kunai e exame com repescagem.
  - Desktop 1440×900 e celular 390×844, sem rolagem lateral.
  - Console sem erros.
  - Arquivo final aberto via `file://`, offline.
- **Desempenho:** menos de 1 ms por quadro com a CPU 4× mais lenta (rua de dia 0,45 ms, rua à noite 0,77 ms, campo 0,28 ms).
- **Pendente:** validação em aparelhos físicos.

## Pendente

- **Polimento do Clássico:** ampliar provas e encontros de cada arco, equilibrar duelos com personagens em progressão normal e desenvolver as linhagens restantes.
- **Mapa mundial:** o menu já mostra o mapa local de cada área jogável de Konoha.

## Bugs conhecidos

- No navegador de testes automatizados o requestAnimationFrame fica limitado. Isso não afeta o jogador.
- Saves ficam por navegador e por endereço. Use exportação e importação para transferir jornadas entre o HTML local e outra cópia da v0.4.7 ou posterior.

## Arquitetura

O código fica em `game/` (TypeScript + Vite + Canvas 2D; testes com Vitest). O build gera um único HTML com código, arte e fonte embutidos.

| Pasta | Conteúdo |
|---|---|
| `src/data/` | Atributos, clãs, técnicas, personagens, currículo, perguntas, selos e itens. Só dados. |
| `src/state/` | Campanha (formato do save) e salvamento com migração. |
| `src/systems/` | Progressão, relações, calendário e simulador de acontecimentos. Lógica pura, testável. |
| `src/combat/` | Motor de combate e IA. Lógica pura, testável. |
| `src/render/` | Primitivas de pixel art, sprites com recoloração e os três mapas. |
| `src/scenes/` | Apresentação do combate e minijogos. |
| `src/content/` | Falas dos personagens. |
| `src/main.ts` | Telas, exploração, interações e menu. |

Comandos, dentro de `game/`:

- `npm install`
- `npm run dev`: servidor local.
- `npm test`: testes.
- `npm run build`: gera `naruto_ascensao_v<versão>.html` na raiz e `deploy/index.html`.

## Próximas etapas

1. Efeitos visuais das técnicas, com a referência do Nicolas.
2. Etapa 3: equipes, sensei, missões e primeiros acontecimentos do clássico.
