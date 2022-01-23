const { fetch } = require('../db')

async function fetchInstance(id) {
    const entry = (await fetch(`SELECT * from github_jira_link WHERE id = ${id}`))[0]

    const labels = {
        1: "code-design",
        2: "documentation",
        3: "test",
        4: "requirement"
    }

    const mapper = (data) => {
        if (!data.label_id) {
            delete data.label_id
            const keys = Object.keys(data)
            if (keys.length == 1)
                return data[keys[0]]
            return data
        }

        const label = labels[data.label_id]
        delete data.label_id
        return { ...data, label: label }
    }

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

        fetch(`
            SELECT git_comment.comment, git_comment_satd.label_id 
            FROM git_comment 
            LEFT JOIN git_comment_satd 
            ON git_comment.id = git_comment_satd.id 
            WHERE git_comment.sha = "${entry.sha}" AND git_comment.repo_id = ${entry.repo_id}
        `, mapper),

        fetch(`
            SELECT git_commit.summary, git_commit.message, git_commit_satd.label_id 
            FROM git_commit 
            LEFT JOIN git_commit_satd 
            ON git_commit.sha = git_commit_satd.sha 
            WHERE git_commit.sha = "${entry.sha}" AND git_commit.repo_id = ${entry.repo_id}
        `, mapper),

        // // Prevent from doing any computation if no issue
        entry.issue_number === null ? null :
            fetch(`
                SELECT github_issue.title, github_issue.body, github_issue_satd.label_id 
                FROM github_issue
                LEFT JOIN github_issue_satd
                ON github_issue_satd.number = github_issue.number
                AND github_issue_satd.repo_id = github_issue.repo_id
                WHERE github_issue.number = ${entry.issue_number} AND github_issue.repo_id = ${entry.repo_id}
            `, mapper),

        entry.issue_number === null ? null :
            fetch(`
                SELECT github_issue_comment.body, github_issue_satd.label_id 
                FROM github_issue_comment
                LEFT JOIN github_issue_satd
                ON github_issue_satd.number = github_issue_comment.number AND
                github_issue_satd.repo_id = github_issue_comment.repo_id AND
                github_issue_satd.id = github_issue_comment.id
                WHERE github_issue_comment.number = ${entry.issue_number} AND github_issue_comment.repo_id = ${entry.repo_id}
            `, mapper),

        fetch(`
            SELECT github_pull.title, github_pull.body, github_pull_satd.label_id
            FROM github_pull
            LEFT JOIN github_pull_satd
            ON github_pull.number =  github_pull_satd.number AND
            github_pull.repo_id = github_pull_satd.repo_id AND
            github_pull_satd.type = "description"
            WHERE github_pull.number = ${entry.pull_number} AND github_pull.repo_id = ${entry.repo_id}
        `, mapper),

        fetch(`
            SELECT github_pull_comment.body, github_pull_satd.label_id
            FROM github_pull_comment
            LEFT JOIN github_pull_satd
            ON github_pull_comment.id = github_pull_satd.id
            AND github_pull_comment.number = github_pull_satd.number
            AND github_pull_comment.repo_id = github_pull_satd.repo_id
            WHERE github_pull_comment.number = ${entry.pull_number} AND github_pull_comment.repo_id = ${entry.repo_id}
        `, mapper),

        fetch(`
            SELECT github_pull_review.body, github_pull_satd.label_id 
            FROM github_pull_review
            LEFT JOIN github_pull_satd
            ON github_pull_review.id = github_pull_satd.id
            AND github_pull_review.number = github_pull_satd.number
            AND github_pull_review.repo_id = github_pull_satd.repo_id
            AND github_pull_satd.type = "review"
            WHERE github_pull_review.number = ${entry.pull_number} AND github_pull_review.repo_id = ${entry.repo_id}
        `, mapper),  

        fetch(`
            SELECT jira_issue.summary, jira_issue.description, jira_issue_satd.label_id 
            FROM jira_issue
            LEFT JOIN jira_issue_satd
            ON jira_issue.number = jira_issue_satd.number
            AND jira_issue.identifier = jira_issue_satd.identifier
            AND jira_issue.id = jira_issue_satd.id
            WHERE jira_issue.number = ${entry.jira_number} AND jira_issue.identifier = "${entry.jira_identifier}"
        `, mapper),

        fetch(`
            SELECT jira_issue_comment.body, jira_issue_satd.label_id
            FROM jira_issue_comment
            LEFT JOIN jira_issue_satd
            ON jira_issue_comment.id = jira_issue_satd.id
            AND jira_issue_comment.identifier = jira_issue_satd.identifier
            AND jira_issue_comment.number = jira_issue_satd.number
            WHERE jira_issue_comment.number = ${entry.jira_number} AND jira_issue_comment.identifier = "${entry.jira_identifier}"
        `, mapper)

    ])

    return {
        id,
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