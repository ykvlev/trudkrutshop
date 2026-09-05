-- Создание роли и баз для проекта ТрудКрутШоп.
-- Запуск от суперпользователя:
--   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -p 5433 -f scripts/create-db.sql
--
-- Пароль роли продублирован в .env.local. Для продакшена генерируется отдельный.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tksh') THEN
    CREATE ROLE tksh LOGIN PASSWORD 'cEH2L-XnHQROv0YVtGF34eZ4';
  END IF;
END
$$;

-- Prisma создаёт и удаляет теневую базу при разработке миграций
ALTER ROLE tksh CREATEDB;

SELECT 'CREATE DATABASE tksh_dev OWNER tksh ENCODING ''UTF8'' TEMPLATE template0'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tksh_dev')\gexec

SELECT 'CREATE DATABASE tksh_test OWNER tksh ENCODING ''UTF8'' TEMPLATE template0'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tksh_test')\gexec

-- Теневая база для `prisma migrate dev` (в .env задан SHADOW_DATABASE_URL).
SELECT 'CREATE DATABASE tksh_shadow OWNER tksh ENCODING ''UTF8'' TEMPLATE template0'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tksh_shadow')\gexec

\connect tksh_dev
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

\connect tksh_test
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

\echo 'Готово: роль tksh, базы tksh_dev, tksh_test, tksh_shadow, расширения pg_trgm и unaccent.'
