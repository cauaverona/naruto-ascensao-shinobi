# Status do desenvolvimento

**Versão atual:** 0.3.2, Era da Academia (Etapas 1 e 2 do [Projeto Mestre](Projeto_Mestre.md)).
**Jogar:** abra `naruto_ascensao_v0.3.2.html` no navegador. Funciona offline.

## O que mudou na 0.3.2

- A lista de jornadas permite excluir um save com confirmação. A exclusão preserva os demais slots e recusa um save alterado em outra aba desde que a confirmação foi aberta.
- A ficha tem 13 penteados, 14 cores de cabelo, 6 modelos de roupa, 14 cores de traje e 4 opções de cachecol, incluindo sem cachecol. Óculos, máscara, presilha e brinco têm acabamentos que podem ser escolhidos por amostras de cor.
- A prévia pode ser girada para os quatro lados e mostra a caminhada sob demanda. Jaquetas de treino, coletes utilitários e camadas cruzadas foram desenhados para o protagonista com a [galeria oficial do anime](https://naruto-official.com/en/special/anime-gallery) e as [referências de vestuário shinobi](https://naruto-official.com/en/news/01_1429) como inspiração.
- A cicatriz, os bigodes e as marcas vermelhas seguem os pixels da pele. Os detalhes dos trajes e do cachecol respeitam o contorno do personagem em repouso e andando.
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

- **Efeitos visuais de jutsu:** aguardando referência. Hoje as técnicas aparecem como texto, e os clones como cópias translúcidas do sprite.
- **Etapa 3, Vida Genin:** sensei, missões de rank D, inventário de equipamentos e os primeiros arcos de Naruto clássico.
- **Mais colegas da turma canônica:** Ino, Shikamaru, Chōji, Kiba, Hinata e Shino. Ainda não têm sprite.
- **Minimapa e mapa mundial.**
- **Repetir uma aula perdida:** hoje só dá para recuperar as técnicas, com a aula de reforço.

## Bugs conhecidos

- No navegador de testes automatizados o requestAnimationFrame fica limitado. Isso não afeta o jogador.
- Saves ficam por navegador e por endereço: abrir o HTML por `file://` e pelo site publicado gera slots separados.

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
