const express = require('express');
const app = express();
const http = require('http');
const fs = require('fs')
const server = http.createServer(app);
const io = require("socket.io")(server, {
    allowRequest: (req, callback) => {
        const noOriginHeader = req.headers.origin === undefined;
        callback(null, noOriginHeader);
    }
});

const { MongoClient } = require('mongodb');
const MongoDealer = require("./src/mongo-dealer");
// Connection URL
const url = 'mongodb://root:Fa9nmsaASfifnaAs90cvnASo9ACs@192.168.0.5:27017';
const mongoClient = new MongoClient(url);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/world.html');
});
app.use(express.static('./public'))

io.use(async (socket, next) => {
    if(typeof socket.handshake.headers.token != "undefined"){
        const token = socket.handshake.headers.token;
        socket.token = token
        new Promise(async (resolve, reject) => {
            await mongoClient.connect();
            socket.db = mongoClient.db('worlddraw');
            const collection = socket.db.collection('users');
            socket.token_user = await collection.findOne({token: socket.token});
            if(socket.token_user != null){
                socket.user_auth = 'token';
                resolve()
            }else{
                reject()
            }
        }).then(()=>{
            next();
        }).catch(()=>{
            socket.user_auth = 'guest';
            next();
        })
    }else{
        socket.user_auth = 'guest';
        next();
    }
});



io.on('connection', async (socket) => {
    await mongoClient.connect();
    const db = mongoClient.db('worlddraw');
    let listeners = fs.readdirSync('./src/socket-listeners')

    console.log(socket.user_auth)

    for (let i = 0; i < listeners.length; i++){
        require('./src/socket-listeners/'+listeners[i])(socket, db)
    }
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});

