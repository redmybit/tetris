const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");

const fps = 30;
const tickFps = 5;
const tickWaitTime = Math.floor(fps / tickFps);
const fpsInterval = 1000 / fps;
let lastTime = performance.now();
let tick = 0;

const gridWidth = 15;
const gridHeight = 20;

const cellSize = 25;

let grid = [];

const cellDict = {
	"empty": "black",
	"i": "red",
	"t": "orange",
	"s": "yellow",
	"s1": "lime",
	"s2": "cyan",
	"l1": "blue",
	"l2": "purple"
};

const tetronimos = {
	"i": {
		"0": [[0,1], [0,0], [0,-1], [0,-2]],
		"90": [[-2,0], [-1,0], [0,0], [1,0]],
		"180": [[0,1], [0,0], [0,-1], [0,-2]],
		"270": [[-2,0], [-1,0], [0,0], [1,0]]
	},
	"t": {
		"0": [[0,-1],[-1,0],[0,0],[1,0]],
		"90": [[0,-1],[0,0],[1,0],[0,1]],
		"180": [[-1,0],[0,0],[1,0],[0,1]],
		"270": [[0,-1],[-1,0],[0,0],[0,1]]
	},
	"s": {
		"0": [[0,0],[1,0],[1,1],[0,1]],
		"90": [[0,0],[1,0],[1,1],[0,1]],
		"180": [[0,0],[1,0],[1,1],[0,1]],
		"270": [[0,0],[1,0],[1,1],[0,1]]
	},
	"s1": {
		"0": [[-1,-1],[-1,0],[0,0],[0,1]],
		"90": [[0,0],[1,-1],[-1,0],[0,-1]],
		"180": [[-1,-1],[-1,0],[0,0],[0,1]],
		"270": [[0,0],[1,-1],[-1,0],[0,-1]]
	},
	"s2": {
		"0": [[1,-1],[0,0],[1,0],[0,1]],
		"90": [[-1,-1],[0,-1],[0,0],[1,0]],
		"180": [[1,-1],[0,0],[1,0],[0,1]],
		"270": [[-1,-1],[0,-1],[0,0],[1,0]]
	},
	"l1": {
		"0": [[0,0],[0,1],[0,-1],[1,1]],
		"90": [[-1,1],[-1,0],[0,0],[1,0]],
		"180": [[-1,-1],[0,-1],[0,0],[0,1]],
		"270": [[-1,0],[0,0],[1,0],[1,-1]]
	},
	"l2": {
		"0": [[0,0],[0,1],[0,-1],[1,-1]],
		"90": [[-1,0],[0,0],[1,0],[1,1]],
		"180": [[0,0],[0,1],[0,-1],[-1,1]],
		"270": [[0,0],[1,0],[-1,0],[-1,-1]]
	}
};

const defaultPouch = Object.keys(tetronimos);
let pouch = [];

function clearGrid() {
	grid = [];
	
	for(let y = 0; y < gridHeight; y++) {
		let l = [];
		for(let x = 0; x < gridWidth; x++) {
			l.push(cellDict["empty"]);
		}
		grid.push(l);
	}
}

function resetPouch() {
	pouch = [...defaultPouch];
}

function getTetronimo() {
	if(pouch.length === 0) {
		resetPouch();
	}
	
	let index = Math.floor(Math.random() * pouch.length);
	let t = pouch[index];
	pouch.splice(index, 1);
	
	return t;
}

function drawGrid() {
	for(let y = 0; y < gridHeight; y++) {
		for(let x = 0; x < gridWidth; x++) {
			ctx.fillStyle = grid[y][x];
			ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
		}
	}
}

let gameState = "pending";

let tetronimoName = null;
let tetronimo = null;
let tetronimoX = null;
let tetronimoY = null;
let rotation = 0;

const spawnX = 7;
const spawnY = 0;

function validCell(x, y) {
	if(x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
		return true
	}
	return false
}

function burnCell(x, y, color) {
	if(validCell(x, y)) {
		grid[y][x] = color;
	}
}

function burnGrid() {
	for(const point of tetronimo) {
		let x = point[0] + tetronimoX;
		let y = point[1] + tetronimoY;

		burnCell(x, y, cellDict[tetronimoName]);
	}
}

