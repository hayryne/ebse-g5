const sqlite3 = require('sqlite3').verbose()

const memory = {
    lastResult: null,
    lastRequest: null
}

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
                    reject({ message: err.message })
                else {
                    const result = mapper ? rows.map(mapper) : rows
                    memory.lastResult = result
                    memory.lastRequest = query
                    resolve(result)
                }
            }
        )
    })
}

exports.fetch = fetch
exports.db = db
exports.memory = memory