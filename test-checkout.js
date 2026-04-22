const testPayment = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/checkout/preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [
                   { id: 'some-fake-id', price: 80, title: 'Test Product' }
                ],
                buyerInfo: {
                    name: 'Tester',
                    email: 'tester@example.com',
                    buyer_phone: '999111222',
                    address: ''
                }
            })
        });
        const data = await response.json();
        console.log(response.status, data);
    } catch (e) {
        console.error(e);
    }
}
testPayment();
