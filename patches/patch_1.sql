ALTER TABLE github_jira_link
ADD linked INTEGER

UPDATE github_jira_link
SET linked = CASE 
    WHEN jira_number IS NOT NULL AND issue_number IS NULL THEN 1
    WHEN issue_number IS NOT NULL AND jira_number IS NULL THEN 2
    WHEN issue_number IS NOT NULL AND jira_number IS NOT NULL THEN 3
    ELSE 0
END
