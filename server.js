var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = [{
        id: ''
        , up: 'ArrowUp'
        , down: 'ArrowDown'
        , left: 'ArrowLeft'
        , right: 'ArrowRight'
        , ready: false
        , username: 'Player 1'
}
    , {
        id: ''
        , up: 'ArrowUp'
        , down: 'ArrowDown'
        , left: 'ArrowLeft'
        , right: 'ArrowRight'
        , ready: false
        , username: 'Player 2'
    }];
var viewers = [];
var dir = ['ArrowDown', 'ArrowUp'];
var lastDir = ['ArrowDown', 'ArrowUp'];
var nextMove = [{
    left: 0
    , top: 30
}, {
    left: 490
    , top: 460
}]
var isNextMoveValid = [true, true];
var isFruit = [false, false];
var interval = undefined;
var snake = [[{
    left: 0
    , top: 0
}, {
    left: 0
    , top: 10
}, {
    left: 0
    , top: 20
}, {
    left: 0
    , top: 30
}], [{
    left: 490
    , top: 490
}, {
    left: 490
    , top: 480
}, {
    left: 490
    , top: 470
}, {
    left: 490
    , top: 460
}]];
var fruit = undefined;
// On gère les requêtes HTTP des utilisateurs en leur renvoyant les fichiers du dossier 'public'
app.use("/", express.static(__dirname + "/public"));
// On lance le serveur en écoutant les connexions arrivant sur le port 3000
http.listen(3000, function () {
    console.log('Server is listening on *:3000');
});
io.on('connection', function (socket) {
    console.log(socket.id + ' connected');
    var flag = false;
    for (var k = 0; k < 2; k++) {
        if (users[k].id == '') {
            flag = true;
            users[k].id = socket.id;
            break;
        }
    }
    if (!flag) {
        viewers.push(socket.id);
    }
    console.log(users);
    socket.on('disconnect', function () {
        console.log(socket.id + ' disconnected');
        for (var k = 0; k < 2; k++) {
            if (users[k].id == socket.id) {
                users[k].id = '';
                users[k].ready = false;
            }
        }
        console.log(users);
    });
    var newFruit = function () {
        var flag = true;
        while (flag) {
            fruit = {
                left: Math.floor(Math.random() * 49) * 10
                , top: Math.floor(Math.random() * 49) * 10
            };
            for (var k = 0; k < 2; k++) {
                for (var i = 0; i < snake[k].length; i++) {
                    if (snake[k][i] == fruit) {
                        flag = true;
                        break;
                    }
                    else {
                        flag = false;
                    }
                }
            }
        }
        io.sockets.emit('newFruit', {
            data: fruit
        })
    }
    var checkNext = function (lastEl, index) {
        if (lastEl.left == fruit.left && lastEl.top == fruit.top) {
            newFruit();
            io.sockets.emit('lengthAdd', {
                data: [snake[index].length, index]
            })
        }
        else {
            snake[index].splice(0, 1);
        }
        for (var k = 0; k < 2; k++) {
            if (k != index && lastEl.top == snake[k][snake[k].length - 1].top && lastEl.left == snake[k][snake[k].length - 1].left) {
                console.log(users[k].username + ' lost')
                setTimeout(function () {
                    designInit();
                }, 2000)
                io.sockets.emit('lostGame', {
                    data: users[index].username
                })
                clearInterval(interval);
                users[0].ready = false;
                users[1].ready = false;
                break;
            }
            for (var i = 0; i < snake[k].length - 1; i++) {
                if (snake[k][i].top == lastEl.top && snake[k][i].left == lastEl.left) {
                    console.log(users[k].username + ' lost')
                    setTimeout(function () {
                        designInit();
                    }, 2000)
                    io.sockets.emit('lostGame', {
                        data: users[index].username
                    })
                    clearInterval(interval);
                    users[0].ready = false;
                    users[1].ready = false;
                    break;
                }
            }
        }
    }
    var init = function () {
        interval = setInterval(function () {
            for (var k = 0; k < 2; k++) {
                if (dir[k] == users[k].up && lastDir[k] != users[k].down) {
                    lastDir[k] = users[k].up;
                    if (snake[k][snake[k].length - 1].top == 0) {
                        snake[k].push({
                            left: snake[k][snake[k].length - 1].left
                            , top: 490
                        })
                    }
                    else {
                        snake[k].push({
                            left: snake[k][snake[k].length - 1].left
                            , top: snake[k][snake[k].length - 1].top - 10
                        })
                    }
                }
                else if (dir[k] == users[k].down && lastDir[k] != users[k].up) {
                    lastDir[k] = users[k].down;
                    if (snake[k][snake[k].length - 1].top == 490) {
                        snake[k].push({
                            left: snake[k][snake[k].length - 1].left
                            , top: 0
                        })
                    }
                    else {
                        snake[k].push({
                            left: snake[k][snake[k].length - 1].left
                            , top: snake[k][snake[k].length - 1].top + 10
                        })
                    }
                }
                else if (dir[k] == users[k].left && lastDir[k] != users[k].right) {
                    lastDir[k] = users[k].left;
                    if (snake[k][snake[k].length - 1].left == 0) {
                        snake[k].push({
                            left: 490
                            , top: snake[k][snake[k].length - 1].top
                        })
                    }
                    else {
                        snake[k].push({
                            left: snake[k][snake[k].length - 1].left - 10
                            , top: snake[k][snake[k].length - 1].top
                        })
                    }
                }
                else if (dir[k] == users[k].right && lastDir[k] != users[k].left) {
                    lastDir[k] = users[k].right;
                    if (snake[k][snake[k].length - 1].left == 490) {
                        snake[k].push({
                            left: 0
                            , top: snake[k][snake[k].length - 1].top
                        })
                    }
                    else {
                        snake[k].push({
                            left: snake[k][snake[k].length - 1].left + 10
                            , top: snake[k][snake[k].length - 1].top
                        })
                    }
                }
                checkNext(snake[k][snake[k].length - 1], k)
            }
            io.sockets.emit('moveOn', {
                data: snake
            })
        }, 50)
    }
    var designInit = function () {
        console.log('initialisation')
        snake = [[{
            left: 0
            , top: 0
}, {
            left: 0
            , top: 10
}, {
            left: 0
            , top: 20
}, {
            left: 0
            , top: 30
}], [{
            left: 490
            , top: 490
}, {
            left: 490
            , top: 480
}, {
            left: 490
            , top: 470
}, {
            left: 490
            , top: 460
}]];
        dir = ['ArrowDown', 'ArrowUp'];
        lastDir = ['ArrowDown', 'ArrowUp'];
        io.sockets.emit('init', {
            data: snake
        });
        io.sockets.emit('readyUpdate', {
            data: users
        });
        io.sockets.emit('usernameUpdate', {
            data: users
        });
        io.sockets.emit('lengthAdd', {
            data: [snake[0].length, 0]
        });
        io.sockets.emit('lengthAdd', {
            data: [snake[1].length, 1]
        });
        newFruit();
    }
    designInit();
    socket.on('keyPress', function (key) {
        7
        for (var k = 0; k < 2; k++) {
            if (((key == 'ArrowUp' && lastDir[k] != 'ArrowDown') || (key == 'ArrowDown' && lastDir[k] != 'ArrowUp') || (key == 'ArrowLeft' && lastDir[k] != 'ArrowRight') || (key == 'ArrowRight' && lastDir[k] != 'ArrowLeft')) && socket.id == users[k].id) {
                dir[k] = key;
            }
        }
        if (key == 'F5') {
            if (interval) {
                clearInterval(interval);
            }
            designInit();
        }
    })
    socket.on('pageReload', function () {
        if (interval) {
            clearInterval(interval);
        }
        designInit();
    })
    socket.on('ready', function () {
        for (var k = 0; k < 2; k++) {
            if (users[k].id == socket.id) {
                users[k].ready = !users[k].ready;
                break;
            }
        }
        io.sockets.emit('readyUpdate', {
            data: users
        });
        if (users[0].ready && users[1].ready) {
            io.sockets.emit('countDown');
            setTimeout(function () {
                init();
            }, 3000);
        }
    })
    socket.on('usernameChange', function (username) {
        for (var k = 0; k < 2; k++) {
            if (users[k].id == socket.id) {
                users[k].username = username;
                break;
            }
        }
        io.sockets.emit('usernameUpdate', {
            data: users
        });
    })
});