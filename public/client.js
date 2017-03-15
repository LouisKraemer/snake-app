var socket = io();
document.addEventListener('keydown', function (e) {
    socket.emit('keyPress', e.key);
})

window.onbeforeunload = function(e) {
    socket.emit('pageReload');
};

document.getElementById('readyButton').addEventListener('click', function() {
    socket.emit('ready');
})

document.getElementById('usernameForm').addEventListener('submit', function(e) {
    e.preventDefault();
    socket.emit('usernameChange', document.getElementById('usernameBox').value);
    document.getElementById('usernameBox').value = '';
    document.getElementById('usernameBox').blur();
})

socket.on('moveOn', function (data) {
    if($('.snake1').length < data.data[0].length) {
        $('#gameArea').append('<div class="snakeEl snake1"></div>');
    }
    $('.snake1').map(function (e) {
        $(this).css('top', data.data[0][e].top);
        $(this).css('left', data.data[0][e].left);
    })
    if($('.snake2').length < data.data[1].length) {
        $('#gameArea').append('<div class="snakeEl snake2"></div>');
    }
    $('.snake2').map(function (e) {
        $(this).css('top', data.data[1][e].top);
        $(this).css('left', data.data[1][e].left);
    })
})

socket.on('newFruit', function (data) {
    $('.fruit').css('top', data.data.top);
    $('.fruit').css('left', data.data.left);
})

socket.on('init', function (data) {
    $('.snake1').map(function (e) {
        if ($(this).attr('class').split(' ')[$(this).attr('class').split(' ').length - 1] != 'base') {
            $(this).remove();
        }
        else {
            $(this).css('top', data.data[0][e].top);
            $(this).css('left', data.data[0][e].left);
        }
    })
    $('.snake2').map(function (e) {
        if ($(this).attr('class').split(' ')[$(this).attr('class').split(' ').length - 1] != 'base') {
            $(this).remove();
        }
        else {
            $(this).css('top', data.data[1][e].top);
            $(this).css('left', data.data[1][e].left);
        }
    })
})

socket.on('readyUpdate', function(data) {
    for(var k = 0; k<2; k++) {
        if(data.data[k].ready){
            $('#player' + (k+1) + ' .readyState').html('Ready');
            $('#player' + (k+1) + ' .readyState').addClass('ready');
            $('#player' + (k+1) + ' .readyState').removeClass('notReady');
        } else {
            $('#player' + (k+1) + ' .readyState').html('Not Ready');
            $('#player' + (k+1) + ' .readyState').addClass('notReady');
            $('#player' + (k+1) + ' .readyState').removeClass('ready');
        }
    }
})

socket.on('usernameUpdate', function(data) {
    for(var k = 0; k<2; k++) {
        $('#player' + (k+1) + ' .playerName').html(data.data[k].username);
    }
})

socket.on('lengthAdd', function(data) {
    $('#player' + (data.data[1] + 1) + ' .playerLength').html(data.data[0])
})

var countDown = function(index) {
    $('.count-' + index).css('visibility', 'visible')
    $('.count-' + index).css('opacity', 0)
}

socket.on('countDown', function() {
   countDown(3);
    setTimeout(function() {
        $('.count-3').css('visibility', 'hidden')
        countDown(2)
    }, 1000)
    setTimeout(function() {
        $('.count-2').css('visibility', 'hidden')
        countDown(1)
    }, 2000)
    setTimeout(function() {
        $('.count-1').css('visibility', 'hidden')
    }, 3000)
})

socket.on('lostGame', function(data) {
    $('.lostGame').html(data.data + ' lost');
    $('.lostGame').css('opacity', 1);
    setTimeout(function() {
        $('.lostGame').css('opacity', 0)
    }, 1500);
})