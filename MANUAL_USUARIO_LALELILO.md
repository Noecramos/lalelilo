# 📘 MANUAL DO USUÁRIO - LALELILO SAAS

## Versão 1.0 | Fevereiro 2026

---

## 🎯 VISÃO GERAL DO SISTEMA

**Lalelilo** é uma plataforma SaaS completa de gestão omnichannel para redes de varejo de moda infantil, desenvolvida pela **Noviapp AI Systems**. O sistema integra e-commerce, CRM, gestão de lojas, mensageria multicanal, gamificação e muito mais em uma única solução.

### Modelo de Negócio
- **Marca:** Lalelilo (Moda Infantil)
- **Estrutura:** 30 lojas físicas distribuídas pelo Brasil
- **Website:** lalelilo.com.br
- **Tecnologia:** Next.js 15 + Supabase + IA Gemini

---

## 📋 ÍNDICE

1. [Áreas do Sistema](#áreas-do-sistema)
2. [Loja Virtual (Cliente Final)](#loja-virtual-cliente-final)
3. [Painel Super Admin](#painel-super-admin)
4. [Painel Shop Admin](#painel-shop-admin)
5. [Sistema de Login e Autenticação](#sistema-de-login-e-autenticação)
6. [Plataforma Novix (Gestão de Clientes)](#plataforma-novix)

---

## 🏢 ÁREAS DO SISTEMA

O Lalelilo possui **3 áreas principais**:

### 1. **Loja Virtual (Área Pública)**
- Acesso: `lalelilo.com.br`
- Usuários: Clientes finais
- Funcionalidades: Compras, cadastro, navegação de produtos

### 2. **Painel Super Admin**
- Acesso: `lalelilo.com.br/super-admin`
- Usuários: Administradores da rede Lalelilo
- Funcionalidades: Gestão completa de todas as 30 lojas

### 3. **Painel Shop Admin**
- Acesso: `lalelilo.com.br/shop-admin/[id-da-loja]`
- Usuários: Gerentes de cada loja individual
- Funcionalidades: Gestão da própria loja

### 4. **Plataforma Novix (Opcional)**
- Acesso: `novix.noviapp.com.br`
- Usuários: Equipe Noviapp (suporte técnico)
- Funcionalidades: Gerenciamento de múltiplos clientes SaaS

---

## 🛍️ LOJA VIRTUAL (CLIENTE FINAL)

### 1. PÁGINA INICIAL (`/`)

#### Elementos Visuais
- **Banner Animado**: GIF promocional no topo (`/teaser.gif`)
- **Logo Circular**: Logo Lalelilo sobreposto ao banner
- **Título**: "Lalelilo Moda Infantil - Roupa de Criança com Amor e Estilo"
- **Botão Instagram**: Link direto para @lalelilokids

#### Ícones de Ação (Abaixo do Título)
1. **Ícone Conta** 👤
   - Função: Redireciona para `/register` (cadastro)
   - Tooltip: "Cadastre-se"

2. **Ícone Compartilhar** 🔗
   - Função: Abre WhatsApp com mensagem pré-formatada
   - Mensagem: "🛍️ *Lalelilo Moda Infantil* - Roupa de Criança com Amor e Estilo - ✨ Confira nossa loja online! - 🔗 [URL]"

3. **Ícone Carrinho** 🛒
   - Função: Redireciona para `/cart`
   - Tooltip: "Carrinho"

#### Seletor de Localização
- **Componente**: Barra fixa com ícone de mapa
- **Texto**: "Escolha sua localização" ou "Entrega em: [cidade]"
- **Botão**: "Alterar" → redireciona para `/location`

#### Categorias de Produtos (Pills Horizontais)
Botões deslizáveis com ícones:
- 👗 Vestidos
- 👕 Conjuntos
- 👖 Calças
- 👚 Camisetas
- 🩳 Shorts
- 🎀 Acessórios
- 👟 Sapatos

#### Grid de Produtos em Destaque
- **Layout**: Grid responsivo (2-6 colunas conforme tela)
- **Cada Card Contém**:
  - Imagem do produto (aspect ratio 3:4)
  - Botão coração (favoritar) no canto superior direito
  - Nome do produto
  - Preço em destaque (cor laranja)
  - Hover: Zoom suave na imagem

#### Modal de Detalhes do Produto
**Acionado ao clicar em qualquer produto**

**Lado Esquerdo - Galeria de Imagens**:
- Carrossel de imagens com zoom
- Navegação por setas
- Indicadores de posição (bolinhas)

**Lado Direito - Informações**:
- Nome do produto
- Preço (fonte grande, cor laranja)
- Botão compartilhar (WhatsApp)
- Descrição completa
- Tamanhos disponíveis (se houver)
- **Botões de Ação**:
  - "Adicionar ao Carrinho" (primário, laranja)
  - "Continuar Comprando" (outline)

#### Seção "Lojas Próximas"
- **Layout**: Grid de 3 colunas
- **Cada Card**:
  - Nome da loja
  - Cidade com ícone de localização
  - Badge de distância (se disponível)
  - Botão "Ver Loja"

#### Botão Flutuante WhatsApp
- **Posição**: Canto inferior direito, fixo
- **Função**: Abre chat WhatsApp com número da loja
- **Número**: 5581999999999

---

### 2. CATÁLOGO DE PRODUTOS (`/products`)

#### Cabeçalho
- Botão voltar (canto superior esquerdo)
- Título: "Nossos Produtos"
- Logo Lalelilo

#### Barra de Ferramentas
**Filtros e Busca**:
- **Campo de Busca**: Ícone lupa + placeholder "Buscar produtos..."
- **Filtro por Categoria**: Dropdown com todas as categorias
- **Ordenação**: Dropdown com opções:
  - Mais Recentes
  - Menor Preço
  - Maior Preço
  - Mais Vendidos
  - A-Z
  - Z-A

#### Grid de Produtos
- Mesmo layout da página inicial
- Todos os produtos da loja
- Paginação ou scroll infinito

#### Funcionalidades
- Busca em tempo real
- Filtros combinados
- Indicador de estoque
- Avaliações com estrelas
- Badge "Em Destaque" para produtos destacados

---

### 3. SELETOR DE LOCALIZAÇÃO (`/location`)

#### Cabeçalho
- Botão voltar
- Título: "Escolha sua Loja"
- Subtítulo: "Selecione a loja mais próxima de você"

#### Funcionalidades Principais

**1. Botão de Geolocalização**
- Ícone: 📍 Navigation
- Texto: "Usar minha localização"
- Função: Solicita permissão de GPS e ordena lojas por proximidade

**2. Campo de Busca**
- Placeholder: "Buscar por cidade ou nome da loja..."
- Busca em tempo real

**3. Lista de Lojas**
Cada card de loja exibe:
- Nome da loja
- Endereço completo
- Cidade e estado
- Telefone com ícone
- Distância (se geolocalização ativada)
- Badge de status:
  - 🟢 "Aberta" (verde)
  - 🔴 "Fechada" (vermelho)
- Checkbox de seleção

**4. Botão Confirmar Seleção**
- Posição: Fixo no rodapé (sticky)
- Texto: "Confirmar Loja Selecionada"
- Ação: Salva preferência e redireciona para produtos

---

### 4. CARRINHO DE COMPRAS (`/cart`)

#### Estrutura da Página

**Cabeçalho**:
- Logo Lalelilo
- Título: "Carrinho"
- Contador de itens

**Lista de Produtos no Carrinho**:
Cada item mostra:
- Imagem do produto (miniatura 80x80px)
- Nome do produto
- Preço unitário
- **Controles de Quantidade**:
  - Botão "-" (diminuir)
  - Número atual
  - Botão "+" (aumentar)
- Subtotal (preço × quantidade)
- Botão lixeira (remover item)

**Resumo do Pedido** (sidebar direita):
- Subtotal
- Taxa de entrega
- **Total** (destaque em laranja)
- Botão "Ir para Checkout"

---

### 5. CHECKOUT (`/checkout`)

#### Layout em 3 Colunas

**Coluna 1 e 2 - Formulários**:

**A. Itens do Pedido**
- Lista completa com imagens
- Controles de quantidade
- Opção de remover itens

**B. Tipo de Pedido**
Dois botões grandes:
1. **Entrega** 🚚
   - Custo: R$ 10,00
   - Requer endereço completo

2. **Retirada** 🏪
   - Custo: Grátis
   - Não requer endereço

**C. Informações do Cliente**
Campos obrigatórios:
- Nome Completo
- Telefone/WhatsApp
- Email (opcional)

Se **Entrega** selecionada:
- Endereço Completo
- Cidade
- CEP

**D. Forma de Pagamento**
4 opções em botões circulares:
- **PIX** (recomendado)
- **Débito**
- **Crédito**
- **Dinheiro**

**E. Informações PIX** (se PIX selecionado)
Card verde com:
- Chave PIX (com botão copiar)
- Nome do favorecido
- Valor a pagar (destaque)
- Aviso: "Após pagar, clique em Finalizar Pedido"

**Coluna 3 - Resumo**:
Card fixo (sticky) com:
- Subtotal
- Taxa de entrega
- **Total** (grande, laranja)
- Botão "Finalizar Pedido"
- Texto legal: "Ao finalizar, você concorda com nossos termos"

---

### 6. PÁGINA DE SUCESSO (`/checkout/success`)

#### Elementos Visuais
- **Animação**: Confete automático ao carregar
- **Ícone**: ✅ CheckCircle grande (verde)
- **Título**: "Pedido Realizado com Sucesso!"
- **Número do Pedido**: Código único destacado

#### Informações do Pedido
- Status atual
- Valor total
- Forma de pagamento
- Tipo de entrega
- Endereço (se entrega)

#### Próximos Passos
Lista numerada:
1. Aguarde confirmação por WhatsApp
2. Acompanhe o status do pedido
3. Prepare-se para receber/retirar

#### Botões de Ação
- "Ver Meus Pedidos"
- "Voltar para Loja"
- "Compartilhar Compra" (WhatsApp)

---

### 7. CADASTRO DE CLIENTE (`/register`)

#### Formulário de Cadastro
Campos:
- Nome Completo *
- E-mail *
- WhatsApp *
- Cidade *
- Endereço (opcional)

#### Botões
- "Finalizar Cadastro" (primário)
- Botão voltar (flutuante, canto inferior esquerdo)

#### Página de Sucesso
Após cadastro:
- Ícone de sucesso
- Mensagem: "Cadastro Realizado!"
- Texto de boas-vindas
- Redirecionamento automático em 3s
- Botão "Ir para o Início"

---

## 👑 PAINEL SUPER ADMIN

**Acesso**: `/super-admin`
**Autenticação**: Requer login como super_admin

### LAYOUT GERAL

#### Sidebar (Menu Lateral)
**Topo**:
- Logo Lalelilo (fundo branco)
- Botão fechar (mobile)

**Navegação** (13 itens):
1. 📊 Visão Geral
2. 🏪 Lojas
3. 👑 Clientes
4. 👥 CRM
5. 💬 Central Msgs (Omnichannel)
6. 📞 Chat Interno
7. 📈 Analytics
8. 📄 Relatórios
9. 🏆 Gamificação
10. ✅ Checklists
11. 📦 Reabastecimento
12. 🎫 Tickets
13. 👥 Equipe
14. 📞 Suporte (WhatsApp externo)

**Rodapé**:
- Logo Noviapp
- Texto: "© 2026 Novix Online • Powered by Noviapp AI Systems ®"
- Link: www.noviapp.com.br

**Cores**: Gradiente roxo-rosa (from-purple-700 via-purple-800 to-pink-700)

#### Barra Superior
- Botão menu (mobile)
- Título: "Painel Super Admin"
- Avatar do usuário (círculo gradiente)
- Nome: "Admin Master"
- Subtítulo: "Lalelilo Brasil"
- Botão "Sair"

---

### 1. VISÃO GERAL (`/super-admin`)

#### Cards de Métricas (4 cards)

**1. Receita Total**
- Ícone: 💵 DollarSign (verde)
- Valor: R$ formatado
- Período: "Últimos 30 dias"
- Crescimento: % com seta (verde/vermelho)

**2. Total de Pedidos**
- Ícone: 🛍️ ShoppingBag (azul)
- Valor: Número de pedidos
- Crescimento: % comparado ao mês anterior

**3. Lojas Ativas**
- Ícone: 🏪 Store (roxo)
- Valor: X de 30 lojas
- Subtítulo: "De 30 lojas totais"

**4. Ticket Médio**
- Ícone: 📈 TrendingUp (laranja)
- Valor: R$ por pedido
- Subtítulo: "Por pedido"

#### Tabela: Top 5 Lojas por Receita

**Colunas**:
1. **Posição**: Medalha colorida (🥇🥈🥉)
2. **Loja**: Nome da loja
3. **Cidade**: Com ícone de localização
4. **Receita**: Valor em R$
5. **Pedidos**: Quantidade
6. **Crescimento**: Badge colorido com %
7. **Ações**: Link "Ver Loja"

#### Cards de Insights (3 cards)

**1. Alertas**
- ⚠️ 3 lojas com estoque baixo
- 🔴 2 lojas com queda nas vendas (-15%)

**2. Destaques do Mês**
- 📈 Loja com maior crescimento
- 🛍️ Produto mais vendido

**3. Ações Rápidas**
- Ver todas as lojas
- Analytics detalhado
- Gerar relatório

---

### 2. LOJAS (`/super-admin/shops`)

#### Cabeçalho
- Título: "Lojas"
- Subtítulo: "Gerencie todas as X lojas Lalelilo"
- Botão: "+ Nova Loja"

#### Cards de Estatísticas (3 cards)
1. Total de Lojas
2. Lojas Ativas
3. Lojas Inativas

#### Filtros
- **Busca**: Por nome ou cidade
- **Botões de Filtro**:
  - Todas
  - Ativas
  - Inativas

#### Tabela de Lojas

**Colunas**:
1. **Loja**: Nome + slug (URL)
2. **Localização**: Cidade, Estado
3. **Contato**: Telefone
4. **Senha**: 
   - ✅ "Configurada" + botão "Resetar"
   - OU botão "Gerar Senha"
5. **Último Login**: Data e hora (ou "Nunca")
6. **Receita (30d)**: Valor em R$
7. **Pedidos (30d)**: Quantidade
8. **Status**: Badge "Ativa" ou "Inativa"
9. **Ações**: 
   - 👁️ "Ver" (abre painel da loja)
   - ✏️ "Editar"

#### Modal: Editar Loja

**Campos**:
- Nome da Loja *
- Slug (URL) *
- Cidade *
- Estado * (2 letras)
- Telefone *
- WhatsApp
- Email
- Endereço Completo
- CNPJ (máx 18 caracteres)
- Checkbox: "Loja Ativa"

**Botões**:
- "Cancelar"
- "Salvar Alterações"

#### Modal: Nova Loja
Mesmos campos do modal de edição

#### Modal: Senha Gerada

**Exibição**:
- Título: "🔑 Senha Gerada"
- Nome da loja
- **Senha**: Fonte mono, grande, roxo, em destaque
- Botão "Copiar" (muda para "Copiado!" com ✓)
- Aviso amarelo: "⚠️ Importante: Copie esta senha agora! Ela não será exibida novamente."

**Informações**:
- A senha foi salva no sistema
- Usuário pode fazer login com slug + senha
- Email enviado automaticamente (se configurado)

---

### 3. CLIENTES (`/super-admin/users`)

#### Cabeçalho
- Título: "Gestão de Clientes"
- Subtítulo: "Visualize todos os clientes cadastrados"
- Campo de busca (ícone lupa)

#### Tabela de Clientes

**Colunas**:
1. **Cliente**: 
   - Avatar circular (ícone usuário)
   - Nome completo
   - ID (8 primeiros caracteres)

2. **Contato**:
   - 📧 Email
   - 📱 WhatsApp

3. **Localização**:
   - 📍 Cidade
   - Endereço (truncado)

4. **Cadastro**:
   - 📅 Data formatada (dd/MM/yyyy)

5. **Ações**:
   - Botão "Ver Perfil"

---

### 4. CRM (`/super-admin/crm`)

#### Cards de Métricas (6 cards)

**Leads**:
1. Total de Leads
2. Leads Qualificados
3. Clientes Ativos
4. VIPs
5. Inativos
6. Leads Não Atribuídos

**Por Canal**:
- WhatsApp
- Instagram
- Facebook

#### Filtros
- Status (todos, lead, qualificado, cliente, VIP, inativo)
- Canal (todos, WhatsApp, Instagram, Facebook)
- Loja atribuída

#### Tabela de Contatos

**Colunas**:
1. **Contato**:
   - Avatar com inicial
   - Nome
   - Telefone

2. **Status**: Badge colorido
   - 🔵 Lead
   - 🟣 Qualificado
   - 🟢 Cliente
   - 🟡 VIP
   - ⚪ Inativo

3. **Origem**: Ícone do canal
   - 📱 WhatsApp
   - 📷 Instagram
   - 👍 Facebook
   - 👤 Manual
   - 🛒 E-commerce

4. **Loja**: Nome da loja atribuída

5. **Valor Vitalício**: R$ total gasto

6. **Pedidos**: Quantidade

7. **Último Contato**: Data

8. **Ações**: Dropdown para mudar status

---

### 5. CENTRAL DE MENSAGENS - OMNICHANNEL (`/super-admin/omnichannel`)

**Integração com**: WhatsApp, Instagram, Facebook

#### Layout em 3 Colunas

**Coluna 1 - Lista de Conversas**

**Cabeçalho**:
- Título: "Conversas"
- Botão "Atualizar"
- Filtros:
  - Todas
  - Não Lidas
  - WhatsApp
  - Instagram
  - Facebook

**Cada Conversa**:
- Avatar do contato
- Nome do contato
- Ícone do canal (colorido)
- Última mensagem (preview)
- Horário
- Badge de mensagens não lidas (se houver)
- Loja atribuída

**Coluna 2 - Mensagens**

**Cabeçalho da Conversa**:
- Avatar + nome do contato
- Ícone do canal
- Loja atribuída
- Status da conversa

**Área de Mensagens**:
- Scroll automático para última mensagem
- Mensagens do contato (esquerda, fundo cinza)
- Mensagens do agente (direita, fundo roxo)
- Mensagens do sistema (centro, fundo amarelo)
- Timestamp em cada mensagem
- Status de leitura (✓ enviado, ✓✓ lido)

**Cada Mensagem Tem**:
- Botões de ação (hover):
  - ✏️ Editar
  - 🗑️ Deletar
  - 📁 Arquivar

**Campo de Envio**:
- Input de texto
- Botão "Enviar" (ícone avião)

**Coluna 3 - Informações do Contato**

**Seções**:
1. **Dados do Contato**:
   - Nome
   - Telefone
   - Instagram ID
   - Facebook ID

2. **Estatísticas**:
   - Total de mensagens
   - Primeira conversa
   - Última atividade

3. **Ações**:
   - Atribuir a loja
   - Mudar status
   - Ver histórico completo

#### Funcionalidades Especiais

**Edição de Mensagens**:
- Clique em "Editar"
- Campo inline aparece
- Botões: "Salvar" / "Cancelar"

**Mensagens Arquivadas**:
- Botão "Ver Arquivadas"
- Modal com lista de mensagens arquivadas
- Opção de restaurar

---

### 6. CHAT INTERNO (`/super-admin/messages`)

**Comunicação entre**: Super Admin ↔ Shop Admins

#### Layout em 2 Colunas

**Coluna 1 - Conversas**

**Cabeçalho**:
- Título: "Mensagens"
- Botão "+ Nova Conversa"
- Campo de busca

**Lista de Conversas**:
- Nome da loja
- Última mensagem
- Horário
- Badge de não lidas

**Coluna 2 - Chat**

**Cabeçalho**:
- Nome da loja
- Status online/offline

**Mensagens**:
- Super Admin (direita, roxo)
- Shop (esquerda, cinza)
- Timestamps
- Status de leitura

**Campo de Envio**:
- Input de texto
- Botão enviar

#### Modal: Nova Conversa
- Lista de todas as lojas
- Busca por nome
- Clique para iniciar conversa

#### Funcionalidade Broadcast
- Botão "Enviar para Todas as Lojas"
- Modal de confirmação
- Mensagem enviada para todas simultaneamente

---

### 7. ANALYTICS (`/super-admin/analytics`)

#### Seletor de Período
Dropdown no topo direito:
- Últimos 7 dias
- Últimos 30 dias
- Últimos 90 dias
- Último ano

#### Cards de Métricas (4 cards)
1. Receita Total
2. Total Pedidos
3. Produtos Vendidos
4. Ticket Médio

#### Gráfico: Evolução de Receita
- Tipo: Barras horizontais animadas
- Período: Últimos 7 dias
- Eixo X: Datas
- Eixo Y: Valores em R$
- Cor: Gradiente laranja-rosa

#### Gráfico: Desempenho por Categoria
- Tipo: Barras horizontais com ranking
- Top 5 categorias
- Mostra: Vendas + Receita
- Medalhas: 🥇🥈🥉 para top 3

#### Tabela: Comparação de Lojas
Top 5 por receita

**Colunas**:
1. Posição (medalha)
2. Loja
3. Receita
4. Pedidos
5. Ticket Médio
6. Crescimento %

---

### 8. RELATÓRIOS (`/super-admin/reports`)

#### Gerador de Relatórios

**Formulário** (3 campos):
1. **Tipo de Relatório**:
   - Vendas
   - Estoque
   - Desempenho
   - Produtos
   - Clientes
   - Financeiro

2. **Período**:
   - Últimos 7 dias
   - Últimos 30 dias
   - Últimos 90 dias
   - Último ano
   - Personalizado

3. **Formato**:
   - PDF
   - Excel (XLSX)
   - CSV

**Botão**: "Gerar Relatório" (com loading)

#### Modelos de Relatórios (6 cards)

Cada card mostra:
- Ícone colorido
- Nome do relatório
- Descrição breve
- Clique para selecionar

**Modelos**:
1. 📊 Relatório de Vendas
2. 📦 Relatório de Estoque
3. 📈 Desempenho de Lojas
4. 🏆 Produtos Mais Vendidos
5. 👥 Análise de Clientes
6. 💰 Relatório Financeiro

#### Relatórios Recentes

**Tabela**:
- Nome do relatório
- Data de geração
- Formato (PDF/Excel/CSV)
- Tamanho do arquivo
- Botão "Baixar"

#### Estatísticas Rápidas (4 cards)
1. Relatórios Gerados (este mês)
2. Downloads (este mês)
3. Formato Mais Usado
4. Último Relatório

---

### 9. GAMIFICAÇÃO (`/super-admin/gamification`)

#### Leaderboard (Ranking de Colaboradores)

**Tabela**:
1. **Rank**: Emoji de medalha
   - 🥇 1º lugar
   - 🥈 2º lugar
   - 🥉 3º lugar
   - Números para demais

2. **Colaborador**:
   - Avatar
   - Nome
   - Loja

3. **Cargo**: Badge colorido
   - 👑 Super Admin
   - 💼 Gerente
   - ⭐ Vendedor
   - 👁️ Auditor
   - 👥 Equipe

4. **XP**: Pontos de experiência

5. **Nível**: Calculado por XP

#### Badges e Conquistas

**Grid de Badges**:
Cada badge mostra:
- Ícone
- Nome
- Descrição
- XP necessário
- Categoria:
  - 🏆 Vendas
  - ❤️ Atendimento
  - ⚡ Produtividade
  - 🎯 Metas

**Categorias de Badges**:
- Vendedor do Mês
- Atendimento 5 Estrelas
- Meta Batida
- Streak de Vendas
- Cliente Fidelizado

---

### 10. CHECKLISTS (`/super-admin/checklists`)

**Sistema de Checklists Operacionais**

#### Templates de Checklist

**Lista de Templates**:
Cada card mostra:
- Nome do template
- Categoria (Abertura, Fechamento, Auditoria, etc.)
- Descrição
- Status: Ativo/Inativo
- Número de itens
- Botão "Expandir/Recolher"

#### Estrutura de um Template

**Seções Agrupadas**:
Exemplo: "Abertura de Loja"

**Seção 1: Limpeza**
1. ✅ Limpar vitrines
2. ✅ Varrer o chão
3. ✅ Organizar provadores

**Seção 2: Sistemas**
1. ✅ Ligar computadores
2. ✅ Abrir sistema de vendas
3. ✅ Verificar conexão

**Tipos de Input**:
- ✅ Checkbox (sim/não)
- 📷 Foto (upload obrigatório)
- 🔢 Número (quantidade)
- 📝 Texto livre

**Configurações Avançadas**:
- Item obrigatório (*)
- Gera ticket automático se falhar
- Prioridade do ticket (alta/média/baixa)
- Valores que indicam falha

---

### 11. REABASTECIMENTO (`/super-admin/replenishment`)

**Sistema de Gestão de Transferências CD → Lojas**

#### Cards de Status (4 cards)
1. 📦 Solicitados
2. ⏳ Em Separação
3. 🚚 Em Trânsito
4. ✅ Recebidos

#### Filtros
- Status (todos, solicitado, processando, em trânsito, recebido, cancelado)
- Loja
- Período

#### Tabela de Solicitações

**Colunas**:
1. **#**: Número da solicitação
2. **Loja**: Nome da loja solicitante
3. **CD**: Centro de distribuição
4. **Itens**: Quantidade total de itens
5. **Data Solicitação**: Data/hora
6. **Previsão Entrega**: Data estimada
7. **Status**: Badge colorido
   - 🔵 Solicitado
   - 🟡 Em Separação
   - 🟠 Em Trânsito
   - 🟢 Recebido
   - 🔴 Cancelado
8. **Ações**: 
   - 👁️ Ver Detalhes
   - ➡️ Avançar Status

#### Modal: Detalhes da Solicitação

**Informações Gerais**:
- Número da solicitação
- Loja solicitante
- CD de origem
- Solicitado por (nome do usuário)
- Data da solicitação
- Previsão de entrega
- Data de recebimento (se recebido)
- Observações

**Tabela de Itens**:
- Imagem do produto
- Nome
- SKU
- Tamanho
- Quantidade solicitada
- Quantidade atendida
- Status do item

**Histórico de Status**:
Timeline mostrando:
- Data/hora da mudança
- Status anterior → novo status
- Usuário responsável
- Observações

**Botões de Ação**:
- "Avançar para [próximo status]"
- "Cancelar Solicitação"
- "Imprimir Romaneio"

---

### 12. TICKETS (`/super-admin/tickets`)

**Sistema de Gestão de Problemas e Tarefas**

#### Cards de Estatísticas (6 cards)

**Por Status**:
1. 🔴 Abertos
2. 🟡 Em Andamento
3. 🟢 Resolvidos
4. ⚪ Fechados

**Por Prioridade**:
5. 🔴 Alta
6. 🟡 Média
7. 🟢 Baixa

#### Botão: "+ Novo Ticket"

#### Filtros
- Status
- Prioridade
- Categoria
- Loja
- Atribuído a

#### Tabela de Tickets

**Colunas**:
1. **#**: Número do ticket
2. **Título**: Resumo do problema
3. **Categoria**: Badge
   - 🔧 Manutenção
   - 💻 TI
   - 📦 Estoque
   - 👥 RH
   - 🛍️ Vendas
4. **Prioridade**: Badge com ícone
   - 🔴⬆️ Alta
   - 🟡➖ Média
   - 🟢⬇️ Baixa
5. **Status**: Badge colorido
6. **Loja**: Nome da loja
7. **Atribuído a**: Nome do responsável
8. **Criado em**: Data
9. **Ações**: 
   - 👁️ Ver
   - ➡️ Mudar Status

#### Modal: Novo Ticket

**Formulário**:
- Título *
- Descrição *
- Categoria *
- Prioridade *
- Loja *
- Atribuir a *
- Cargo/Função
- Upload de fotos (múltiplas)

**Botões**:
- "Cancelar"
- "Criar Ticket"

#### Modal: Detalhes do Ticket

**Informações**:
- Número do ticket
- Título
- Descrição completa
- Categoria
- Prioridade
- Status
- Loja
- Atribuído a
- Cargo
- Criado em
- Atualizado em

**Galeria de Fotos**:
- Miniaturas clicáveis
- Modal de visualização ampliada

**Histórico de Atividades**:
- Mudanças de status
- Comentários
- Reatribuições
- Timestamps

**Ações**:
- Mudar status
- Reatribuir
- Adicionar comentário
- Fechar ticket

---

### 13. EQUIPE (`/super-admin/team`)

#### Cards de Estatísticas por Cargo (5 cards)
1. 👑 Super Admins
2. 💼 Gerentes
3. ⭐ Vendedores
4. 👁️ Auditores
5. 👥 Equipe Geral

#### Grid de Colaboradores

**Cada Card de Colaborador**:
- Avatar circular (gradiente por cargo)
- Inicial do nome
- Nome completo
- Badge de cargo (colorido)
- Status online (bolinha verde/cinza)
- Email
- Telefone
- Loja (se aplicável)

**Cores por Cargo**:
- Super Admin: Roxo
- Gerente: Azul
- Vendedor: Verde
- Auditor: Amarelo
- Equipe: Cinza

---

## 🏪 PAINEL SHOP ADMIN

**Acesso**: `/shop-admin/[shop-id]`
**Autenticação**: Gerente da loja específica

### LAYOUT GERAL

#### Sidebar
**Navegação** (7 itens):
1. 📊 Dashboard
2. 🛍️ Pedidos
3. 👥 Clientes
4. 📦 Estoque
5. 🚚 Reabastecimento
6. 💬 Mensagens
7. ⚙️ Configurações
8. 📞 Suporte Whats (externo)

**Cores**: Fundo branco, itens ativos em laranja

#### Barra Superior
- Título: "Painel da Loja"
- Avatar (círculo laranja)
- Botão "Sair"

---

### 1. DASHBOARD (`/shop-admin/[shop-id]`)

#### Cards de Métricas (4 cards)
1. 💵 Vendas (30d)
2. 🛍️ Pedidos (30d)
3. ⏳ Pedidos Pendentes
4. ⚠️ Estoque Baixo

#### Tabela: Pedidos Recentes

**Colunas**:
1. Número do Pedido
2. Cliente
3. Valor
4. Status (badge)
5. Data

#### Cards de Ações (3 cards)
1. **Ações Rápidas**:
   - Ver todos os pedidos
   - Gerenciar estoque
   - Configurações da loja

2. **Produtos em Destaque**:
   - Lista dos mais vendidos

3. **Alertas**:
   - Produtos com estoque baixo

---

### 2. PEDIDOS (`/shop-admin/[shop-id]/orders`)

#### Filtros
- Status (todos, pendente, confirmado, preparando, enviado, entregue, cancelado)
- Período (hoje, semana, mês, personalizado)
- Tipo (entrega, retirada)

#### Tabela de Pedidos

**Colunas**:
1. **#**: Número do pedido
2. **Cliente**: Nome + telefone
3. **Itens**: Quantidade de produtos
4. **Valor**: Total em R$
5. **Tipo**: Badge (Entrega/Retirada)
6. **Status**: Badge colorido
7. **Data**: Data/hora
8. **Ações**: 
   - 👁️ Ver Detalhes
   - 📝 Mudar Status

#### Modal: Detalhes do Pedido

**Informações do Cliente**:
- Nome
- Telefone
- Email
- Endereço (se entrega)

**Itens do Pedido**:
Tabela com:
- Imagem
- Nome do produto
- Quantidade
- Preço unitário
- Subtotal

**Resumo Financeiro**:
- Subtotal
- Taxa de entrega
- **Total**

**Informações do Pedido**:
- Número
- Data/hora
- Tipo (entrega/retirada)
- Forma de pagamento
- Status atual

**Ações**:
- Dropdown "Mudar Status":
  - Confirmar Pedido
  - Iniciar Preparação
  - Marcar como Enviado
  - Marcar como Entregue
  - Cancelar Pedido
- Botão "Imprimir Pedido"
- Botão "Enviar WhatsApp para Cliente"

---

### 3. CLIENTES (`/shop-admin/[shop-id]/users`)

**Visualização da base de clientes cadastrados**

#### Cabeçalho
- Título: "Base de Clientes"
- Subtítulo: "Consulte os dados dos clientes para melhorar seu atendimento"
- Campo de busca (nome ou WhatsApp)

#### Tabela de Clientes

**Colunas**:
1. **Cliente**: Avatar + nome
2. **WhatsApp**: Com ícone, clicável
3. **Cidade**: Localização
4. **Membro Desde**: Mês/ano
5. **Ações**: Botão "Enviar WhatsApp"

---

### 4. ESTOQUE (`/shop-admin/[shop-id]/inventory`)

#### Filtros
- Busca por nome/SKU
- Categoria
- Status:
  - Todos
  - Estoque OK
  - Estoque Baixo
  - Sem Estoque

#### Tabela de Inventário

**Colunas**:
1. **Produto**:
   - Imagem (miniatura)
   - Nome
   - SKU

2. **Categoria**: Nome da categoria

3. **Preço**: R$ unitário

4. **Estoque Atual**: Número
   - Verde: OK
   - Amarelo: Baixo
   - Vermelho: Crítico

5. **Limite Mínimo**: Threshold configurado

6. **Status**: Badge
   - 🟢 OK
   - 🟡 Baixo
   - 🔴 Crítico

7. **Ações**: 
   - ✏️ Ajustar Estoque

#### Modal: Ajustar Estoque

**Informações do Produto**:
- Imagem
- Nome
- SKU
- Estoque atual

**Formulário**:
- Nova quantidade *
- Limite mínimo
- Motivo do ajuste (opcional)

**Botões**:
- "Cancelar"
- "Salvar"

---

### 5. REABASTECIMENTO (`/shop-admin/[shop-id]/replenishment`)

**Solicitação de produtos do CD**

#### Botão: "+ Nova Solicitação"

#### Cards de Status (4 cards)
1. Solicitados
2. Em Separação
3. Em Trânsito
4. Recebidos

#### Tabela de Solicitações

**Colunas**:
1. **#**: Número
2. **CD**: Centro de distribuição
3. **Itens**: Quantidade
4. **Data Solicitação**
5. **Previsão Entrega**
6. **Status**: Badge
7. **Ações**: 
   - 👁️ Ver
   - ✅ Confirmar Recebimento (se em trânsito)
   - ❌ Cancelar (se solicitado)

#### Modal: Nova Solicitação

**Formulário**:
- CD de Destino *
- Observações

**Adicionar Itens**:
- Botão "+ Adicionar Item"

**Cada Item**:
- Dropdown: Selecionar Produto
- Dropdown: Tamanho
- Input: Quantidade
- Botão: Remover

**Resumo**:
- Total de itens
- Total de unidades

**Botões**:
- "Cancelar"
- "Enviar Solicitação"

#### Modal: Detalhes da Solicitação
Similar ao Super Admin, mas com ações limitadas

---

### 6. MENSAGENS (`/shop-admin/[shop-id]/messages`)

**Chat com Super Admin**

#### Layout em 2 Colunas

**Coluna 1 - Conversas**:
- Apenas uma conversa: "Super Admin"
- Badge de não lidas

**Coluna 2 - Chat**:
- Mensagens do Super Admin (esquerda, roxo)
- Mensagens da loja (direita, laranja)
- Status de leitura
- Campo de envio

#### Funcionalidades
- Enviar mensagens
- Ver histórico completo
- Notificação de novas mensagens
- Marcar como lida automaticamente

---

### 7. CONFIGURAÇÕES (`/shop-admin/[shop-id]/settings`)

#### Seções de Configuração

**1. Informações Básicas**
- Nome da Loja *
- Telefone *
- WhatsApp
- Email

**2. Endereço**
- Endereço Completo *
- Cidade *
- Estado *
- CEP *

**3. Horário de Funcionamento**
Grid de 7 dias:
- Checkbox "Aberto"
- Horário Abertura
- Horário Fechamento

Exemplo:
```
Segunda-feira: ☑️ Aberto | 09:00 - 18:00
Terça-feira:   ☑️ Aberto | 09:00 - 18:00
...
Domingo:       ☐ Fechado
```

**4. Informações de Pagamento**
- Chave PIX
- Nome do Favorecido PIX

**Botão**: "Salvar Configurações"

---

## 🔐 SISTEMA DE LOGIN E AUTENTICAÇÃO

### PÁGINA DE LOGIN (`/login`)

#### Layout
- Logo Lalelilo (centralizado)
- Título: "Acesso ao Painel"
- Subtítulo: "Faça login para continuar"

#### Formulário

**Campos**:
1. **Usuário**:
   - Ícone: 👤 User
   - Placeholder: "Slug da loja ou email"
   - Tipo: text

2. **Senha**:
   - Ícone: 🔒 Lock
   - Placeholder: "Sua senha"
   - Tipo: password
   - Botão mostrar/ocultar (👁️)

**Checkbox**: "Lembrar-me"

**Botões**:
- "Entrar" (primário, gradiente laranja-rosa)
- Link: "Esqueci minha senha"

#### Funcionalidade "Esqueci Minha Senha"

**Modal**:
- Título: "Recuperar Senha"
- Campo: Email ou Slug
- Botão: "Enviar Link de Recuperação"
- Mensagem de sucesso: "Se o email existir, você receberá instruções"

#### Redirecionamento Após Login
- **Super Admin** → `/super-admin`
- **Shop Admin** → `/shop-admin/[slug-da-loja]`

#### Proteção de Rotas
Middleware verifica:
- Cookie `auth_session`
- Validade da sessão
- Permissões de acesso
- Redireciona para `/login` se não autenticado

---

## 🏢 PLATAFORMA NOVIX (GESTÃO DE CLIENTES)

**Acesso**: `novix.noviapp.com.br` ou `localhost:3000/novix`

### PROPÓSITO
Plataforma de gestão multi-tenant para a Noviapp gerenciar múltiplos clientes SaaS (Lalelilo, outros clientes futuros)

### LOGIN NOVIX (`/novix-login`)

#### Formulário
- Email
- Senha
- Botão "Entrar"

#### Autenticação
- Cookie separado: `novix_session`
- Não interfere com sessões Lalelilo

### DASHBOARD NOVIX (`/novix`)

#### Lista de Clientes
Cada card mostra:
- Logo do cliente
- Nome da empresa
- Status (Ativo/Inativo)
- Plano contratado
- Data de contratação
- Botão "Acessar Dashboard"

#### Funcionalidades
- Criar novo cliente
- Editar configurações
- Ver métricas de uso
- Gerenciar cobranças
- Suporte técnico

---

## 📱 RECURSOS ESPECIAIS

### 1. BOTÃO WHATSAPP FLUTUANTE

**Aparece em**:
- Todas as páginas públicas
- Checkout
- Páginas de sucesso

**Posição**: Canto inferior direito, fixo
**Cor**: Verde WhatsApp
**Ícone**: Logo WhatsApp
**Ação**: Abre chat com número da loja

### 2. COMPARTILHAMENTO SOCIAL

**Componente**: ShareButton

**Tipos**:
- Produto
- Loja
- Pedido

**Canais**:
- WhatsApp (principal)
- Link copiado

**Mensagem Formatada**:
```
🛍️ *[Nome do Produto]*

💰 R$ [Preço]

✨ Confira na Lalelilo!

🔗 [Link]
```

### 3. GALERIA DE IMAGENS

**Funcionalidades**:
- Carrossel de imagens
- Zoom ao clicar
- Navegação por setas
- Indicadores de posição
- Swipe em mobile

### 4. NOTIFICAÇÕES

**Tipos**:
- Toast (canto superior direito)
- Alertas inline
- Badges de contagem

**Eventos**:
- Novo pedido
- Mensagem recebida
- Estoque baixo
- Status atualizado

### 5. LOADING STATES

**Componentes**:
- Spinner circular
- Skeleton screens
- Progress bars
- Texto "Carregando..."

**Posições**:
- Fullscreen
- Inline
- Botões

---

## 🎨 IDENTIDADE VISUAL

### Cores Principais
- **Laranja Lalelilo**: `#ffa944`
- **Rosa Lalelilo**: `#ff8f9b`
- **Teal**: `#4fd1c5`
- **Fundo Rosa**: `#fff5f7`

### Gradientes
- **Header**: `from-lale-pink to-lale-orange`
- **Super Admin Sidebar**: `from-purple-700 via-purple-800 to-pink-700`
- **Botões Primários**: `from-lale-orange to-lale-pink`

### Tipografia
- **Fonte**: System fonts (sans-serif)
- **Títulos**: Bold, 2xl-3xl
- **Corpo**: Regular, sm-base
- **Botões**: Semibold, tracking-wide

### Ícones
- **Biblioteca**: Lucide React
- **Tamanho**: 16-24px (padrão)
- **Cor**: Contextual (cinza, laranja, verde, etc.)

---

## 🔔 NOTIFICAÇÕES E ALERTAS

### Tipos de Alertas

**1. Sucesso** (Verde)
- Pedido criado
- Configurações salvas
- Ação concluída

**2. Aviso** (Amarelo)
- Estoque baixo
- Ação requer atenção
- Prazo próximo

**3. Erro** (Vermelho)
- Falha no pagamento
- Erro de validação
- Ação bloqueada

**4. Informação** (Azul)
- Dicas do sistema
- Novidades
- Instruções

### Posicionamento
- **Toast**: Canto superior direito, auto-dismiss 3s
- **Inline**: Dentro do formulário/seção
- **Modal**: Centralizado, requer ação

---

## 📊 MÉTRICAS E KPIs

### Métricas Principais

**Vendas**:
- Receita total
- Ticket médio
- Crescimento %
- Comparativo mensal

**Operacional**:
- Pedidos pendentes
- Taxa de conversão
- Tempo médio de entrega
- Satisfação do cliente

**Estoque**:
- Giro de estoque
- Produtos em falta
- Valor do inventário
- Itens com baixo estoque

**CRM**:
- Leads gerados
- Taxa de conversão
- Lifetime value
- Churn rate

---

## 🔒 SEGURANÇA E PERMISSÕES

### Níveis de Acesso

**1. Cliente Final**
- Navegar produtos
- Fazer pedidos
- Ver próprio histórico

**2. Shop Admin**
- Ver dados da própria loja
- Gerenciar pedidos da loja
- Ajustar estoque
- Configurar loja

**3. Super Admin**
- Acesso total
- Todas as lojas
- Todos os relatórios
- Configurações globais

**4. Novix Admin**
- Gestão de clientes
- Configurações de sistema
- Suporte técnico

### Proteções

**Middleware**:
- Verifica autenticação
- Valida permissões
- Redireciona não autorizados

**API**:
- JWT tokens
- Rate limiting
- CORS configurado

**Dados**:
- Row Level Security (Supabase)
- Criptografia de senhas
- Logs de auditoria

---

## 🚀 FLUXOS PRINCIPAIS

### Fluxo de Compra (Cliente)
1. Navegar produtos
2. Selecionar localização
3. Adicionar ao carrinho
4. Preencher dados
5. Escolher pagamento
6. Finalizar pedido
7. Receber confirmação

### Fluxo de Pedido (Loja)
1. Receber notificação
2. Visualizar detalhes
3. Confirmar pedido
4. Preparar itens
5. Marcar como enviado/pronto
6. Confirmar entrega

### Fluxo de Reabastecimento
1. Loja solicita produtos
2. CD recebe solicitação
3. Separação de itens
4. Envio para loja
5. Loja confirma recebimento
6. Atualização de estoque

### Fluxo de Ticket
1. Criar ticket
2. Atribuir responsável
3. Investigar problema
4. Resolver issue
5. Fechar ticket
6. Avaliar solução

---

## 📞 SUPORTE E CONTATO

### Canais de Suporte

**Para Lojas**:
- WhatsApp: 558183920320
- Chat interno (mensagens)
- Email: suporte@lalelilo.com.br

**Para Clientes**:
- WhatsApp da loja
- Botão flutuante no site
- Email da loja

**Para Noviapp**:
- Portal Novix
- Email: contato@noviapp.com.br
- WhatsApp: 558183920320

---

## 🎓 GLOSSÁRIO

**CD**: Centro de Distribuição
**CRM**: Customer Relationship Management
**Omnichannel**: Atendimento integrado em múltiplos canais
**SKU**: Stock Keeping Unit (código do produto)
**Slug**: Identificador único em URL (ex: lalelilo-centro)
**Badge**: Etiqueta visual de status
**Toast**: Notificação temporária
**Middleware**: Camada de segurança entre requisições
**RLS**: Row Level Security (segurança em nível de linha)

---

## 📝 NOTAS FINAIS

### Atualizações Futuras
- Integração com redes sociais
- App mobile nativo
- IA para recomendações
- Programa de fidelidade
- Marketplace de fornecedores

### Desenvolvido por
**Noviapp AI Systems®**
- Website: www.noviapp.com.br
- Tecnologia: Next.js 15 + Supabase + IA Gemini
- Ano: 2026

---

**FIM DO MANUAL**

*Versão 1.0 - Fevereiro 2026*
*© 2026 Novix Online • Powered by Noviapp AI Systems ®*
