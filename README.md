# Haptos 3D — publicação na Vercel

Site estático em HTML, CSS e JavaScript. O pacote contém a versão revisada do site.

## Publicar pelo painel

1. Extraia o ZIP e envie o conteúdo para um repositório GitHub, GitLab ou Bitbucket.
2. Na Vercel, escolha **Add New → Project** e importe esse repositório.
3. Use a pasta que contém `vercel.json` como **Root Directory**.
4. Selecione **Framework Preset: Other**. O `vercel.json` já define a saída como `dist` e dispensa comandos de instalação e build.
5. Clique em **Deploy**.

Não é necessário configurar variáveis de ambiente.

## Publicar pelo terminal

Na pasta que contém `vercel.json`, com Node.js instalado:

```sh
npx vercel
```

Faça login na sua conta e siga as instruções para criar ou selecionar o projeto. Esse comando gera uma publicação de prévia. Para publicar em produção:

```sh
npx vercel --prod
```

## Arquivos

- `dist/index.html`: conteúdo da página.
- `dist/style.css`: identidade visual e layout responsivo.
- `dist/app.js`: menu e formulário de orçamento.
- `dist/assets/`: imagens da marca.
- `vercel.json`: configuração de publicação.

O formulário abre o WhatsApp **+55 (11) 93284-5696** com a mensagem preenchida. O visitante confirma o envio no WhatsApp. Não há armazenamento de pedidos no site.

As fontes são carregadas pelo Google Fonts, com fontes locais alternativas. Os caminhos das imagens, estilos e scripts são relativos e não dependem da prévia local.

Para editar o telefone, atualize os links em `dist/index.html` e o destinatário em `dist/app.js`.

## Domínio próprio

Depois de publicar, adicione seu domínio em **Project Settings → Domains** e siga os registros DNS informados pela Vercel.

Documentação: https://vercel.com/docs/deployments/configure-a-build

## Portfólio e administração

- Página pública: `/portfolio.html`; painel: `/admin.html`.
- Login visível: `Haptos3D`. A senha fica somente no Supabase Auth, nunca nos arquivos do site.
- Backend: projeto FWERP existente. Tabelas `haptos_portfolio_projects` e `haptos_portfolio_admins`, bucket `haptos-portfolio`.
- Apenas usuários presentes em `haptos_portfolio_admins` podem alterar projetos e fotos. O usuário Haptos não tem associação a organizações do ERP.
- É possível criar, editar, publicar e ocultar projetos. Fotos JPG/PNG/WebP são otimizadas para WebP até 1920 px, sem recorte.
- O endereço interno de autenticação é um identificador técnico; não recebe e-mails. Recuperação de acesso deve ser feita pelo administrador do Supabase, sem alterar as configurações globais do ERP.
- O site usa a cota do projeto já contratado: não foi criado projeto adicional nem contratada mensalidade nova. Excedentes seguem o plano existente.
- `portfolio-setup.sql` registra o esquema já aplicado; não executar novamente em produção.
- Validação: login, upload, edição, publicação, leitura anônima, ocultação, bloqueio de escrita anônima e isolamento de leitura de empresas do ERP. Registros temporários removidos.

### Galeria e orçamento

- Cada projeto aceita de 1 a 8 fotos. `image_paths` guarda a galeria; `image_path` mantém a capa e a compatibilidade com projetos anteriores.
- O painel permite adicionar/remover fotos; ao salvar, arquivos removidos são limpos do armazenamento. A primeira foto é a capa.
- O visitante alterna as fotos no detalhe e usa “Quero algo parecido” para abrir o WhatsApp com o título do projeto.
- O formulário inclui medidas, quantidade e prazo desejado opcionais, enviados na mensagem de orçamento.
- Migração aplicada: `portfolio-gallery.sql`. Testados upload de duas fotos, troca na galeria, edição/remoção da capa, limpeza de arquivos e mensagem com todos os campos e com campos opcionais vazios.
