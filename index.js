const express = require('express')
const { fetch } = require('./db.js')

const PORT = process.env.PORT || 8080

const app = express()

app.use(express.static('public'))
app.use(express.json());

app.get('/repositories', async (req, res) => {
    const data = await fetch(
        'SELECT DISTINCT repo_ID AS repoId FROM github_jira_link',
        row => row.repoId
    )

    res.send(data)
})

app.get('/commits/:repoId', async (req, res) => {
    const repoId = req.params.repoId

    const data = await fetch(
        `SELECT sha, summary, message FROM git_commit WHERE repo_id = ${repoId}`,
    )

    res.send(data)
})

app.get('/entries', async (req, res) => {

    const data = await fetch(
        `SELECT * from github_jira_link LIMIT 20`,
        data => data.id
    )

    res.send(data)
})

app.get('/entry/:entryId', async (req, res) => {

    const entryId = req.params.entryId

    const entry = (await fetch(`SELECT * from github_jira_link WHERE id = ${entryId}`))[0]

    const [

        git_comments,
        git_commits,

        github_issues,
        github_issues_comments,

        github_pulls,
        github_pulls_comments,
        github_pulls_reviews,

        jira_issues,
        jira_issues_comments

    ] = await Promise.all([

        fetch(`SELECT comment from git_comment WHERE sha = "${entry.sha}"`, d => d.comment),
        fetch(`SELECT summary, message from git_commit WHERE sha = "${entry.sha}"`),

        // Prevent from doing any computation if no issue
        entry.issue_number === null ? null :
            fetch(`SELECT * FROM github_issue WHERE number = ${entry.issue_number} AND repo_id = ${entry.repo_id}`),
        entry.issue_number === null ? null :
            fetch(`SELECT * FROM github_issue_comment WHERE number = ${entry.issue_number} AND repo_id = ${entry.repo_id}`),

        fetch(`SELECT title, body FROM github_pull WHERE number = ${entry.pull_number} AND repo_id = ${entry.repo_id}`),
        fetch(`SELECT body FROM github_pull_comment WHERE number = ${entry.pull_number} AND repo_id = ${entry.repo_id}`, d => d.body),
        fetch(`SELECT body FROM github_pull_review WHERE number = ${entry.pull_number} AND repo_id = ${entry.repo_id}`, d => d.body),

        fetch(`SELECT summary, description FROM jira_issue WHERE number = ${entry.jira_number} AND identifier = "${entry.jira_identifier}"`),
        fetch(`SELECT body FROM jira_issue_comment WHERE number = ${entry.jira_number} AND identifier = "${entry.jira_identifier}"`, d => d.body)

    ])

    res.send({
        git_comments,
        git_commits,
        github_issues,
        github_issues_comments,
        github_pulls,
        github_pulls_comments,
        github_pulls_reviews,
        jira_issues,
        jira_issues_comments
    })
})

app.post('/request', async (req, res) => {

    const request = req.body.request
    fetch(request)
        .then(data => res.send(data))
        .catch(err => res.send(err))
})

app.get('/tables', async (req, res) => {
    const tablenames = await fetch(`select name from sqlite_master where type='table'`, d => d.name)

    const result = {}
    for (const tablename of tablenames)
        result[tablename] = await fetch(`PRAGMA table_info(${tablename});`, d => d.name)

    res.send(result)
})

app.get('/dataset', async (req, res) => {
    const repoCountQuery = `
        select repo_id,
               round(380 * (1.0 * count(id) / (select count(id) from github_jira_link))) as number
        from github_jira_link
        group by repo_id
    `

    const repoCountsResult = await fetch(repoCountQuery)
    const repoCounts = {}

    repoCountsResult.forEach(({ repo_id, number }) => repoCounts[repo_id] = number)
    console.log(repoCounts)

    let result = []

    const ps = Object.keys(repoCounts).map(repoId => {
        return new Promise((resolve, reject) => {
            const query = `
            select id from github_jira_link
            where repo_id = '${repoId}'
            and ((exists (
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
            ))) > 1
            limit ${repoCounts[repoId]}
        `

            fetch(query, res => res.id).then(repoRes => {
                result = result.concat(repoRes)

                resolve()
            })
        })
    })

    Promise.all(ps).then(() => res.send(result))

})

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
})