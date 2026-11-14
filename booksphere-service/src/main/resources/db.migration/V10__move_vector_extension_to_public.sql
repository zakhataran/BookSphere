DO $$
    BEGIN
        IF (SELECT n.nspname
            FROM pg_extension e
                     JOIN pg_namespace n ON n.oid = e.extnamespace
            WHERE e.extname = 'vector') <> 'public' THEN
            ALTER EXTENSION vector SET SCHEMA public;
        END IF;
    END $$;