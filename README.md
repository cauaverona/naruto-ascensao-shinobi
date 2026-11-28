# Naruto: Ascensão Shinobi

RPG 2D em pixel art, jogo de fã sem fins lucrativos. A **v0.5.11** integra a arte dos seis mapas recentes e atualiza os pergaminhos do Exame Chūnin.

## Jogar

Abra `naruto_ascensao_v0.5.11.html` no navegador. O arquivo contém o jogo inteiro e funciona offline. Para apagar uma campanha, vá à lista de jornadas, use **Excluir save** no slot desejado e confirme.

Controles:

- **Andar:** WASD ou setas.
- **Interagir e avançar:** E, Enter ou espaço.
- **Menu:** Esc.
- **Celular:** direcional e botão A na tela.

Para praticar uma técnica aprendida, interaja com o posto de selos no Campo de Treino. Após as três ações da tarde, você pode fazer até dois treinos extras por dia. Use **Interromper treino** ou **Esc** durante a sessão para sair sem gastar a ação ou o chakra.

Na Vida Genin, a próxima missão fica com o sensei até você aceitar. Use **Calendário → Avançar para a tarde** nas manhãs livres ou interaja com um ponto de treino no Campo.

Depois de montar o acampamento na Estrada do Riacho, interaja com o ponto de partida do barco. Quando voltar a Konoha entre capítulos, fale com Iruka para retomar viagens pendentes.

No Exame Chūnin, acerte pelo menos quatro das cinco situações da prova escrita. Na Floresta da Morte, o mapa mostra as duas passagens. Um pergaminho do Céu avulso permite negociar pelo da Terra.

Após a final do Exame Chūnin, encontre a guarda no leste da praça. Na invasão, libere a passagem e acompanhe um grupo por vez até a baliza e o posto de socorro. O Diário registra a situação dos dois grupos.

Na Fronteira da Areia, consulte o posto oeste e a vigia da duna sul em qualquer ordem. Depois de resolver o encontro com Gaara, o Diário indica quem procurar antes de ir à casa de chá.

De volta a Konoha, investigue o Ichiraku e fale com a ronda. O sensei oferece dois planos para retirar Naruto. Consulte o mapa durante a escolta e entregue o relatório quando Naruto estiver com a guarda.

Na Equipe de resgate, fale com o sensei no início da floresta. Você pode chamar um aliado e atravessar pela passarela ao norte ou pelas pedras ao sul. O mapa também mostra um desvio opcional que ajuda no duelo.

No Vale do Fim, combine o ponto de encontro com a equipe e use o abrigo da margem, se precisar, antes de cruzar. Depois do encontro com Sasuke, procure Iruka na Rua da Academia para entregar o relato.

Depois da graduação, abra **Ficha** e escolha a posição da bandana na prévia.

A **Ficha** indica onde treinar cada atributo. Um personagem Yuki que concluiu a Vida Genin pode estudar o caderno da família na Pedra de meditação, com Ninjutsu 4 e Controle de chakra 5.

Para transferir uma jornada, use **Exportar save** na lista de jornadas ou no menu **Sistema**. Abra a outra cópia do jogo, escolha **Importar save** em uma jornada vazia e selecione o arquivo `.json`.

## Desenvolver

O código fica em [game/](game/). Ali dentro:

1. Rode `npm install`.
2. Use `npm run dev` para o servidor local, `npm test` para os testes e `npm run build` para gerar o HTML final.

O andamento, os testes e a arquitetura estão em [STATUS.md](STATUS.md).

## Arquivos do projeto

- [Projeto Mestre](Projeto_Mestre.md), visão completa do jogo, sistemas e etapas de desenvolvimento.
- [Status do desenvolvimento](STATUS.md), com o que foi feito, o que falta, os testes e a arquitetura.
- [Versão 0.5.11](naruto_ascensao_v0.5.11.html), arte dos seis mapas recentes.
- **Versão 0.5.10**, revisão de compatibilidade e progressão da campanha.
- **Versão 0.5.9**, travessia do Vale, duelo com avisos e desfechos relatados a Iruka.
- **Versão 0.5.8**, travessias e apoio de equipe na perseguição ao Quarteto do Som.
- **Versão 0.5.7**, investigação no Ichiraku, duelo com Kisame e duas rotas de retirada.
- **Versão 0.5.6**, dois postos na fronteira e dois caminhos para encontrar Tsunade.
- **Versão 0.5.5**, evacuação de Konoha com duas rotas e progresso salvo por grupo.
- **Versão 0.5.4**, sinais de Gaara e estados dos pergaminhos no Diário.
- **Versão 0.5.3**, prova escrita com situações táticas, duas rotas na floresta e troca de pergaminhos.
- **Versão 0.5.2**, investigação no cais, evacuação na ponte e duelos revisados.
- **Versão 0.5.1**, capítulos do Clássico até o Vale do Fim.
- **Versão 0.5.0**, partida de Konoha, estrada do riacho e primeiro acampamento.
- **Versão 0.4.13**, conversas e vínculos de equipe.
- [Versão 0.4.12](naruto_ascensao_v0.4.12.html), retratos de conversa ilustrados para os colegas, senseis e personagens de missão.
- [Versão 0.4.11](naruto_ascensao_v0.4.11.html), ritmo livre para treinar entre as missões, Tazuna interativo e bônus de equipamento na Ficha.
- [Versão 0.4.10](naruto_ascensao_v0.4.10.html), bandanas reposicionadas e personalizáveis.
- [Versão 0.4.9](naruto_ascensao_v0.4.9.html), treino para todos os atributos da Ficha e prova do Hyōton.
- [Versão 0.4.8](naruto_ascensao_v0.4.8.html), sprites animados dos NPCs.
- [Versão 0.4.7](naruto_ascensao_v0.4.7.html), transferência de jornadas e estoque de armas nas missões.
- [Versão 0.4.6](naruto_ascensao_v0.4.6.html), treino de jutsus, repescagem e combate.
- [Versão 0.4.4](naruto_ascensao_v0.4.4.html), mapa ilustrado e interativo de Konoha.
- [Versão 0.4.3](naruto_ascensao_v0.4.3.html), Rock Lee, Neji, Tenten e a rota do Time Guy.
- [Versão 0.4.2](naruto_ascensao_v0.4.2.html), investigação e ronda com duelo na Vida Genin.
- [Versão 0.4.1](naruto_ascensao_v0.4.1.html), cooperação da equipe, combate mais legível e exame por nota.
- [Versão 0.4.0](naruto_ascensao_v0.4.0.html), Academia revisada e Vida Genin.
- [Versão 0.3.2](naruto_ascensao_v0.3.2.html), criação de personagem ampliada e exclusão de saves.
- [Versão 0.3.1](naruto_ascensao_v0.3.1.html): só a aparência é escolhida e o resto é sorteado; mais opções de visual, som e seta de objetivo.
- [Versão 0.3.0](naruto_ascensao_v0.3.0.html): campanha unificada no mundo da cena de referência, com aulas, treino, combate e exame.
- [Versão 0.2.2](naruto_ascensao_v0.2.2.html), revisão dos personagens.
- [Versão 0.2.1](naruto_ascensao_v0.2.1.html), primeira versão da Rua da Academia.
- [Versão 0.2.0](naruto_ascensao_v0.2.0.html), fundação jogável da Etapa 1.
- [Nota do projeto](Projeto%20-%20Naruto%20Ascens%C3%A3o%20Shinobi.md), contexto e prioridades da revisão visual.
- [Guia de direção artística](Guia_Direcao_Artistica_Naruto.docx) e [referências visuais](Referencias/).
