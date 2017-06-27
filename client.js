var socket = require('socket.io-client').connect('http://localhost:3000');

socket.on('connect', function() {
    console.log('connection established');
});

socket.on('data', function(num) {
    console.log(num);
})
