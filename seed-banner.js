async function seed() {
    try {
        const response = await fetch('http://localhost:3000/content/banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageUrl: 'https://images.unsplash.com/photo-1610375461490-6d615d985552',
                linkUrl: 'https://eeyagold.com'
            })
        });
        const data = await response.json();
        console.log('Banner seeded:', data);
    } catch (e) {
        console.error(e);
    }
}
seed();
