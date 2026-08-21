# CCB Registro Presenças

Prompt para Lovable — Sistema de Registro de Presenças e Relatório de Reuniões Técnicas Musicais

Crie uma aplicação web responsiva, moderna e profissional para registro, gerenciamento e emissão de relatórios de presença em eventos/reuniões técnicas musicais, tendo como referência estrutural e visual o documento PDF anexado denominado “Reunião Técnica Musical”.

O PDF anexado deve ser tratado como documento de referência principal para a estrutura dos resultados, especialmente para os conceitos de:

Comparecimento Total;

Ranking de Funções;

Ranking de Instrumentos;

Comparecimento por Instrumento;

Casas de Oração presentes;

Casas de Oração ausentes.

No documento de referência, o evento é uma “Reunião Técnica Musical”, realizada em 21/06/2026 às 09:00:00, no Parque Guarani.

O objetivo não é simplesmente copiar o PDF como uma página estática. O objetivo é transformar a lógica do documento em um sistema de cadastro e geração automática dos mesmos tipos de resultados.

1. OBJETIVO GERAL

O sistema deverá permitir:

Cadastrar eventos;

Cadastrar e administrar funções;

Cadastrar e administrar instrumentos musicais;

Definir quais funções possuem vínculo com instrumentos;

Cadastrar e administrar Casas de Oração/localidades;

Registrar participantes presentes em determinado evento;

Associar cada participante a uma função;

Solicitar instrumento automaticamente quando a função possuir instrumentos vinculados;

Identificar automaticamente as Casas de Oração presentes e ausentes;

Calcular automaticamente o Comparecimento Total;

Calcular o total de participantes por função;

Calcular o percentual de participantes por função;

Calcular o total de participantes por instrumento;

Calcular o percentual por instrumento;

Gerar relatório consolidado;

Gerar o relatório em PDF;

Manter a organização visual e conceitual do documento de referência.

A aplicação deve ser responsiva e funcionar adequadamente em:

computador;

notebook;

tablet;

celular.

2. PRINCÍPIO IMPORTANTE SOBRE O DOCUMENTO DE REFERÊNCIA

Não inventar dados que não estejam explicitamente definidos no documento.

O PDF apresenta as funções, os instrumentos e as localidades, mas não estabelece de forma explícita uma matriz completa dizendo qual função deve obrigatoriamente utilizar qual instrumento.

Portanto, a aplicação deve criar uma área administrativa para que o usuário possa definir essa relação.

Exemplo:

Função: MÚSICO

Pode possuir vários instrumentos associados:

Violino;

Viola;

Violoncelo;

Trompete;

Clarinete;

etc.

Função: ORGANISTA

Pode possuir:

Órgão.

Entretanto, esses vínculos devem ser configuráveis pelo administrador, e não codificados de forma rígida.

3. ESTRUTURA PRINCIPAL DA APLICAÇÃO

Criar um menu principal com as seguintes áreas:

Dashboard

Resumo do evento atualmente selecionado:

Comparecimento Total;

Participantes com instrumento;

Casas de Oração presentes;

Casas de Oração ausentes;

Ranking resumido de funções;

Ranking resumido de instrumentos.

Eventos

Permitir:

criar evento;

editar evento;

visualizar evento;

selecionar evento;

duplicar evento;

excluir evento, mediante confirmação.

Cada evento deverá possuir:

Nome do evento;

Data;

Hora de início;

Local;

Status;

Data de criação;

Data de atualização.

Exemplo inicial:

Evento: Reunião Técnica Musical
Data: 21/06/2026
Hora: 09:00
Local: Parque Guarani

Essas informações estão presentes no documento de referência.

4. CADASTRO DE PARTICIPANTES/PRESENÇAS

Criar uma tela específica denominada:

Registro de Presença

O formulário deverá conter:

Nome do participante

Campo obrigatório.

Casa de Oração

Select/dropdown pesquisável.

O usuário deve selecionar uma das Casas de Oração cadastradas.

Função

Select/dropdown pesquisável.

A função deve vir do cadastro de funções.

Instrumento

Este campo deve ter comportamento DINÂMICO.

Regra:

Se a função selecionada não possuir instrumentos vinculados, o campo Instrumento não deverá aparecer.

