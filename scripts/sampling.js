const { fetch, db } = require('../db')
const cliProgress = require('cli-progress')
const extra = require('fs-extra')
const path = require('path')
const { fetchInstance } = require('./fetchInstance')
const { sampleLinksFromRepository } = require('./sampleLinksFromRepository')
db.on('open', main)

/** Helper function for starting an iterative process */
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
    /* Getting count of links by repository */
    const repoIds = await fetch(`
    
    SELECT DISTINCT repo_id 
    FROM github_jira_link 
    
    `, d => d.repo_id)
        
    const ids = []
    const samples = 350
    
    await process("Collecting instances ids", repoIds.length, async update => {
        for (const repoId of repoIds) {        
            const linkIds = await sampleLinksFromRepository(repoId, samples)
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