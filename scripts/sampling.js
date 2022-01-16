const { fetch, db } = require('../db')
const cliProgress = require('cli-progress')
const extra = require('fs-extra')
const path = require('path')
const { fetchInstance } = require('./fetchInstance')
const { sampleLinksFromRepository } = require('./sampleLinksFromRepository')
db.on('open', main)


async function process(message, iterations, callback) {
    console.log(message)

    const bar = new cliProgress.SingleBar()
    let i = 1
    bar.start(iterations)

    const update = () => bar.update(i++)

    await callback(update)

    bar.stop()
}

async function main() {
    const countMap = new Map()

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
    const sampleGoal = 500
    const ids = []
    
    await process("Collecting instances ids", countMap.size, async update => {

        
        for (const repoId of countMap.keys()) {
            const count = countMap.get(repoId)            
            const linkIds = await sampleLinksFromRepository(repoId, sampleGoal * (count / totalCount))
            ids.push(...linkIds)
            update()
        }

    })

    const finalData = []

    await process("Collecting instances", ids.length, async update => {
        for (const id of ids) {
            const instance = await fetchInstance(id)
            finalData.push(instance)
            update()
        }
    })

    /* Saving data */
    console.log('Saving data');
    await extra.outputFile(path.join(__dirname, '../saved_data/sampling_2.json'), JSON.stringify(finalData))
    console.log('Done')
}