Se a função selecionada possuir um ou mais instrumentos vinculados, o campo deverá aparecer automaticamente.

Exemplo:

Usuário seleciona:

Função: MÚSICO

O sistema verifica a matriz:

MÚSICO → Violino, Viola, Violoncelo, Trompete etc.

Então apresenta:

Instrumento musical: [selecionar ▼]

Se o usuário selecionar:

Função: ENCARREGADO LOCAL

e essa função não tiver instrumentos vinculados, o campo Instrumento deverá desaparecer.

Essa regra deve ser implementada dinamicamente no frontend e validada também no backend.

5. REGRAS DE VALIDAÇÃO DO REGISTRO

Para registrar uma presença:

Nome é obrigatório;

Casa de Oração é obrigatória;

Função é obrigatória;

Instrumento será obrigatório SOMENTE quando a função possuir instrumentos vinculados.

Não permitir registro incompleto.

Após salvar:

limpar o formulário;

manter o evento selecionado;

atualizar imediatamente os indicadores;

atualizar rankings;

atualizar Casas de Oração presentes/ausentes.

6. LISTAGEM DE PARTICIPANTES

Abaixo do formulário de presença, mostrar uma tabela com:

NºParticipanteCasa de OraçãoFunçãoInstrumentoAções

Permitir:

editar;

excluir;

pesquisar;

filtrar por função;

filtrar por instrumento;

filtrar por Casa de Oração.

Adicionar confirmação antes da exclusão.

7. CADASTRO DE FUNÇÕES

Criar tela:

Cadastro de Funções

Cadastrar, editar, ativar/desativar e excluir funções.

Carregar inicialmente as funções identificadas no documento:

INSTRUTOR

ENCARREGADO LOCAL

INSTRUTORA

SECRETÁRIO DA MÚSICA

ENCARREGADO REGIONAL

ANCIÃO

EXAMINADORA

COLABORADORES LOCAIS

MÚSICO

ORGANISTA

OUTRAS FUNÇÕES

REGISTRO DE PRESENÇA

COOPERADOR OFICIAL

DIÁCONO

Essas funções aparecem no documento de referência.

Não eliminar a possibilidade de o administrador adicionar novas funções.

8. CADASTRO DE INSTRUMENTOS

Criar tela:

Cadastro de Instrumentos

Carregar inicialmente os instrumentos identificados no documento:

VIOLINO

TUBA

SAXOFONE ALTO

ÓRGÃO

TROMPETE

TROMBONE/TROMBONITO

VIOLONCELO

FLAUTA TRANSVERSAL

CLARINETE

SAXOFONE TENOR

VIOLA

EUFONIO

SAXOFONE BARÍTONO

SAXOFONE SOPRANO

OBOÉ

CLARINETE BAIXO

FAGOTE

FLUGELHORN

TROMPA

CORNE INGLÊS

CLARINETE ALTO

BARÍTONO

Esses instrumentos aparecem no documento de referência.

Permitir:

adicionar;

editar;

desativar;

excluir.

Não excluir fisicamente um instrumento que já esteja associado a registros históricos. Nesse caso, utilizar status ativo/inativo.

9. MATRIZ FUNÇÃO × INSTRUMENTO

Criar uma tela administrativa:

Vínculo de Funções e Instrumentos

Apresentar todas as funções em linhas e os instrumentos disponíveis.

Possibilitar marcar/desmarcar os instrumentos permitidos para cada função.

Exemplo:

MÚSICO

☑ VIOLINO
☑ VIOLA
☑ VIOLONCELO
☑ TROMPETE
☑ CLARINETE
...

ORGANISTA

☑ ÓRGÃO

ENCARREGADO LOCAL

Nenhum instrumento.

Essa matriz será a fonte oficial utilizada pelo formulário de presença.

IMPORTANTE:

Não assumir automaticamente que todas as funções musicais possuem instrumento.

A regra deverá ser configurável.

10. CADASTRO DE CASAS DE ORAÇÃO

Criar:

Cadastro de Casas de Oração

Cada Casa de Oração deverá possuir:

Nome;

Status ativo/inativo;

eventualmente código/identificador interno.

O formulário de presença deverá utilizar essa base como dropdown pesquisável.

