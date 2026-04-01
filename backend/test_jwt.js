
const jwt = require('jsonwebtoken');
const secret = 'test';

try {
    const token = jwt.sign({ id: 1, email: 'test@test.com', role: null }, secret);
    console.log('Token:', token);
} catch (error) {
    console.error('JWT Sign Error:', error.message);
}
