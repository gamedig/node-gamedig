import * as http from 'node:http'

export const makeServer = ({ method, url, response }) => {
  const server = http.createServer((req, res) => {
    if (req.method === method && req.url === `/${url}`) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(response)
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    }
  })

  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const port = server.address().port
      const close = () => new Promise((resolveClose, rejectClose) => {
        server.close((err) => {
          if (err) return rejectClose(err)
          resolveClose()
        })
      })
      resolve([port, close])
    })

    server.on('error', (err) => {
      console.error(err)
      reject(err)
    })
  })
}
