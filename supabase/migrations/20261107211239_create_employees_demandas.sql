/*
# Create employees table for Demandas dashboard (single-tenant, no auth)

1. New Tables
- `employees`
  - `id` (int, primary key)
  - `name` (text, collaborator full name)
  - `phone` (text, contact phone)
  - `shift` (text, human-readable shift label e.g. "08:00 as 18:00")
  - `start_time` (text, shift start HH:MM)
  - `end_time` (text, shift end HH:MM)
  - `demandas` (text, registered demands/notes)
  - `situacao` (text, current situation/follow-up)
  - `manual_status` (text, manually overridden status or null for auto)
  - `created_at` (timestamptz)
2. Security
- Enable RLS on `employees`.
- Grant CRUD to `anon` + `authenticated` (single-tenant, intentionally shared data).
- Allow anon + authenticated full CRUD.
3. Seed
- Inserts 30 collaborators across four shifts (06-16, 08-18, 13-23, 22-07).
*/

CREATE TABLE IF NOT EXISTS employees (
  id integer PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  shift text NOT NULL DEFAULT '',
  start_time text NOT NULL DEFAULT '',
  end_time text NOT NULL DEFAULT '',
  demandas text DEFAULT '',
  situacao text DEFAULT '',
  manual_status text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON employees TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_employees" ON employees;
CREATE POLICY "anon_select_employees" ON employees FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_employees" ON employees;
CREATE POLICY "anon_insert_employees" ON employees FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_employees" ON employees;
CREATE POLICY "anon_update_employees" ON employees FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_employees" ON employees;
CREATE POLICY "anon_delete_employees" ON employees FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO employees (id, name, phone, shift, start_time, end_time) VALUES
(1, 'GUSTAVO PEREIRA DA SILVA', '31 98684 8120', '06:00 as 16:00', '06:00', '16:00'),
(2, 'ADENILTON MORAES MENDES', '31 986618479', '08:00 as 18:00', '08:00', '18:00'),
(3, 'BRUNO DE SOUZA MACHADO', '31 98643 0167', '08:00 as 18:00', '08:00', '18:00'),
(4, 'CAIO DEL RIO COSTA', '31 99628 4353', '08:00 as 18:00', '08:00', '18:00'),
(5, 'CARLOS ANTONIO DA COSTA FERREIRA', '31 9654194 87', '08:00 as 18:00', '08:00', '18:00'),
(6, 'IVANILDO MARTINS DA SILVA', '31 986449719', '08:00 as 18:00', '08:00', '18:00'),
(7, 'LUCAS HENRIQUE DE SANTANA E SILVA', '(31)98643-0270', '08:00 as 18:00', '08:00', '18:00'),
(8, 'ROBSON PEREIRA WENCESLAU', '31 98527 4661', '08:00 as 18:00', '08:00', '18:00'),
(9, 'VITOR CESAR MACIEL', '31 97598 0052', '08:00 as 18:00', '08:00', '18:00'),
(10, 'ALEXANDRE FREDERICK FORTUNATO ABREU', '31987661897', '13:00 as 23:00', '13:00', '23:00'),
(11, 'ANDERSON HERMOGENES RODRIGUES', '31988979687', '13:00 as 23:00', '13:00', '23:00'),
(12, 'ANTONIO DE PAULO REIS', '31 97337 0338', '13:00 as 23:00', '13:00', '23:00'),
(13, 'BRUNO DAVIDSON RAMALHO', '31 98511 0619', '13:00 as 23:00', '13:00', '23:00'),
(14, 'CRISLEY ROBERT SOUZA COELHO', '31994005157', '13:00 as 23:00', '13:00', '23:00'),
(15, 'DALBERT DA SILVA MACHADO', '31972083047', '13:00 as 23:00', '13:00', '23:00'),
(16, 'DANIEL CALADO RAMALHO', '31 9 88482784', '13:00 as 23:00', '13:00', '23:00'),
(17, 'FREDERICO NASCIMENTO DE SOUZA', '68992528580', '13:00 as 23:00', '13:00', '23:00'),
(18, 'JAIR PEREIRA DIAS DO PRADO', '31992790215', '13:00 as 23:00', '13:00', '23:00'),
(19, 'JOSE MAURILIO DE OLIVEIRA', '31 986771926', '13:00 as 23:00', '13:00', '23:00'),
(20, 'LUIS FERNADO DOS SANTOS', '31989171309', '13:00 as 23:00', '13:00', '23:00'),
(21, 'MARCOS TULIO GOMES CIEL', '31 99230 1280', '13:00 as 23:00', '13:00', '23:00'),
(22, 'ALEXANDRE ROBERTO LOPES', '21 98627-2298', '22:00 as 07:00', '22:00', '07:00'),
(23, 'ALEX RIBEIRO DE SOUSA', '31 9 9364 0198', '22:00 as 07:00', '22:00', '07:00'),
(24, 'GRECIO PATRICK MOREIRA SILVA', '31 97180-1226', '22:00 as 07:00', '22:00', '07:00'),
(25, 'GUILHERME HENRIQUE', '31 983914035', '22:00 as 07:00', '22:00', '07:00'),
(26, 'LEANDRO DOS SANTOS DE ANDRADE', '31 98677 1927', '22:00 as 07:00', '22:00', '07:00'),
(27, 'LUCAS GABRIEL FERREIRA DOS SANTOS COSTA', '31 9 8785 2921', '22:00 as 07:00', '22:00', '07:00'),
(28, 'LUCAS DA COSTA SILVA', '31 97137 2616', '22:00 as 07:00', '22:00', '07:00'),
(29, 'MARCOS PAULO CEZAR', '31 99671 8993', '22:00 as 07:00', '22:00', '07:00'),
(30, 'PAULO ROBERTO LOPES', '31 98659 0883', '22:00 as 07:00', '22:00', '07:00')
ON CONFLICT (id) DO NOTHING;
