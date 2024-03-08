\echo 'Delete and recreate modernmaestros db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE modernmaestros;
CREATE DATABASE modernmaestros;
\connect modernmaestros

\i modernmaestros-schema.sql
-- \i modernmaestros-seed.sql

\echo 'Delete and recreate modernmaestros_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE modernmaestros_test;
CREATE DATABASE modernmaestros_test;
\connect modernmaestros_test

\i modernmaestros-schema.sql
