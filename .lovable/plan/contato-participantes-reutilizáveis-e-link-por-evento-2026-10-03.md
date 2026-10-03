# Contato, participantes reutilizáveis e link por evento

## Resultado
- Acrescentar **Fone/WhatsApp** ao registro de presenças, com máscara brasileira para celular e telefone fixo.
- Permitir presença normal sem Nome e sem Fone/WhatsApp; manter Casa, Função e Instrumento (quando aplicável) obrigatórios.
- Criar um cadastro reutilizável de participantes para sugerir nomes e preencher o contato, preservando em cada presença uma cópia histórica do nome e telefone usados naquele evento.
- Disponibilizar um link único por evento, com botão de copiar e acesso direto ao formulário correto após autenticação.

## Alterações no aplicativo
- Trocar o campo Nome por pesquisa com sugestões e seleção de participante existente.
- Exibir o botão **Novo** quando o nome não for encontrado; abrir um cadastro rápido, salvar e selecionar o novo participante automaticamente.
- Normalizar nomes para localizar diferenças de maiúsculas, espaços e acentos, sem impedir homônimos confirmados pelo usuário.
- Ao selecionar um participante, preencher o contato cadastrado; alterações feitas no registro não modificarão presenças antigas.
- Manter Treinamento no formulário próprio e com os campos atuais obrigatórios. O contato não será acrescentado ao Treinamento nesta etapa, pois o documento o define como condicional.
- Exibir o link individual na tela de Eventos, com confirmação **Link copiado**.
- Criar uma tela de acesso direto que mostra somente o evento do link, sem seletor ou lista de outros eventos, e encaminha para Presenças ou Treinamento conforme o tipo.
- Manter a prioridade da Casa do local para Ensaio Musical também no acesso direto.
- Informar claramente quando o evento estiver encerrado e bloquear novos registros.

## Segurança e dados
- Criar a estrutura de participantes com acesso apenas autenticado e políticas alinhadas às permissões já existentes.
- Adicionar às presenças o participante opcional e a cópia histórica opcional de Fone/WhatsApp; permitir Nome vazio somente nos eventos normais.
- Gerar um identificador público aleatório e único para cada evento, sem usar o ID interno como link compartilhável.
- Validar no banco: tipo correto do formulário, evento aberto, Casa autorizada por Setor ou “Todas as Casas”, vínculos Função × Instrumento e limites/formato dos novos campos.
- Não criar autoinscrição pública; o link continuará exigindo login e respeitando Administrador/Colaborador.

## Validação
- Testar presença sem nome/contato e presença com nome sem contato.
- Testar pesquisa, preenchimento automático, cadastro rápido e prevenção orientada de duplicidade.
- Testar todos os campos obrigatórios e CPF duplicado/inválido em Treinamento.
- Testar links distintos para dois eventos, acesso isolado, autenticação e evento encerrado.
- Testar Colaborador restrito ao Setor, bloqueio no banco e liberação por “Todas as Casas de Oração”.
- Testar Ensaio Musical, computador, tablet e celular, sem cortes ou sobreposição.
- Confirmar que dados existentes foram preservados e remover todos os registros temporários de homologação.

## Detalhes técnicos
- Atualizar os tipos gerados e os hooks de leitura/gravação após a migração.
- Criar componentes pequenos para máscara de telefone, pesquisa de participante e visualização de acesso direto.
- Manter relatórios, PDFs, Dashboard, identidade visual, regra do ÓRGÃO e demais módulos sem mudanças funcionais.
