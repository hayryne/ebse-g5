const express = require('express')
const { fetch } = require('./db.js')

const PORT = process.env.PORT || 8080

const app = express()

app.use(express.static('public'))

app.get('/data', async (req, res) => {
    const data = await fetch()

    res.send(data)
})

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
})