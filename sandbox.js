const { db, fetch } = require('./db.js')
const fs = require('fs')

db.on('open', async () => {
    const { result } = JSON.parse(fs.readFileSync('saved_data/commits_comments_uncorrelated.json'))
    console.log(result);
    for (const { repo_id, sha } of result) {
        const commit = await fetch(`SELECT * from git_comment WHERE repo_id=${repo_id} AND sha=${sha}`)
        const comment = await fetch(`SELECT * from git_commit WHERE repo_id=${repo_id} AND sha=${sha}`)
        console.log({ commit, comment });
    }
})