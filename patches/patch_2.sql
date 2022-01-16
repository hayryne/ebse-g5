ALTER TABLE github_jira_link
ADD satd_count INTEGER

UPDATE github_jira_link
SET satd_count = 
    (exists (
        select 1 from git_commit
        join git_commit_satd on git_commit_satd.sha = git_commit.sha
        where git_commit.sha = github_jira_link.sha
                and git_commit_satd.label_id != 0
        limit 1
    ))
    + (exists (
        select 1 from git_comment_satd
        where git_comment_satd.sha = github_jira_link.sha
                and git_comment_satd.repo_id = github_jira_link.repo_id
                and git_comment_satd.label_id != 0
        limit 1
    ))
    + (exists (
        select 1 from github_issue
        join github_issue_satd on (
            github_issue_satd.number = github_issue.number and
            github_issue_satd.repo_id = github_issue.repo_id
        )
        where github_issue.number = github_jira_link.issue_number and
                github_issue.repo_id = github_jira_link.repo_id
                and github_issue_satd.label_id != 0
        limit 1
    ))
    + (exists (
        select 1 from github_issue_comment
        join github_issue_satd on (
            github_issue_satd.number = github_issue_comment.number and
            github_issue_satd.repo_id = github_issue_comment.repo_id and
            github_issue_satd.id = github_issue_comment.id
        )
        where github_issue_comment.number = github_jira_link.issue_number and
                github_issue_comment.repo_id = github_jira_link.repo_id
                and github_issue_satd.label_id != 0
        limit 1
    ))
    + (exists (
        select 1 from github_pull
        join github_pull_satd on (
            github_pull_satd.number = github_pull.number and
            github_pull_satd.repo_id = github_pull.repo_id
        )
        where github_pull.number = github_jira_link.pull_number and
        github_pull.repo_id = github_jira_link.repo_id
                and github_pull_satd.label_id != 0
        limit 1
    ))
    + (exists (
        select 1 from github_pull_comment
        join github_pull_satd on (
            github_pull_satd.number = github_pull_comment.number and
            github_pull_satd.repo_id = github_pull_comment.repo_id and
            github_pull_satd.id = github_pull_comment.id
        )
        where github_pull_comment.number = github_jira_link.pull_number and
        github_pull_comment.repo_id = github_jira_link.repo_id
                and github_pull_satd.label_id != 0
        limit 1
    ))
    + (exists (
        select 1 from github_pull_review
        join github_pull_satd on (
            github_pull_satd.number = github_pull_review.number and
            github_pull_satd.repo_id = github_pull_review.repo_id and
            github_pull_satd.id = github_pull_review.id
        )
        where github_pull_review.number = github_jira_link.pull_number and
        github_pull_review.repo_id = github_jira_link.repo_id
                and github_pull_satd.label_id != 0
        limit 1
    ))
    + (exists (
        select 1 from jira_issue
        join jira_issue_satd on (
            jira_issue_satd.number = jira_issue.number and
            jira_issue_satd.identifier = jira_issue.identifier
        )
        where jira_issue.identifier = github_jira_link.jira_identifier and
                jira_issue.number = github_jira_link.jira_number
                and jira_issue_satd.label_id != 0
        limit 1
    ))
    + (exists (
        select 1 from jira_issue_comment
        join jira_issue_satd on (
            jira_issue_satd.number = jira_issue_comment.number and
            jira_issue_satd.identifier = jira_issue_comment.identifier
            and jira_issue_satd.id = jira_issue_comment.id
        )
        where jira_issue_comment.identifier = github_jira_link.jira_identifier and
                jira_issue_comment.number = github_jira_link.jira_number
                and jira_issue_satd.label_id != 0
        limit 1
    ))