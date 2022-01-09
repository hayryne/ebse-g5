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

    const [comments, commits] = await Promise.all([
        fetch(`SELECT * from git_comment WHERE sha = "${entry.sha}"`),
        fetch(`SELECT * from git_commit WHERE sha = "${entry.sha}"`)
    ])

    res.send({ entry, comments, commits })
})

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
})