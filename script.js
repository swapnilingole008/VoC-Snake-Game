class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = 20; // Fixed grid size for consistency
        
        // Responsive canvas setup
        this.setupResponsiveCanvas();
        
        // Game state
        this.gameRunning = false;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        
        // Snake properties
        this.snake = [
            {x: 10, y: 10}
        ];
        this.dx = 0;
        this.dy = 0;
        this.nextDx = 0;
        this.nextDy = 0;
        
        // Food properties
        this.food = this.generateFood();
        
        // Game speed
        this.gameSpeed = 150;
        this.lastTime = 0;
        
        // Touch controls
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        // Initialize UI
        this.initializeUI();
        this.bindEvents();
        this.updateHighScore();
        
        // Handle window resize
        window.addEventListener('resize', () => this.setupResponsiveCanvas());
    }
    
    setupResponsiveCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 60; // Account for padding
        const maxCanvasSize = Math.min(400, containerWidth);
        
        // Set canvas size while maintaining aspect ratio
        this.canvas.style.width = maxCanvasSize + 'px';
        this.canvas.style.height = maxCanvasSize + 'px';
        
        // Set actual canvas dimensions for crisp rendering
        this.canvas.width = maxCanvasSize;
        this.canvas.height = maxCanvasSize;
        
        // Update grid size based on new canvas size
        this.gridSize = maxCanvasSize / this.tileCount;
        
        // Redraw if game is running
        if (this.gameRunning) {
            this.draw();
        }
    }
    
    initializeUI() {
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.playAgainBtn = document.getElementById('playAgainBtn');
    }
    
    bindEvents() {
        // Button events
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.playAgainBtn.addEventListener('click', () => this.restartGame());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Prevent arrow key scrolling
        document.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning) return;
        
        switch(e.key) {
            case 'ArrowUp':
                if (this.dy !== 1) { // Prevent moving opposite direction
                    this.nextDx = 0;
                    this.nextDy = -1;
                }
                break;
            case 'ArrowDown':
                if (this.dy !== -1) {
                    this.nextDx = 0;
                    this.nextDy = 1;
                }
                break;
            case 'ArrowLeft':
                if (this.dx !== 1) {
                    this.nextDx = -1;
                    this.nextDy = 0;
                }
                break;
            case 'ArrowRight':
                if (this.dx !== -1) {
                    this.nextDx = 1;
                    this.nextDy = 0;
                }
                break;
        }
    }
    
    handleTouchStart(e) {
        if (!this.gameRunning) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.touchStartX = touch.clientX - rect.left;
        this.touchStartY = touch.clientY - rect.top;
    }
    
    handleTouchMove(e) {
        if (!this.gameRunning) return;
        e.preventDefault();
    }
    
    handleTouchEnd(e) {
        if (!this.gameRunning) return;
        
        const touch = e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        const touchEndX = touch.clientX - rect.left;
        const touchEndY = touch.clientY - rect.top;
        
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        
        // Minimum swipe distance
        const minSwipeDistance = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0 && this.dx !== -1) {
                    // Swipe right
                    this.nextDx = 1;
                    this.nextDy = 0;
                } else if (deltaX < 0 && this.dx !== 1) {
                    // Swipe left
                    this.nextDx = -1;
                    this.nextDy = 0;
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0 && this.dy !== -1) {
                    // Swipe down
                    this.nextDx = 0;
                    this.nextDy = 1;
                } else if (deltaY < 0 && this.dy !== 1) {
                    // Swipe up
                    this.nextDx = 0;
                    this.nextDy = -1;
                }
            }
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.startBtn.style.display = 'none';
        this.restartBtn.style.display = 'inline-block';
        this.gameOverElement.style.display = 'none';
        this.gameLoop();
    }
    
    restartGame() {
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.nextDx = 0;
        this.nextDy = 0;
        this.score = 0;
        this.food = this.generateFood();
        this.gameRunning = true;
        this.gameOverElement.style.display = 'none';
        this.updateScore();
        this.gameLoop();
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameRunning) return;
        
        if (currentTime - this.lastTime > this.gameSpeed) {
            this.update();
            this.draw();
            this.lastTime = currentTime;
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        // Update direction
        this.dx = this.nextDx;
        this.dy = this.nextDy;
        
        // Don't move if no direction is set
        if (this.dx === 0 && this.dy === 0) return;
        
        // Calculate new head position
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.generateFood();
            // Increase speed slightly
            this.gameSpeed = Math.max(50, this.gameSpeed - 2);
        } else {
            // Remove tail if no food was eaten
            this.snake.pop();
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#f7fafc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw snake
        this.ctx.fillStyle = '#48bb78';
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            if (i === 0) {
                // Draw head with different color
                this.ctx.fillStyle = '#38a169';
            } else {
                this.ctx.fillStyle = '#48bb78';
            }
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        }
        
        // Draw food
        this.ctx.fillStyle = '#e53e3e';
        this.ctx.fillRect(
            this.food.x * this.gridSize + 1,
            this.food.y * this.gridSize + 1,
            this.gridSize - 2,
            this.gridSize - 2
        );
        
        // Draw grid (optional)
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        
        return food;
    }
    
    gameOver() {
        this.gameRunning = false;
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'block';
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScore();
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
}); 