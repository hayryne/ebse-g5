const { fetch, db } = require('./db.js')

db.on('open', async () => {

    console.log('fetching');

    const t0 = Date.now()

    const result = await fetch(`
    
select id from github_jira_link

where 

exists (
    select 1 from git_commit_satd
    where 
        git_commit_satd.sha = github_jira_link.sha and
        git_commit_satd.repo_id = github_jira_link.repo_id and
        git_commit_satd.label_id != 0
    limit 1
) and

exists (
    select 1 from git_comment_satd
    where
        git_comment_satd.sha = github_jira_link.sha and
        git_comment_satd.repo_id = github_jira_link.repo_id and
        git_comment_satd.label_id != 0
    limit 1
) and 

exists (
    select 1 from jira_issue_satd
    where
        jira_issue_satd.number = github_jira_link.jira_number and
        jira_issue_satd.identifier = github_jira_link.jira_identifier and
        jira_issue_satd.label_id != 0
    limit 1
) and

exists (
    select 1 from jira_issue_comment
    where
        jira_issue_comment.number = github_jira_link.jira_number and
        jira_issue_comment.identifier = github_jira_link.jira_identifier
    limit 1
)

limit 20

    `);

    const t1 = Date.now()

    console.log('got result', result);
    console.log('took', (t1 - t0) / 1000);

})


const initial = `
select id from github_jira_link

where exists (
    select 1 from git_commit
    join git_commit_satd on git_commit_satd.sha = git_commit.sha
    where git_commit.sha = github_jira_link.sha
            and git_commit_satd.label_id != 0
    limit 1
)

where exists (
    select * from (select * from git_comment where git_comment.sha = github_jira_link.sha
        and git_comment.repo_id = github_jira_link.repo_id 
        and (select 1 from git_comment_satd where
            git_comment_satd.id = git_comment.id and git_comment_satd.label_id != 0
            limit 1
        )
        limit 1) as gc
    limit 1
)

and exists (
    select 1 from jira_issue
    join jira_issue_satd on (
        jira_issue_satd.number = jira_issue.number and
        jira_issue_satd.identifier = jira_issue.identifier
    )
    where jira_issue.identifier = github_jira_link.jira_identifier and
            jira_issue.number = github_jira_link.jira_number
            and jira_issue_satd.label_id != 0
    limit 1
)

and exists (
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
)

limit 1
`