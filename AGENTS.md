<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Обязательный процесс CI/CD

Все изменения доставляем через последовательность:

`push → build → test → package → registry → staging → production`

- CI: push, build, test, package, registry.
- CD: staging, production.
- Публикация выполняется через CI/CD проекта. Прямой деплой с локального компьютера (в том числе через Vercel CLI) не использовать.
- Сначала проверяем результат на staging, затем доставляем проверенный артефакт в production.
- Если pipeline отсутствует или не работает, сначала настроить или исправить его; не обходить процесс ручной публикацией.
