'use strict'

import express from 'express'
import cors from 'cors'
import * as bodyParser from 'body-parser'
import * as r from 'rethinkdb'
import * as http from 'http'
import socketio from 'socket.io'

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const server = http.Server(app)

const io = socketio(server)

server.listen(3001)

let c
r.connect({ host: 'localhost', port: 28015 }, (err, conn) => {
  if (err) throw err
  c = conn

  r.table('people').delete().run(c, (e, c) => { console.log(e, c) })
  
  let i = 0
  setInterval(() => {
    i++
    r.table('people').insert({ name: 'Person' + i, age: i, distance: i * 10 }).run(c, (e, c) => {})
  }, 300)
})

// app.get('/', (req, res) => {
//   r.table('people').filter(r.row('age').gt(18)).run(c, (e, c) => {
//     if (e) throw e
//     c.toArray((e, r) => {
//       if (e) throw e
//       res.send(r)
//     })
//   })
// })

io.on('connection', socket => {
  socket.emit('status', { status: 'connection established' })

  r.table('people').changes({ includeInitial: true, squash: true }).run(c, (e, c) => {
    if (e) throw e

    c.each((e, r) => {
      if (e) throw e
      socket.emit('people', r)
    })
  })
})
