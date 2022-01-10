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

const fetch = (query, mapper) => {
    return new Promise((resolve, reject) => {
        db.all(
            query,
            [],
            (err, rows) => {
                if (err) 
                    reject(err)
                else
                    resolve(mapper ? rows.map(mapper) : rows)
            }
        )
    })
}

exports.fetch = fetch