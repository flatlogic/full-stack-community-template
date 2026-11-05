# Dependency maintenance (November 2026)

This repository is generator source. `backend/package.json.erb` becomes the
backend manifest during ERB rendering; its `yarn.lock` is consumed by both Docker
builds and is not an orphan lock. Keep all three Yarn locks together with their
manifests. Node 22.23 or newer is required (including the generator CLI tooling).

Updates retain Next 15, React 19, Express 4 and Sequelize 6. Unused dependencies
were removed after checking imports in both JavaScript and ERB templates. Missing
runtime declarations (`body-parser`, `validator`, `uuid`, `node-fetch`) are now
explicit. PostgreSQL, MySQL and MSSQL drivers remain available.

A few parents do not yet select their dependencies' security releases. The
backend resolutions are limited to Sequelize's CommonJS UUID v1/v4 calls,
Swagger/js-beautify's `glob.sync`/`globSync` calls, and nodemon/editorconfig's named
Minimatch APIs. The frontend resolutions update PostCSS and selector-parser
within their existing majors and TypeScript ESTree's named Minimatch API. Tests
exercise the backend APIs and real formatter/watch matching instead of relying
only on installation success. Remove these resolutions when parents include the
patched releases.

TinyMCE's React adapter is updated to version 6 and uses Tiny Cloud's supported 8 channel.
The editor still uses the configured project API key. The fixture uses the patched TinyMCE 8 npm runtime locally,
with an explicit GPL test configuration and no cloud key. Paste functionality is
part of the editor core; the obsolete `paste` and `print` plugin names are
removed. External OAuth, email, Google Cloud/Tiny Cloud and database credentials
are not used by the security fixture.

## Local verification

Use the platform's normal generator for a complete application. A deliberately
small fixture is also available to verify the shared shell and frontend without
accessing the generator service:

```sh
# Ruby with active_support string inflections (the generator uses Rails).
ruby scripts/render-security-fixture.rb
cp .security-fixture/backend/package.json backend/package.json
yarn --cwd app-shell install --frozen-lockfile
yarn --cwd backend install --frozen-lockfile
yarn --cwd frontend install --frozen-lockfile
ruby scripts/render-security-fixture.rb
node --test tests/app-shell.test.cjs
(cd .security-fixture/frontend && yarn lint && yarn build)
yarn --cwd app-shell audit
yarn --cwd backend audit
yarn --cwd frontend audit
```

The server tests connect read-only to a local PostgreSQL `postgres` database as
the local `postgres` user, check executor project authentication/file reading,
JWT expiry/tampering, Sequelize UUID defaults, Swagger discovery, and development
formatter/watcher APIs. They never initialize VCS or contact project remotes.
The fixture renders the standard users store but no entity CRUD pages and does not prove every schema/field
combination or external OAuth/email/storage integration. Generated files and
installed dependencies are ignored by Git. TypeScript errors are checked during
the build; the previous ignoreBuildErrors setting has been removed.

Primary references:

- [Next 15 security patch](https://github.com/vercel/next.js/releases/tag/v15.5.29)
- [glob cancellation advisory](https://github.com/isaacs/node-glob/security/advisories/GHSA-3g3m-2fjr-6pw4)
- [TinyMCE React integration](https://www.tiny.cloud/docs/tinymce/latest/react-ref/)
- [TinyMCE migration](https://www.tiny.cloud/docs/tinymce/latest/migration-from-6x-to-8x/)

The TinyMCE fixture page (`/security-editor/`) loads version 8.10.1 locally.
Chrome verification covers editor initialization, text entry, controlled field
updates, and bold formatting without contacting Tiny Cloud.
