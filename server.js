'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');
const assert = require('assert');
const process = require('process');
const MONGODB_URI=process.env.MONGODB_URI

const PORT = process.env.PORT || 5000;
const INDEX = path.join(__dirname, 'index.html');
const app = express()
const server = app
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });
const CLIENTS=new Map();

const MongoClient = require('mongodb').MongoClient

MongoClient.connect(MONGODB_URI, function (err, db) {
  if (err) throw err

  db.collection('machines').find().toArray(function (err, result) {
    if (err) throw err

    console.log(result)
  })

  app.get('/activate_machine/:uuid', function (req, res) {
  let ws = CLIENTS.get(req.params.uuid);
  ws.send('test');
  res.send("uuid is set to " + req.params.uuid);
})

wss.on('connection', (ws) => {
  let uuid=''
  console.log('Client connected');
  ws.on('close', () => {
      CLIENTS.delete(uuid);
      console.log('Client disconnected');
      console.log(CLIENTS.size);
    });
  ws.on('message', function incoming(data) {
    let objRecv = JSON.parse(data);
    uuid=objRecv.uuid;
    objRecv._id=objRecv.uuid;
    objRecv.updated_at=Date.now();
    CLIENTS.set(objRecv.uuid,ws);
      db.collection('machines').save(objRecv, function(err, result) {
        assert.equal(err, null);
        //console.log("Inserted a document into the restaurants collection.");
  });
    console.log(CLIENTS.size);
  });
});
})

