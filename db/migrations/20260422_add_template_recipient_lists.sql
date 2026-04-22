ALTER TABLE mail_templates ADD COLUMN to_list_ids TEXT NOT NULL DEFAULT '[]';
ALTER TABLE mail_templates ADD COLUMN cc_list_ids TEXT NOT NULL DEFAULT '[]';
