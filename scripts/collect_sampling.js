const { fetch, db } = require('../db')
const sampling_data = require("../saved_data/sampling_0.json")
const path = require('path')
const extra = require('fs-extra')
const cliProgress = require('cli-progress');

db.on('open', async () => {
    const ids = sampling_data.result.map(d => d.id)
    const final_data = []

    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    
    bar.start(ids.length, 0)
    
    let i = 1

    for (const id of ids) {
        const entry = (await fetch(`SELECT * from github_jira_link WHERE id = ${id}`))[0]


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

            fetch(`SELECT comment from git_comment WHERE sha = "${entry.sha}" AND repo_id = ${entry.repo_id}`, d => d.comment),
            fetch(`SELECT summary, message from git_commit WHERE sha = "${entry.sha}" AND repo_id = ${entry.repo_id}`),

            // // Prevent from doing any computation if no issue
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

        final_data.push({
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

        bar.update(i++)
    }

    extra.outputFile(path.join(__dirname, '../saved_data/sampling.json'), JSON.stringify(final_data))
        .catch(err => {
            console.error(err);
        }) 
        .finally(() => {
            bar.stop()
        })

    console.log(final_data[0])
})