O documento contém uma relação extensa de localidades/Casas de Oração, incluindo, por exemplo:

PARQUE GUARANI;

GUAIANAZES - CENTRAL;

VILA GUILHERMINA;

CIDADE A E CARVALHO;

ERMELINO MATARAZZO;

JARDIM BELEM;

JARDIM MARILIA;

CIDADE TIRADENTES CENTRAL;

JARDIM DAS OLIVEIRAS;

JARDIM SAO CARLOS;

VILA SALETE;

VILA VERDE;

JARDIM BANDEIRANTES;

JARDIM SAO PAULO;

PARQUE MARIA LUIZA;

PARQUE PAULISTANO;

PENHA;

QUINZE DE NOVEMBRO;

VILA ARICANDUVA;

VILA COSMOPOLITA;

VILA CURUCA VELHA;

ARTUR ALVIM;

etc.

A relação completa deve ser carregada a partir do PDF anexado, preservando as denominações apresentadas na fonte.

Não normalizar automaticamente nomes semelhantes.

Por exemplo, se a fonte apresentar variações como:

UNIAO DE VILA NOVA

UNIÃO VILA NOVA

ou:

CENTRAL GUAIANAZES

CENTRAL GUAINASES

essas entradas devem ser tratadas conforme a fonte, sem presumir que são a mesma Casa de Oração.

11. CASAS DE ORAÇÃO PRESENTES E AUSENTES

Esta é uma das regras mais importantes do sistema.

Uma Casa de Oração será considerada:

PRESENTE

Se existir pelo menos um participante registrado naquele evento associado àquela Casa de Oração.

AUSENTE

Se não existir nenhum participante registrado para aquela Casa de Oração.

Não depender de o usuário marcar manualmente “presente” ou “ausente”.

O sistema deverá calcular isso automaticamente.

O documento de referência apresenta:

Casas de Oração presentes: 120

Casas de Oração ausentes: 25

No novo sistema, esses números devem ser derivados automaticamente dos registros.

12. COMPARECIMENTO TOTAL

Criar um indicador de grande destaque no topo do relatório:

Comparecimento Total

O valor deve ser:

quantidade total de participantes registrados no evento.

Não contar instrumentos como participantes adicionais.

Não contar Casas de Oração como participantes.

Cada registro de participante = 1 presença.

O documento de referência apresenta:

Comparecimento Total: 398

13. RANKING DE FUNÇÕES

Criar seção:

Ranking de Funções

Para cada função mostrar:

Função;

quantidade;

percentual.

Exemplo conceitual:

FunçãoQuantidade%INSTRUTOR7919,85%ENCARREGADO LOCAL18............

A ordenação deverá ser:

maior quantidade → menor quantidade.

Em caso de empate, usar ordem alfabética.

O documento de referência apresenta justamente um ranking de funções e suas respectivas quantidades/percentuais.

Percentual:

quantidade da função / Comparecimento Total × 100

Formatar com duas casas decimais.

14. COMPARECIMENTO POR INSTRUMENTO

Criar seção:

Comparecimento por Instrumento

Mostrar:

Instrumento;

quantidade de participantes;

percentual.

Somente participantes que possuem instrumento devem entrar nesse ranking.

Exemplo de estrutura:

InstrumentoQuantidade%VIOLINO67...TUBA40...SAXOFONE ALTO39............

O documento de referência apresenta um “Ranking de Instrumentos” e também o indicador “Comparecimento por Instrumento: 326”.
IMPORTANTE:

O total de participantes com instrumento pode ser menor que o Comparecimento Total, porque existem funções sem instrumento.

15. DASHBOARD DO EVENTO

No topo da tela do evento apresentar cards:

Comparecimento Total

Número total de participantes.

Com Instrumento

Quantidade de participantes que possuem instrumento.

Sem Instrumento

Comparecimento Total menos participantes com instrumento.

Casas de Oração Presentes

Quantidade de Casas de Oração com pelo menos um participante.

Casas de Oração Ausentes

Quantidade de Casas de Oração sem participantes.

Funções

Quantidade de funções utilizadas no evento.

16. FILTROS E PESQUISA

O relatório deve permitir filtros por:

função;

instrumento;

Casa de Oração.

