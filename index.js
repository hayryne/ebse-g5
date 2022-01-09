const express = require('express')
const { fetch } = require('./db.js')

const PORT = process.env.PORT || 8080

const app = express()

app.use(express.static('public'))

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

    console.log('Went in get')

    const data = await fetch(
        `SELECT * from github_jira_link LIMIT 20`,
        data => {
            console.log(data);
            return data.id
        }
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

        fetch(`SELECT comment from git_comment WHERE sha = "${entry.sha}"`),
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

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
})