const { fetch } = require('../db')

async function sampleLinksFromRepository(repoId, n, minSatd=2) {
    const linkIds = await fetch(`
    
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
            satd_count >= ${minSatd}
    )
    
    WHERE 
        linked = 0 AND seqnum <= ${0.59 * n} OR
        linked = 1 AND seqnum <= ${0.39 * n} OR
        linked = 2 AND seqnum <= ${0.02 * n} OR
        linked = 3 AND seqnum <= ${0.0002 * n}

        `, d => d.id)

    return linkIds
}

exports.sampleLinksFromRepository = sampleLinksFromRepository