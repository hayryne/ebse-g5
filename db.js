const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database(
    './apache.db',
    sqlite3.OPEN_READWRITE,
    e => {
        if (e) {
            console.error(e.message)
            return
        }

        console.log('Connected to database.');
    }
)

const fetch = () => {
    return new Promise((resolve, reject) => {
        db.all(
            `
                SELECT * from github_jira_link gjl
                LEFT JOIN git_commit gc on (gjl.sha = gc.sha)
                LIMIT 10
            `,
            [],
            (err, rows) => {
                if (err) {
                    throw err;
                }
    
                rows.forEach((row) => {
                  // do some structuring  
                })

                resolve(rows)
          })
        }
    )
}

exports.fetch = fetch