const express = require('express')
const { fetch } = require('./db.js')
const fs = require('fs')
const path = require('path')

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
        `SELECT * from github_jira_link where id in (
            4,67670,71732,71763,91395,91400,91402,91403,91405,4227,4228,4229,4230,4231,4235,4388,4403,4410,4411,4412,4434,4464,4473,4516,4518,4547,4637,4640,78491,78506,78609,78634,155340,158493,158496,164743,164744,164746,164748,164749,164751,227386,204196,204307,204346,204348,204385,204397,107930,108092,108105,108254,108313,108377,108418,108567,292587,292593,297662,297663,303754,303758,309086,309087,309088,309089,321242,321243,321251,321252,321253,321258,321259,343690,343699,343702,343721,343773,134880,134881,134888,134892,134893,134894,223817,183906,183918,183998,184022,184044,184059,244149,244157,244160,244165,244166,244167,244175,244196,244205,244208,244214,366937,366943,366944,366945,366946,366947,366958,366963,366966,366970,366971,366976,366979,366983,440588,448944,448945,448946,448967,448990,448991,448992,449079,449080,449081,481995,481996,481997,481998,481999,482000,482003,482004,482005,482007,482008,482009,482010,359548,359553,445326,529279,529280,529283,529284,542672,542673,550818,550819,550820,550821,550826,550828,550829,550830,550831,550832,550835,550836,550837,550838,550841,550842,526363,602481,602731,602742,415378,415385,415387,415389,612109,612112,612113,612114,662139,666869,666870,666871,666872,666873,666875,666887,666888,666889,666890,666891,666892,666900,666901,666902,666903,666904,666905,666906,666907,666908,666909,737736,741736,741738,741753,741755,754284,754285,625699,625702,625703,625704,625709,625710,625711,625712,625714,625717,760031,760035,659511,524363,767298,767377,767591,429510,429631,429636,831159,831160,230940,230941,230942,230943,828472,778544,778552,778557,778568,778576,795818,795819,795820,795821,795824,795826,795829,795830,795834,795839,886511,886512,886515,897698,897699,897705,897708,911334,911336,911337,927486,927487,927489,920194,920207,935913,935916,942207,942252,950075,952898,955065,837508,837509,837510,837512,837515,964266,964268,970743,970744,958009,958027,993415,993428,1027819,1027820,1027823,1027834,1027839,1027842,1027843,1027844,1027846,1027847,1027857,1027865,1027869,1027870,1027895,1027898,1027899,1027901,1027902,1027903,999438,999443,999444,999450,999452,999455,999464,999470,999472,978151,978152,978169,978206,978212,1126796,1126798,1126800,1135657,1138537,1138539,1145160,1145164,1145166,1154105,1154106,1159942,1159946,1159950,1159951,1172868,1172869,1178652,1180767,1182467,1184399,1184417,1184425,1184628,1093175,1093176,1093192,1093194,1093200,1093216,1093217,1093218,1093222,1093224,1198836,1201837,1205439,1205548,1205563,1205571,1217746,281530,281531,281532,1232764,1232768,1237863,1228602,1239892,1244785,1243093,853461,853468,853471,853473,853474,853491,853498,853499,853500,853501,1221123,1221130
        )`,
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

app.post('/save', async (req, res) => {

    const { data, filePath } = req.body

    fs.writeFileSync(path.join('saved_data', filePath + '.json'), JSON.stringify(data))

    res.send();
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
})