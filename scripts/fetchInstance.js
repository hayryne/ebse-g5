const { fetch } = require('../db')

async function fetchInstance(id) {  
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

    return {
        git_comments,
        git_commits,

        github_issues,
        github_issues_comments,

        github_pulls,
        github_pulls_comments,
        github_pulls_reviews,

        jira_issues,
        jira_issues_comments
    }
}

exports.fetchInstance = fetchInstance