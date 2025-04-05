from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('auth', '__latest__'),
        ('socials', '__latest__'),
        ('posts', '__latest__'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                # Socials relationship sender
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'socials_relationship_sender_id_767cec65_fk_auth_user_id'
                    ) THEN
                        ALTER TABLE socials_relationship
                        DROP CONSTRAINT socials_relationship_sender_id_767cec65_fk_auth_user_id;
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'socials_relationship_sender_id_fk'
                    ) THEN
                        ALTER TABLE socials_relationship
                        ADD CONSTRAINT socials_relationship_sender_id_fk
                        FOREIGN KEY (sender_id) REFERENCES auth_user(id) ON DELETE CASCADE;
                    END IF;
                END $$;
                """,

                # Socials relationship receiver
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'socials_relationship_receiver_id_d3497491_fk_auth_user_id'
                    ) THEN
                        ALTER TABLE socials_relationship
                        DROP CONSTRAINT socials_relationship_receiver_id_d3497491_fk_auth_user_id;
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'socials_relationship_receiver_id_fk'
                    ) THEN
                        ALTER TABLE socials_relationship
                        ADD CONSTRAINT socials_relationship_receiver_id_fk
                        FOREIGN KEY (receiver_id) REFERENCES auth_user(id) ON DELETE CASCADE;
                    END IF;
                END $$;
                """,

                # Posts post author
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'posts_post_author_id_3d5d43e1_fk_auth_user_id'
                    ) THEN
                        ALTER TABLE posts_post
                        DROP CONSTRAINT posts_post_author_id_3d5d43e1_fk_auth_user_id;
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'posts_post_author_id_fk'
                    ) THEN
                        ALTER TABLE posts_post
                        ADD CONSTRAINT posts_post_author_id_fk
                        FOREIGN KEY (author_id) REFERENCES auth_user(id) ON DELETE CASCADE;
                    END IF;
                END $$;
                """,

                # Posts reaction user
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'posts_reaction_user_id_286f6cba_fk_auth_user_id'
                    ) THEN
                        ALTER TABLE posts_reaction
                        DROP CONSTRAINT posts_reaction_user_id_286f6cba_fk_auth_user_id;
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'posts_reaction_user_id_fk'
                    ) THEN
                        ALTER TABLE posts_reaction
                        ADD CONSTRAINT posts_reaction_user_id_fk
                        FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE;
                    END IF;
                END $$;
                """,

                # Posts reaction post (UPDATED with correct constraint name)
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'posts_reaction_post_id_897f4c69_fk_posts_post_id'
                    ) THEN
                        ALTER TABLE posts_reaction
                        DROP CONSTRAINT posts_reaction_post_id_897f4c69_fk_posts_post_id;
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'posts_reaction_post_id_fk'
                    ) THEN
                        ALTER TABLE posts_reaction
                        ADD CONSTRAINT posts_reaction_post_id_fk
                        FOREIGN KEY (post_id) REFERENCES posts_post(id) ON DELETE CASCADE;
                    END IF;
                END $$;
                """
            ],
            reverse_sql=[
                # Optional reversal SQL if needed
            ]
        )
    ]
