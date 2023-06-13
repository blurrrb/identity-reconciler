# Identity Reconciler

A micro-service implementation to reconcile emails/phone numbers on the go.

## Deployment

Service is hosted at [https://identity-reconciler.blrb.workers.dev](https://identity-reconciler.blrb.workers.dev)

### Curl away

```bash
curl -XPOST 'https://identity-reconciler.blrb.workers.dev/identify' -H "content-type: application/json" -d '{"email":"biffsucks@hillvalley.edu", "phoneNumber":"717171"}' | jq
```

## TechStack

- [**Cloudflare workers**](https://workers.cloudflare.com/) : hosting serverless function
- [**Neon.tech**](https://neon.tech/): serverless postgres
- [**Pnpm**](https://pnpm.io/): package manager
- [**Drizzle orm and kit**](https://drizzle.team/): orm and db migrations
- [**Vitest**](https://vitest.dev/): testing
- [**Github actions**](https://github.com/blurrrb/identity-reconciler/tree/main/.github/workflows): continuous integration and deployments
- [**Hono**](https://hono.dev/): routing
- [**Eslint**](https://eslint.org/): linting (catching code smells)
- [**Prettier**](https://prettier.io/): code formating
- [**Esbuild**](https://esbuild.github.io/): building payload to deploy to cloudflare
- [**Docker compose**](https://docs.docker.com/compose/): local postgres to run integration tests

## Directory structure

All source code is defined under`src`. The top level is utilized for defining configs for various tools and external dependencies.

- `src/cmd`: all runnables are defined here
  - `worker.ts`: entrypoint for cloudflare worker script
  - `migrate.ts`: entrypoint for migration script
- `src/*.ts`: these files define the domain
  - `contacts.ts`: define the domain `contacts`
    - contains definition of the actual domain object
    - repository interface to deal with persistence of the domain objects
    - unit of work interface to deal with atomic (transactional) operations on the store
    - no implementations are provided, it is the responsibility of store to provide these implementations
  - `reconcilation.ts`: contains business login. Deals with handling of linking and reconcilation
- `src/hono-cloudflare`: defines infrastructure being provided by hono and cloudflare.
  - `router.ts`: defines all the routes being handled by hono in one place for quick reference
  - `controller.ts`: define various controllers being used by application. Controllers are lean in the sense that they only perform data validation at the application boundary and pass on the actual handling to domain.
  - `app_state.ts`: performs the necessary **dependency injections**, constructs the application state and makes it available to the controller.
- `src/drizzle`: contains all db related implementations
  - `store/`: contains driver initialization code. Supports neon.tech serverless driver and node-pg driver for interacting with postgres.
  - `contacts.ts`: actual implementation of contacts repo and link contacts unit of work.
  - `schema.ts`: drizzle specific declarative postgres schema definition.
- `test/**.test.ts`: integration tests

## Salient features of codebase

- follows SOLID principles
- The domain is modelled with domain objects, interfaces and concrete services that do not depend on external packages.
- All dependencies on external packages are held in their own packages, example, drizzle and hono-cloudflare.
- **Say you start to hate drizzle and start to like prisma** (believe me, drizzle is amazing, even better than prisma, and this is just an example), **you can simply delete the drizzle folder and create a new folder for prisma**. Implement the domain interfaces, updates `src/hono-cloudflare/app_state.ts` to use the new implementation for contacts repo and link contacts unit of work and you are set. No extra work needed.
- I believe that integration tests should only test the side-effects and not how the side effects are produced, hence, they are put inside their own folder `test/`
- Unit tests on the other hand should test the internal implementation. So, they belong closer to the actual source code where they can access the un-exported/private bits of the code to actually test the implementation. That is why unit tests are written in-source [https://vitest.dev/guide/in-source.html](https://vitest.dev/guide/in-source.html)

```typescript
if (import.meta.vitest) {
  // unit tests go here
}
```

## CI/CD

- All the tests, format check, linting steps are run on each push. Defined here: [https://github.com/blurrrb/identity-reconciler/blob/main/.github/workflows/test.yml](https://github.com/blurrrb/identity-reconciler/blob/main/.github/workflows/test.yml)
- The deployment pipeline, on the other hand, should be triggered manually and is defined here: [https://github.com/blurrrb/identity-reconciler/blob/main/.github/workflows/deploy.yml](https://github.com/blurrrb/identity-reconciler/blob/main/.github/workflows/deploy.yml). The pipeline will take care of running the migrations.

## Dev setup

- clone the repository: `git clone https://github.com/blurrrb/identity-reconciler.git`
- install dependencies: `pnpm install`
- create a db on [https://neon.tech/](https://neon.tech/)
- create config file: `cat .dev.vars.template > .dev.vars`
- edit `.dev.vars` and configure `neon.tech` db connection url
- run migrations: `DATABASE_URL=<neon.tech connection url> pnpm run migrate`
- start server: `pnpm run start`
- curl away! `curl -XPOST 'http://localhost:8787/identify' -H "content-type: application/json" -d '{"email":"biffsucks@hillvalley.edu", "phoneNumber":"717171"}' | jq`

## Running tests

- start postgres in docker: `docker compose up -d` (required for running integration tests)
- run unit tests: `pnpm run test:unit`
- run integration tests: `pnpm run test:integration`
- **or** run all the tests at once: `pnpm run test`
- open test ui: `pnpm run test:ui`

## Modifying db schema and running migrations

- The db schema is defined in `src/drizzle/schema.ts`
- After modifying the schema, run the following to generate migrations: `pnpm run migrations`
- Th run the migrations manually (the deployment pipeline takes care of running migrations on production github action piepline), run: `DATABASE_URL=<neon.tech connection url> pnpm run migrate`