function drawGhostTetromino() {
	for(const point of tetronimo) {
		let x = point[0] + tetronimoX;
		let y = point[1] + tetronimoY;
		
		ctx.fillStyle = cellDict[tetronimoName];
		ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
	}
}

function tetronimoColliding() {
	for(const point of tetronimo) {
		let x = point[0] + tetronimoX;
		let y = point[1] + tetronimoY;
		
		if(y >= gridHeight) {
			return true
		}
		
		if(validCell(x, y)) {
		
			let cell = grid[y][x];
			if(cell != cellDict["empty"]) {
				return true
			}
		}
	}
	
	return false
}

function validPos() {
	for(const point of tetronimo) {
		let x = point[0] + tetronimoX;
		let y = point[1] + tetronimoY;

		if(!validCell(x, y)) {
			return false
		}
		
		if(tetronimoColliding()) {
			return false
		}
	}
	
	return true
}

function randomRotation() {
	let rots = [0, 90, 180, 270];
	let index = Math.floor(Math.random() * rots.length);
	return rots[index]
}

function quickT() {
	return tetronimos[tetronimoName][rotation.toString()];
}

function deleteFilled() {
	for(let y = 0; y < gridHeight; y++) {
		if(!grid[y].includes(cellDict["empty"])) {
			let l = [];
			for(let x = 0; x < gridWidth; x++) {
				l.push(cellDict["empty"]);
			}
			grid[y] = l;
		}
	}
}

function isUniformToTarget(target, arr) {
	for(const item of arr) {
		if(item != target) {
			return false
		}
	}
	return true
}

function collapseGrid() {
	let temp = [];
	for(const row of grid) {
		temp.push([...row]);
	}
	
	let rem = [];
	
	for(let y = gridHeight - 1; y >= 0; y--) {
		if(isUniformToTarget(cellDict["empty"], grid[y])) {
			rem.push(y);
		}
	}
	
	temp = temp.filter((_, i) => !rem.includes(i));
	
	grid = [];
	
	for(let y = 0; y < gridHeight - temp.length; y++) {
		let l = [];
		for(let x = 0; x < gridWidth; x++) {
			l.push(cellDict["empty"]);
		}
		grid.push(l);
	}
	
	for(const row of temp) {
		grid.push([...row]);
	}
}

function gameLogic() {
	deleteFilled();
	collapseGrid();
	
	if(gameState === "pending") {
		tetronimoName = getTetronimo();
		
		tetronimoX = spawnX;
		tetronimoY = spawnY;
		rotation = randomRotation();
		
		tetronimo = quickT();
		
		gameState = "dropping";
	} else if(gameState === "dropping") {
		tetronimo = quickT();
		tetronimoY++;
		
		if(tetronimoColliding()) {
			tetronimoY--; // uncollide
			
			if(tetronimoY === spawnY) {
				gameState = "over";
			} else {
				burnGrid();
				gameState = "pending";
			}
		}
		
	} else if(gameState === "over") {
		newGame();
	}
}

function draw() {
	drawGrid();
	
	if(tick % tickWaitTime === 0) {
		gameLogic();
	}
	
	drawGhostTetromino();
	
	tick++;
}

function wrapper(now) {
	requestAnimationFrame(wrapper);
	
	const elapsed = now - lastTime;
	if(elapsed >= fpsInterval) {
		lastTime = now - (elapsed % fpsInterval);
		draw();
	}
}

function newGame() {
	gameState = "pending";
	clearGrid();
	resetPouch();
}

window.addEventListener("keydown", (e) =>  {
	if(e.key === "a") {
		tetronimoX--;
		if(!validPos()) {
			tetronimoX++; // reverse change
		}
	} else if(e.key === "d") {
		tetronimoX++;
		if(!validPos()) {
			tetronimoX--; // reverse change
		}
	} else if(e.key === "w") {
		let protation = rotation;
		
		rotation += 90;
		if(rotation === 360) {
			rotation = 0;
		}
		
		tetronimo = quickT();
		
		if(!validPos()) {
			rotation = protation;
			tetronimo = quickT();
		}
	} else if(e.key === "s") {
		while(!tetronimoColliding()) {
			tetronimoY++;
		}
		tetronimoY--;
	}
});

newGame();
requestAnimationFrame(wrapper);