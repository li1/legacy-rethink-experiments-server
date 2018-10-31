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

let connection
r.connect({ host: 'localhost', port: 28015 }, (err, conn) => {
  if (err) throw err
  connection = conn

  r.table('people')
    .delete()
    .run(connection, (error, result) => {
      if (error) throw error
      console.log(result)
    })

  let i = 0
  setInterval(() => {
    i++
    r.table('people')
      .insert({ name: 'Person' + i, age: i, distance: i * 10 })
      .run(connection, (error, result) => { if (error) throw error })
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

  r.table('people').changes({ includeInitial: true, squash: true }).run(connection, (error, cursor) => {
    if (error) throw error

    cursor.each((error2, result) => {
      if (error2) throw error2
      socket.emit('people', result)
    })
  })
})