Também permitir pesquisar pelo nome do participante.

Os indicadores e tabelas deverão ser atualizados de acordo com os filtros.

Adicionar opção:

“Limpar filtros”.

17. RELATÓRIO FINAL

Criar uma página:

Relatório do Evento

A estrutura visual deve ser inspirada no documento PDF.

No cabeçalho:

[Nome do Evento]

Data: DD/MM/AAAA
Hora: HH:MM
Local: [Local]

Em seguida:

Comparecimento Total

Número grande e destacado.

Ranking de Funções

Tabela/ranking.

Ranking de Instrumentos

Tabela/ranking.

Comparecimento por Instrumento

Total geral de participantes com instrumento.

Casas de Oração Presentes

Listagem com:

Casa de Oração;

quantidade de representantes;

percentual, se aplicável.

Casas de Oração Ausentes

Listagem de todas as Casas de Oração que não possuem nenhum representante.

18. PDF

O sistema deverá possuir um botão:

Gerar PDF

O PDF deve ser profissional e adequado para impressão.

Priorizar formato:

A4 vertical, com possibilidade de múltiplas páginas.

A estrutura deve preservar a lógica do documento de referência, sem tentar reproduzir imperfeições de leitura do PDF.

O relatório deverá conter:

Cabeçalho do evento;

Comparecimento Total;

Ranking de Funções;

Ranking de Instrumentos;

Comparecimento por Instrumento;

Casas de Oração presentes;

Casas de Oração ausentes.

Adicionar numeração de páginas.

Adicionar data/hora de geração no rodapé.

O PDF não deve parecer um relatório genérico de sistema. Deve ter aparência de um documento oficial de reunião técnica musical, mantendo a simplicidade e organização do documento de referência.

19. BANCO DE DADOS

Utilizar banco de dados relacional, preferencialmente Supabase/PostgreSQL, com estrutura semelhante a:

events

id

name

date

start_time

location

status

created_at

updated_at

functions

id

name

active

created_at

updated_at

instruments

id

name

active

created_at

updated_at

function_instruments

id

function_id

instrument_id

prayer_houses

id

name

active

created_at

updated_at

attendees

id

event_id

name

prayer_house_id

function_id

instrument_id nullable

created_at

updated_at

Criar foreign keys adequadas.

Criar índices para:

event_id;

prayer_house_id;

function_id;

instrument_id.

20. INTEGRIDADE DOS DADOS

Implementar as seguintes regras:

Não permitir função inexistente;

Não permitir instrumento inexistente;

Não permitir Casa de Oração inexistente;

Não permitir instrumento incompatível com a função;

Não permitir participante sem função;

Não permitir participante sem Casa de Oração;

Não permitir instrumento quando a função não possuir aquele instrumento vinculado;

Não permitir dois vínculos idênticos função × instrumento;

Não apagar fisicamente cadastros que já possuam histórico.

21. EXPERIÊNCIA DO USUÁRIO

A interface deve ser:

limpa;

profissional;

intuitiva;

rápida;

responsiva;

adequada para utilização durante uma reunião.

O registro de presença deve exigir o mínimo possível de cliques.

Idealmente:

Nome;

Casa de Oração;

Função;

Instrumento, se aplicável;

botão Registrar.

Depois do registro, o cursor deve retornar automaticamente para o campo Nome para facilitar o cadastro sequencial de centenas de participantes.

Isso é especialmente importante porque o documento de referência trabalha com centenas de participantes — no exemplo, 398 participantes.

22. RESPONSIVIDADE

No celular:

utilizar cards;

evitar tabelas excessivamente largas;

transformar tabelas em listas/cards quando necessário;

manter botões grandes;

campos com largura total;

dropdowns pesquisáveis.

No desktop:

utilizar layout em duas ou três colunas quando adequado;

manter dashboard com indicadores lado a lado;

permitir visualização ampla das tabelas.

23. DESIGN VISUAL

Utilizar uma identidade visual sóbria, semelhante à natureza do documento:

azul acinzentado;

azul petróleo;

branco;

cinza claro;

tipografia moderna;

bordas discretas;

tabelas limpas.

Não utilizar excesso de cores, gradientes ou elementos decorativos.

A prioridade é:

