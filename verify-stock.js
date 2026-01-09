async function verify() {
    try {
        const res = await fetch('http://localhost:3000/reports/summary');
        const data = await res.json();
        console.log('Summary:', data);
    } catch (e) {
        console.error(e);
    }
}
verify();
