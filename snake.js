// Function to export that contains the game
function SnakeGame(containerId) {
    const self = this;
    this.welcome = 'Hello, lets play Snake!';
    this.gameOver = false;
    this.containerId = containerId;
    this.ctx = null;
    this.gridProps = {
        blockSize: 32,
        numColumns: 16,
        numRows: 16,
        gridGap: 2,
    };

    this.snake = {
        node: {
            pos: {
                x: self.gridProps.numRows / 2,
                y: self.gridProps.numColumns / 2,
            },
            next: null,
        },
        direction: 'right',
        pendingDirection: 'right',
    }

    this.food = {
        pos: {}
    }

    this.init(); // Initialise the game

    this.gameLoop = setInterval(function() { // Game loop
        self.update();
        self.render(self.ctx);
    }, 150);
}

// Shortcut for adding keyboard input
// Must be modified for your snake data structure
SnakeGame.prototype.keyboardHandler = function(e) {
    const { snake } = this;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (snake.direction !== 'right') {
            snake.pendingDirection = 'left';
        }
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        if (snake.direction !== 'left') {
            snake.pendingDirection = 'right';
        }
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
        if (snake.direction !== 'down') {
            snake.pendingDirection = 'up';
        }
    } else if (e.key === 'ArrowDown' || e.key === 's') {
        if (snake.direction !== 'up') {
            snake.pendingDirection = 'down';
        }    
    }
};

SnakeGame.prototype.init = function() {
    const { blockSize, numColumns, numRows, gridGap } = this.gridProps;
    let { snake, food } = this;

    this.gameOver = false;

    // wipe canvas
    const container = document.getElementById(this.containerId);
    container.innerHTML = '';

    // Initialise the canvas and add it to the dom
    const canvas = document.createElement('canvas');
    canvas.width = blockSize * numColumns + (numColumns - 1) * gridGap;
    canvas.height = blockSize * numRows + (numRows - 1) * gridGap;

    container.appendChild(canvas);
    this.ctx = canvas.getContext('2d');

    //listen to keyboard...
    window.addEventListener("keydown", this.keyboardHandler.bind(this));

    //reset snake position...
    let newPos = {x: this.gridProps.numRows / 2, y: this.gridProps.numColumns / 2};
    const newNode = { pos: newPos, next: null};
    snake.node = newNode;

    //set food position
    food.pos = this.getRandomGridPos(this.getEmptyCells());
};

SnakeGame.prototype.update = function() {
    const {snake} = this;

    let newPos = {x: snake.node.pos.x, y: snake.node.pos.y};
    this.snake.direction = this.snake.pendingDirection;

    const currentDirection = this.snake.direction;
    if(currentDirection === "right"){
        newPos.x += 1;
    } else if(currentDirection === "down"){
        newPos.y += 1;
    } else if(currentDirection === "left"){
        newPos.x -= 1;
    } else if(currentDirection === "up"){
        newPos.y -= 1;
    }

    //oldHead
    const oldHead = snake.node;
    
    //create a new node
    const newNode = { pos: newPos, next: oldHead};
    snake.node = newNode;

    // eat food
    const didWeEat = this.eatFood();

    if(didWeEat){
        return;
    }
    
    //removing the tail
    let node = snake.node;
    while(node){
        if(node.next){
            //we are not the last (tail)
            if(!node.next.next){
                node.next = null;
            }
        }
        node = node.next;
    }

    //detecting edge hit - place at bottom... infinite loop otherwhise...
    if(snake.node.pos.x < 0 || snake.node.pos.y < 0 || snake.node.pos.x > this.gridProps.numRows - 1 || snake.node.pos.y > this.gridProps.numColumns - 1 ){
        this.gameOver = true;
    }

    //detect collision with self
    // this.nodeMap(snake.node, (node, idx) => {
    //     if(idx > 0 && snake.node.pos === node.pos){
    //         //above is never true...?
    //         this.gameOver = true;
    //     }
    // });

    if(this.gameOver){
        this.init();
    }
};

SnakeGame.prototype.getRandomGridPos = function(cells) {
    const randomNo = Math.floor(Math.random() * cells.length);
    return cells[randomNo];
}

SnakeGame.prototype.getEmptyCells = function() {
    const { numColumns, numRows } = this.gridProps;
    const { snake } = this;
    
    let emptyCells = [];
    for( let i = 0; i < numColumns; i++ ){
        for( let j = 0; j < numRows; j++){
            emptyCells.push({ x:i, y:j });
        }
    }

    emptyCells = emptyCells.filter(cell => !(cell.x === snake.node.pos.x && cell.y === snake.node.pos.y ));

    return emptyCells;
}

SnakeGame.prototype.nodeMap = function(nodes, f){
    let results = [];
    let node = nodes;
    let count = 0;
    while(node){
        results.push(f(node, count));
        node = node.next;
        count++; 
    }

    console.log(results); //should this be array of undefined..?
    return results;
}

SnakeGame.prototype.doPosMatch = function(a, b){
    if(a.x === b.x && a.y === b.y){
        return true;
    }
    return false;
}

SnakeGame.prototype.eatFood = function() {
    const {snake, food} = this;
    if(this.doPosMatch(snake.node.pos, food.pos)){
        food.pos = {};
        food.pos = this.getRandomGridPos(this.getEmptyCells());
        return true;
    }
    return false;
}

// BEGIN RENDER FUNCTIONS
SnakeGame.prototype.drawRect = function(ctx, x, y, width, height, colour) {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fillStyle = colour;
    ctx.fill();
};

SnakeGame.prototype.drawSquare = function(ctx, x, y, size, colour) {
    this.drawRect(ctx, x, y, size, size, colour);
};

SnakeGame.prototype.drawCell = function(ctx, x, y, size, colour) {
    const { blockSize, gridGap } = this.gridProps;
    const actualX = x * blockSize + x * gridGap;
    const actualY = y * blockSize + y * gridGap;
    this.drawSquare(ctx, actualX, actualY, size, colour);
}

SnakeGame.prototype.render = function(ctx) {
    const { blockSize, numColumns, numRows, gridGap } = this.gridProps;

    // Clear canvas
    this.drawRect(ctx, 0, 0, ctx.canvas.width, ctx.canvas.height, '#EEE');

    // Draw grid
    for (let i=0; i<numColumns; i++) {
        for (let j=0; j<numRows; j++) {
            this.drawSquare(
                ctx,
                i * blockSize + i * gridGap,
                j * blockSize + j * gridGap,
                blockSize,
                '#DDE',
            );
        }
    }

    // Draw Snake 
    this.nodeMap(this.snake.node, (node, idx) => {
        if(idx === 0){
            this.drawCell(ctx, node.pos.x, node.pos.y, blockSize, '#ffa500');
        } else {
            this.drawCell(ctx, node.pos.x, node.pos.y, blockSize, '#ffa50075');
        }
    })

    // Draw Food
    this.drawCell(ctx, this.food.pos.x, this.food.pos.y, blockSize, '#54b558');
};
// END RENDER FUNCTIONS