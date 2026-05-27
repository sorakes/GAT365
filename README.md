# GAT365 - Microsoft 365 MCP Server 🚀

Bem-vindo ao **GAT365**, um Servidor do protocolo MCP (Model Context Protocol) focado em integrações avançadas e arquitetura corporativa com o ecossistema Microsoft 365 (Graph API).

---

## 🌟 Origem do Projeto

Este repositório é um fork modificado e otimizado baseado no projeto original excelente criado por **[Softeria/ms-365-mcp-server](https://github.com/Softeria/ms-365-mcp-server)**. 

A fundação do código base e a lógica de comunicação via Microsoft Graph pertencem ao repositório original. Nós evoluímos essa fundação adicionando uma suíte robusta de funcionalidades Enterprise, como:

- 🏗️  **Migração do Storage para o Redis:** O Cache de Tokens do MSAL agora vive centralizado na nuvem/banco para suportar múltiplos workers em nuvem, não sofrendo mais de locks por disco local.
- 🚦  **Rastreabilidade Ativa no BullMQ:** Monitoramento ponta a ponta na fila. É possível ver exatamente qual usuário Microsoft engatilhou qual ferramenta do LLM via Painel de Auditoria em tempo real.
- 🔐  **Gerenciamento Dinâmico de Contas:** Uma nova aba no Painel Next.js dedicada para forçar o logout de contas específicas (limpeza de sessões ativas).
- 🐳  **Orquestração em Contêineres Limpa:** Introdução do `docker-compose.yml` isolando as portas de forma flexível e deixando o ambiente produtivo.

## 🛠️ Como usar

1. Crie o seu arquivo de segredos baseado no arquivo de exemplo existente:
   ```bash
   cp .env.example .env
   ```
2. Inicie os servidores (incluindo o banco Redis e o Painel Admin):
   ```bash
   docker compose up -d --build
   ```
3. Acesse o **Painel de Controle** pelo seu navegador no endereço: `http://localhost:3050`.

Para conectar as ferramentas MCP em si a um cliente LLM (Claude Desktop, Cursor, Open-WebUI), configure a conexão STDIO ou HTTP conforme as documentações clássicas do protocolo MCP.

---
*Este repositório respeita a licença MIT de seu mantenedor original, agregando funcionalidades modulares para uso prático avançado.*
