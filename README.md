# MAIA Hub

Rede social para criadores e freelancers. A pessoa mostra o trabalho, segue outros criadores, curte, deixa recados e se encontra pela habilidade.

O site está em `apps/web`. A API está em `apps/api`. Os contratos em Zod estão em `packages/shared`.

## Stack

- Next.js 15, React 19, TypeScript e Tailwind CSS
- Node.js, Express e TypeScript
- PostgreSQL e Prisma
- Login com JWT em cookie `httpOnly`

## O que dá para fazer

- Criar conta e entrar
- Ver um mural com trabalhos de quem você segue
- Publicar post ou projeto
- Editar e apagar o próprio trabalho
- Seguir, curtir e deixar recado
- Buscar criadores por habilidade
- Ver avisos de follow, curtida e recado

## Conta de visita

Na home, o botão **Entrar para ver** abre o mural já preenchido.

- E-mail: `marina@maiahub.dev`
- Senha: `visitar-maia`

Essa conta segue os outros criadores de demonstração. Os dados nascem no seed.

## Como rodar

Na raiz, com Node.js 20+ e pnpm. Se `pnpm` não estiver no PATH, use `corepack pnpm`.

```powershell
corepack pnpm install
Copy-Item apps\api\.env.example apps\api\.env
Copy-Item apps\web\.env.example apps\web\.env.local
corepack pnpm build:shared
corepack pnpm prisma:generate
corepack pnpm --filter @maia-hub/api exec prisma migrate dev
corepack pnpm --filter @maia-hub/api exec prisma db seed
corepack pnpm dev
```

- Site: http://localhost:3000
- API: http://localhost:3333/health

Preencha `JWT_SECRET` e `DATABASE_URL` em `apps/api/.env` antes de migrar. Esse arquivo não entra no Git.

## Publicar

- Site na Vercel, com `NEXT_PUBLIC_API_URL` apontando para a API.
- API e Postgres na Railway.
- Na API, `WEB_ORIGIN` precisa ser a URL da Vercel. Se houver mais de um endereço, separe por vírgula.
- Em produção o cookie usa `SameSite=None` e `Secure`, para o login funcionar entre os dois endereços.

O link público entra aqui depois do deploy.
