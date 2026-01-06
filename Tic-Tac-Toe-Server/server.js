// import {createServer} from 'http';
// import {Server} from 'socket.io';

// it is used when we are using common js module system
const { createServer } = require('http');
const { Server } = require('socket.io');


const httpServer = createServer();
const io = new Server(httpServer, {
    // allowing cors for vite dev server
    cors: "http://localhost:5173/"
})


// it publisher or subscriber model or design pattern. it is tell me what to do when some event happen.
io.on('connection', (socket) => {
    console.log('New  user Joined connected:' + socket.id);
})
// maintaining all users data
const allUsers = {};
const allRooms = [];
io.on('connection', (socket) => {

    allUsers[socket.id] = {
        socket: socket,
        online: true,
    };

    // when user request to play
    socket.on("request_to_play", (data) => {
        const currentUser = allUsers[socket.id]
        currentUser.playerName = data.playerName;
        // find opponent player
        let opponentPlayer;

        for (const key in allUsers) {
            const user = allUsers[key];
            if (user.online && !user.playing && socket.id !== key) {
                opponentPlayer = user;
                break;
            }
        }
        console.log(opponentPlayer);
        // log opponent found or not
        if (opponentPlayer) {
            allRooms.push({
                player1: opponentPlayer,
                player2: currentUser
            });

            currentUser.socket.emit('OpponentFound', {
                opponentName: opponentPlayer.playerName,
                playingAs: "circle"
            });
            opponentPlayer.socket.emit('OpponentFound', {
                opponentName: currentUser.playerName,
                playingAs: "cross"
            });

            currentUser.socket.on("playerMoveFromClient", (data) => {
                opponentPlayer.socket.emit("playerMoveFromServer", {
                    ...data
                });
            });
            opponentPlayer.socket.on("playerMoveFromClient", (data) => {
                currentUser.socket.emit("playerMoveFromServer", {
                    ...data
                });
            });
        }
        else {
            currentUser.socket.emit("Opponent not found");
        }
    });

    // when user disconnect from server
    socket.on("disconnect", function () {

        const currentUser = allUsers[socket.id];
        currentUser.online = false;
        currentUser.playing = false;

        // notify opponent that current user has left the match

        for (let i = 0; i < allRooms.length; i++) {
            const { player1, player2 } = allRooms[i];

            if (player1.socket.id === socket.id) {
                player2.socket.emit("opponentLeftMatch");
                break;
            }
            if (player2.socket.id === socket.id) {
                player1.socket.emit("opponentLeftMatch");
                break;
            }

        }
    });
});

// publisher -> action -> action perform karne ke liye on() method use karte hai
// listner -> reaction -> reaction perform karne ke liye emit() method use karte hai

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});