clareza + rapidez de registro + aparência de documento oficial.

24. ORDENAÇÃO DOS RANKINGS

Todos os rankings devem ser ordenados por quantidade decrescente.

Exemplo:

79
40
39
29
23
19
...

O documento de referência apresenta exatamente essa lógica de ranking.

Quando houver empate:

quantidade maior primeiro;

depois ordem alfabética.

25. PERCENTUAIS

Utilizar sempre:

quantidade / total × 100

com duas casas decimais.

Exemplo:

79 participantes de um total de 398:

79 / 398 × 100 = 19,85%

Manter o padrão de percentual apresentado no documento, como “18,66%”, “11,14%”, “10,86%” etc.

26. HISTÓRICO POR EVENTO

Um participante não deve ser simplesmente cadastrado globalmente como “presente”.

A presença pertence a um evento específico.

Portanto:

Evento A:

João;

Maria;

Pedro.

Evento B:

João;

Carlos;

Ana.

Esses registros são independentes.

O sistema deverá permitir consultar eventos anteriores sem alterar seus resultados.

27. DUPLICIDADE DE PARTICIPANTES

Não bloquear automaticamente duas pessoas com o mesmo nome.

Duas pessoas podem possuir nomes iguais.

Porém, criar um alerta caso exista:

mesmo nome;

mesma Casa de Oração;

mesma função;

mesmo evento.

O sistema pode perguntar:

“Já existe um participante com esses mesmos dados. Deseja continuar?”

Não impedir o registro sem confirmação.

28. IMPORTAÇÃO INICIAL

Criar os cadastros iniciais com base no PDF anexado:

Funções

Utilizar a relação apresentada no documento.

Instrumentos

Utilizar a relação apresentada no documento.

Casas de Oração

Utilizar a relação apresentada na página 2 do documento.

Não utilizar os números de quantidade do relatório de exemplo como dados fixos do sistema.

Os números 398, 326, 120, 25 etc. pertencem ao relatório daquele evento específico e devem servir apenas como referência de estrutura e validação visual, não como valores hardcoded.

29. REGRA FUNDAMENTAL SOBRE OS RESULTADOS

O sistema NÃO deve possuir números fixos como:

Comparecimento Total = 398;

Comparecimento por Instrumento = 326;

Casas presentes = 120;

Casas ausentes = 25.

Esses números são apenas os resultados existentes no PDF de referência.

No aplicativo real, os valores devem ser calculados em tempo real a partir da tabela de participantes do evento.

Por exemplo:

Se forem registrados 10 participantes:

Comparecimento Total = 10

Se 7 tiverem instrumento:

Comparecimento por Instrumento = 7

Se 8 Casas de Oração possuírem representantes:

Casas presentes = 8

E assim sucessivamente.

30. RELATÓRIO EM TEMPO REAL

Sempre que uma presença for:

adicionada;

editada;

excluída;

recalcular automaticamente:

Comparecimento Total;

Ranking de Funções;

Ranking de Instrumentos;

Comparecimento por Instrumento;

Casas presentes;

Casas ausentes.

Não exigir atualização manual da página.

31. SEGURANÇA E PERMISSÕES

Estruturar a aplicação para permitir futuramente usuários autenticados.

Criar pelo menos os conceitos:

Administrador

Pode:

criar eventos;

editar eventos;

cadastrar funções;

cadastrar instrumentos;

cadastrar Casas de Oração;

configurar vínculos;

registrar presenças;

excluir registros;

gerar relatórios.

Operador

Pode:

selecionar evento;

registrar presença;

editar presença;

visualizar resultados;

gerar PDF.

O controle de permissões pode ser implementado inicialmente de maneira simples, mas a arquitetura deve permitir evolução.

32. REQUISITOS TÉCNICOS

Utilizar:

React;

TypeScript;

Tailwind CSS;

Supabase/PostgreSQL;

componentes modernos;

arquitetura organizada;

validação de formulários;

tratamento de erros;

loading states;

empty states;

confirmação antes de ações destrutivas.

Utilizar componentes reutilizáveis.

Separar:

componentes;

páginas;

serviços;

tipos;

queries;

regras de negócio.

33. ESTADOS DA INTERFACE

Implementar:

Loading

