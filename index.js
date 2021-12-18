const express = require('express')

const PORT = process.env.PORT || 8080

const app = express()

app.use(express.static('public'))

app.get('/data', (req, res) => {
    res.send([])
  })

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
})