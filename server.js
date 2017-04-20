const PORT = process.env.PORT || 3000;

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Chaque utilisateur se voit définir quatre contrôle haut, bas, droite et gauche. Dans la version en ligne cela n'a pas d'importance car chaque personne  a unclavier mais cela permet d'être modifié pour une version locale
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
// On initialise les directions des deux snakes
var dir = ['ArrowDown', 'ArrowUp'];
var lastDir = ['ArrowDown', 'ArrowUp'];
// On initialise le prochain mouvement effectué par chaque snake
var nextMove = [{
    left: 0
    , top: 30
}, {
    left: 490
    , top: 460
}]
// On initialise l'array permettant de vérifier que le mouvement suivant est valide
var isNextMoveValid = [true, true];
// On initialise l'array vérifiant si la position actuelle est un fruit
var isFruit = [false, false];
// Variable qui nous permettra de stocker le 'setInterval' qui gère le côté dynamique du snkae. Lui donner un nom nous permet de l'arrêter
var interval = undefined;
// On définit l'array contenant les positions intiales de chaque éléments des deux snakes
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
http.listen(PORT, function () {
    console.log('Server is listening on ' + PORT);
});
io.on('connection', function (socket) {
    console.log(socket.id + ' connected');
    // On assigne l'utilisateur connecté à un des deux postes si une place est libre
    var flag = false;
    for (var k = 0; k < 2; k++) {
        if (users[k].id == '') {
            flag = true;
            users[k].id = socket.id;
            break;
        }
    }
    // Si les postes sont complets l'utilisateur sera spectateur
    if (!flag) {
        viewers.push(socket.id);
    }
    console.log(users);
    // Lors de la déconnexion, si l'utilisateur était un joueur, on le retire de la liste des joueurs
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
        // On prend des coordonnées aléatoires et on vérifie que ce ne sont pas des coordonnées d'un des deux snakes, si c'est le cas, on recommence. Quand cela est bon, on place un nouveau fruit
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
    // Cette fonction est appelé à chaque itération et vérifie si la case suivante présente une anomalie.
    var checkNext = function (lastEl, index) {
        if (lastEl.left == fruit.left && lastEl.top == fruit.top) {
            newFruit();
            //Si la case suivante est un fruit, on émet l'événement 'lengthAdd' avec en donnée la longueur du nouveau snake et l'index (1 ou 2) qui correspond au numéro du joueur
            io.sockets.emit('lengthAdd', {
                data: [snake[index].length, index]
            })
        }
        else {
            // Si ce n'est pas un fruit on supprime le premier élément du snake
            snake[index].splice(0, 1);
        }
        for (var k = 0; k < 2; k++) {
            // S'il y a collision, on attend deux secondes avant de réinitialiser le jeu, on affiche la mention 'Le joueur a perdu'. On vérifie d'abord juste pour la tête
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
            // On vérifie ensuite pour le reste du corps (les deux vérifications sont séparés car sinon on vérifie que la tête d'un snake n'est pas superposée à elle même ce qui arrête le jeu directement)
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
    // Cette fonction intialise la partie 
    var init = function () {
        // On crée un setInterval afin de répéter toutes les n ms le même processus
        interval = setInterval(function () {
            // Lorsqu'une touche est pressée (voir plus loin) les arrays dir et lastDir sont actualisés. Si la direction actuelle est haut et que la direction précédente n'est pas bas alors on fait avancer le snake
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
                // Quand chaque coordonnées est mise à jour on effectue les vérifications
                checkNext(snake[k][snake[k].length - 1], k)
            }
            // A la fin on envoie l'événement 'moveOn' avec en données les coordonnées des snakes
            io.sockets.emit('moveOn', {
                data: snake
            })
        }, 50)
    }
    // 'designInit' permet d'initialiser le schema du jeu
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
        for (var k = 0; k < 2; k++) {
            // On vérifie que la touche pressée correspond à une touche de direction (on pourrait faire cette vérification côté client pour soulager le serveur)
            if (((key == 'ArrowUp' && lastDir[k] != 'ArrowDown') || (key == 'ArrowDown' && lastDir[k] != 'ArrowUp') || (key == 'ArrowLeft' && lastDir[k] != 'ArrowRight') || (key == 'ArrowRight' && lastDir[k] != 'ArrowLeft')) && socket.id == users[k].id) {
                dir[k] = key;
            }
        }
        // Si la page est réinitialisée on arrête la partie
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
    // On actualise le statut 'ready' de l'utilisateur
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