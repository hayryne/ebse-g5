const { fetch, db } = require('../db')
const cliProgress = require('cli-progress')
const extra = require('fs-extra')
const path = require('path')
const { fetchInstance } = require('./fetchInstance')
const { sampleLinksFromRepository } = require('./sampleLinksFromRepository')
const { is } = require('express/lib/request')
db.on('open', main)


async function main() {
    const repoIdList = []

    /* Query for all repo ids in db */
    const repoIds = await fetch(`
    
    SELECT repo_id 
    FROM github_jira_link 
    GROUP BY repo_id
    
    `)

    /* Extract ids from query to js array */
    for (const { repo_id } of repoIds)
        repoIdList.push(repo_id)

    console.log(repoIdList)

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
    const sampleGoals = {
        1 : 294,
        2 : 12,
        3 : 1,
        0 : 77
    }
    const ids = []

    /* Perform the actual sampling */
    for (const repoId of repoIdList) {
        /* Iterate over each type of link */
        for (const linked of Object.keys(sampleGoals)) {
            const linkIdList = []  
            const linkIds = await fetch(`
    
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
            )
            
            `)

                /* Extract ids from query to js array */
            for (const { id } of linkIds)
                linkIdList.push(id)

            console.log("Sampling links from repo_id = " + repoId + " && linked = " + linked + " - " + linkIdList)

            ids.push(...linkIdList)
        }
    }

    console.log("Total links sampled: " + ids.length)

    const finalData = []
    for (const id of ids) {
        const instance = await fetchInstance(id)
        finalData.push(instance)
    }

    /* Saving data */
    console.log('Saving data');
    await extra.outputFile(path.join(__dirname, '../saved_data/sampling_2.json'), JSON.stringify(finalData))
    console.log('Done')
}