Durante carregamento dos dados.

Empty state

Quando ainda não houver participantes.

Exemplo:

“Não há participantes registrados neste evento.”

Error state

Quando houver erro de comunicação com banco.

Success feedback

Após:

salvar evento;

registrar presença;

atualizar cadastro;

gerar relatório.

34. CONFIRMAÇÕES

Antes de:

excluir participante;

excluir função;

excluir instrumento;

excluir Casa de Oração;

excluir evento;

excluir todos os participantes.

Mostrar confirmação clara.

35. RELATÓRIO DEVE SER INDEPENDENTE DO DASHBOARD

O Dashboard pode ser moderno e interativo.

Entretanto, o PDF deve ser mais sóbrio.

O PDF deve seguir a estrutura:

REUNIÃO TÉCNICA MUSICAL

Data / Hora / Local

Comparecimento Total

Ranking de Funções

Ranking de Instrumentos

Comparecimento por Instrumento

Casas de Oração Presentes

Casas de Oração Ausentes

Não transformar o PDF em uma simples captura de tela do dashboard.

36. CRITÉRIOS DE ACEITAÇÃO

Considerar o projeto concluído somente quando:

for possível criar um evento;

for possível editar o evento;

for possível cadastrar funções;

for possível cadastrar instrumentos;

for possível cadastrar Casas de Oração;

for possível vincular funções a instrumentos;

o instrumento aparecer dinamicamente conforme a função;

o instrumento seja obrigatório quando houver vínculo;

seja possível registrar participantes;

seja possível editar participantes;

seja possível excluir participantes;

o Comparecimento Total seja calculado automaticamente;

o ranking de funções seja calculado automaticamente;

o ranking de instrumentos seja calculado automaticamente;

o percentual seja calculado automaticamente;

Casas de Oração presentes sejam calculadas automaticamente;

Casas de Oração ausentes sejam calculadas automaticamente;

os números não sejam hardcoded;

o relatório seja atualizado em tempo real;

seja possível gerar PDF;

o PDF seja A4 e adequado para impressão;

o sistema funcione em celular;

o sistema funcione em desktop;

os dados históricos permaneçam associados ao evento correto.

37. IMPORTANTE — NÃO ALTERAR A PROPOSTA CONCEITUAL

Não transformar o sistema em um sistema genérico de controle de pessoas.

O foco deve permanecer claramente em:

REUNIÕES TÉCNICAS MUSICAIS + REGISTRO DE PRESENÇA + FUNÇÕES + INSTRUMENTOS + CASAS DE ORAÇÃO + RELATÓRIO ESTATÍSTICO.

A estrutura conceitual do documento deve ser preservada.

Melhorias de UX, filtros, pesquisa, banco de dados, responsividade e segurança são bem-vindas, desde que não descaracterizem o modelo de relatório.

38. REFERÊNCIA DO DOCUMENTO

Use o PDF anexado como referência visual e estrutural.

Ele apresenta:

“Reunião Técnica Musical”;

data 21/06/2026;

horário 09:00:00;

local Parque Guarani;

ranking de instrumentos;

ranking de funções;

Comparecimento Total;

Comparecimento por Instrumento;

relação de Casas de Oração;

Casas de Oração presentes;

Casas de Oração ausentes.
A aplicação deve transformar essa estrutura de relatório em um sistema operacional e reutilizável para novos eventos.

39. ENTREGA ESPERADA

Ao finalizar a implementação, entregar:

Aplicação funcional;

Banco de dados configurado;

Dados iniciais importados;

Relacionamento função × instrumento funcional;

Registro de presença funcional;

Dashboard;

Relatório;

Geração de PDF;

Layout responsivo;

Dados persistentes;

Tratamento de erros;

Validações;

Código organizado e pronto para evolução.

Antes de considerar o projeto concluído, faça um teste completo criando um evento de teste, cadastrando participantes com funções com e sem instrumentos, verificando os rankings, verificando Casas de Oração presentes/ausentes e gerando o PDF.

O resultado final deve ser uma aplicação profissional, simples de operar durante uma reunião e fiel à lógica estatística e estrutural apresentada no documento de referência.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ccb-registro-presencas.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/068f08ab-3449-4a94-974b-bc94dc482699).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
