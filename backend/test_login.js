
async function testLogin(email, password) {
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        console.log(`Login for ${email}:`, response.status, data.success ? 'Success' : 'Failed', data.message);
        if (data.details) console.log('Details:', data.details);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function run() {
    await testLogin('vendor@demo.com', 'admin123');
}

run();
