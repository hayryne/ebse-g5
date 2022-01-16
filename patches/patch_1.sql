/* Patch for populating `github_jira_link` with linkedness of each link

Currently does not work

More specifically:
- linked = 1 - linked to jira only
- linked = 2 - linked to git issue only
- linked = 3 - linked to both jira and git 
- linked = 0 - not linked to either jira or git
*/

ALTER TABLE github_jira_link
ADD linked INTEGER;

/* Two attempts at updating the table; both are hoiwever unsuccesfull */
UPDATE github_jira_link AS gjl
SET
  linked = 
  (
    SELECT linked FROM 
    (
      SELECT *,
      CASE 
        WHEN jira_number IS NOT NULL AND issue_number IS NULL THEN 1
        WHEN issue_number IS NOT NULL AND jira_number IS NULL THEN 2
        WHEN issue_number IS NOT NULL AND jira_number IS NOT NULL THEN 3
        ELSE 0
      END AS linked
      FROM github_jira_link
    )
    WHERE sha = gjl.sha AND repo_id = gjl.repo_id
  );

UPDATE github_jira_link
SET linked = gjl.linked
FROM (SELECT *,
      CASE 
        WHEN jira_number IS NOT NULL AND issue_number IS NULL THEN 1
        WHEN issue_number IS NOT NULL AND jira_number IS NULL THEN 2
        WHEN issue_number IS NOT NULL AND jira_number IS NOT NULL THEN 3
        ELSE 0
      END AS linked
      FROM github_jira_link
      WHERE id = github_jira_link.id) AS gjl
      )

