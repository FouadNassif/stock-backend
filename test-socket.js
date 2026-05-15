const { io } = require('socket.io-client');

const MEMBER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTA2MTNjMmRlNWMxZDdmNjNkZjA2OTQiLCJlbWFpbCI6ImZvdWdhbWVyeXRAZ21haWwuY29tIiwidHlwZSI6Im1lbWJlciIsImlhdCI6MTc3ODg3MjIxNCwiZXhwIjoxNzc5NDc3MDE0fQ.qGhu90ZX8FbRTRop5Qz1COczOMePYoLWVsuUY0Gt6fI';

const socket = io('http://localhost:3000', {
    transports: ['websocket'],
    auth: {
        token: MEMBER_TOKEN,
    },
});

socket.on('connect', () => {
    console.log('Connected:', socket.id);

    socket.emit('portfolio.join');

    console.log('Requested to join portfolio room');
});

socket.on('portfolio.joined', (payload) => {
    console.log('Joined:', payload);
});

socket.on('portfolio.updated', (payload) => {
    console.log('Portfolio updated event received:');
    console.log(payload);
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message);
});