const { fetch } = require('../db')

/* Nr. of samples for each value of 'linked' */
/* This has been computed for a total sample of 385 with 
/*      stratas = {
            linked = 1, 76%
            linked = 2, 3%,
            linked = 3, 0.05%,
            linked = 0, 20%
        }
    Values have been rounded up to account for at least 1 sample in each case.
*/
const sampleDistributions = {
    1: 0.76,
    2: 0.03,
    3: 0.01,
    0: 0.2
}

async function sampleLinksFromRepository(repoId, samples=380) {

    const sampleGoals = { }
    for (const key of Object.keys(sampleDistributions))
        sampleGoals[key] = Math.ceil(sampleDistributions[key] * samples)

    linkIds = []

    for (const linked of Object.keys(sampleGoals)) {
        const linkedIds = await fetch(`

        SELECT id
        FROM 
        (
            SELECT *,
            row_number() over (partition by linked, repo_id order by random()) as seqnum
            FROM github_jira_link
            WHERE satd_count >= 2 AND repo_id = ${repoId} 
        )
        WHERE linked = ${linked} and seqnum <= round(
            ${sampleGoals[linked]} 
            * 
            (SELECT COUNT(*) FROM github_jira_link WHERE linked = ${linked} AND satd_count >= 2 AND repo_id = ${repoId}) 
            / 
            (SELECT COUNT(*) FROM github_jira_link WHERE linked = ${linked} AND satd_count >= 2) 
        ) + 1
        
        `, d => d.id)

        /* Extract ids from query to js array */
        linkIds.push(...linkedIds)
    }

    return linkIds
}

exports.sampleLinksFromRepository = sampleLinksFromRepository