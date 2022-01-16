const { fetch, db } = require('../db')
const cliProgress = require('cli-progress')
const extra = require('fs-extra')

db.on('open', main)

async function main() {
    const countMap = new Map()

    console.log();
    /* Getting count of links by repository */
    const repoCount = await fetch(`
    
    SELECT count(*) as num, repo_id 
    FROM github_jira_link 
    WHERE satd_count > 2 
    GROUP BY repo_id
    
    `)

    for (const { num, repo_id } of repoCount)
        countMap.set(repo_id, num)

        
    const totalCount = Array.from(countMap.values()).reduce((a, b) => a + b, 0)
    console.log('Total link count:', totalCount);
        
    const sampleGoal = 500
    const ids = []
    
    console.log('Collecting repositories link ids')
    
    let i = 1
    let bar = new cliProgress.SingleBar()
    bar.start(countMap.size, 0)

    /* Getting ids of github_jira_link that are good */
    for (const repoId of countMap.keys()) {
        const count = countMap.get(repoId)
        const repoIds = await fetch(`
    
    SELECT id FROM (
        SELECT 
            *, 
            row_number() 
                OVER (
                    PARTITION BY linked 
                    ORDER BY random()
                ) as seqnum 
    
        FROM github_jira_link
        WHERE  
            repo_id = ${repoId} AND
            satd_count > 2
    )
    
    WHERE 
        linked = 0 AND seqnum <= ${0.59 * sampleGoal * (count / totalCount)} OR
        linked = 1 AND seqnum <= ${0.39 * sampleGoal * (count / totalCount)} OR
        linked = 2 AND seqnum <= ${0.02 * sampleGoal * (count / totalCount)} OR
        linked = 3 AND seqnum <= ${0.0002 * sampleGoal * (count / totalCount)}

        `, d => d.id)

        ids.push(...repoIds)

        bar.update(i++)
    }

    bar.stop()


    console.log(`Got ${ids.length} results`);

    const final_data = []
    
    i = 1
    bar = new cliProgress.SingleBar();
    bar.start(ids.length, 0)

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

    bar.stop()

    /* Saving data */
    extra.outputFile(path.join(__dirname, '../saved_data/sampling_2.json'), JSON.stringify(final_data))
        .catch(console.error)
}