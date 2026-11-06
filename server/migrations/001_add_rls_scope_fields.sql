BEGIN;

ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS department VARCHAR;

UPDATE contracts AS contract
SET department = department_user.department
FROM users AS department_user
WHERE contract.owner_id = department_user.id
  AND contract.department IS NULL;

ALTER TABLE obligations
    ADD COLUMN IF NOT EXISTS assignee_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_obligations_assignee_id_users'
          AND conrelid = 'obligations'::regclass
    ) THEN
        ALTER TABLE obligations
            ADD CONSTRAINT fk_obligations_assignee_id_users
            FOREIGN KEY (assignee_id) REFERENCES users(id);
    END IF;
END
$$;

COMMIT;
