class Spark {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = 0; // No horizontal movement
        this.speedY = 0; // No vertical movement
        this.lifespan = Math.random() * 100 + 100;
        this.age = 0;
        this.color = `rgba(255, 255, 255,`; // White color
    }

    update() {
        // No movement updates for x and y
        this.age++;

        // Fade based on age
        const opacity = Math.max(0, (this.lifespan - this.age) / this.lifespan);
        return opacity > 0;
    }

    draw(ctx) {
        const opacity = (this.lifespan - this.age) / this.lifespan;
        ctx.fillStyle = this.color + opacity + ')';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('sparkCanvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const sparks = [];
    const maxSparks = 30; // Reduced number for subtler effect

    function createSpark() {
        if (sparks.length < maxSparks) {
            sparks.push(new Spark(canvas));
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Create new sparks
        if (Math.random() < 0.03) createSpark(); // Reduced creation rate

        // Update and draw sparks
        for (let i = sparks.length - 1; i >= 0; i--) {
            const spark = sparks[i];
            const alive = spark.update();
            
            if (alive) {
                spark.draw(ctx);
            } else {
                sparks.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}); 