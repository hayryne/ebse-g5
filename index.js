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

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
})