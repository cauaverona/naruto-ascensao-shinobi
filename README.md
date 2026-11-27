# Naruto: Ascensão Shinobi

RPG 2D em pixel art, jogo de fã sem fins lucrativos. A **v0.4.12** traz retratos de conversa ilustrados para 17 personagens.

## Jogar

Abra `naruto_ascensao_v0.4.12.html` no navegador. O arquivo contém o jogo inteiro e funciona offline. Para apagar uma campanha, vá à lista de jornadas, use **Excluir save** no slot desejado e confirme.

Controles:

- **Andar:** WASD ou setas.
- **Interagir e avançar:** E, Enter ou espaço.
- **Menu:** Esc.
- **Celular:** direcional e botão A na tela.

Para praticar uma técnica aprendida, interaja com o posto de selos no Campo de Treino. Após as três ações da tarde, você pode fazer até dois treinos extras por dia. Use **Interromper treino** ou **Esc** durante a sessão para sair sem gastar a ação ou o chakra.

Na Vida Genin, a próxima missão fica com o sensei até você aceitar. Use **Calendário → Avançar para a tarde** nas manhãs livres ou interaja com um ponto de treino no Campo.

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
