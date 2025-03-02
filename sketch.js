// TV Escape - A Bizarre Retro Platformer Game in p5.js

// Game States
const START = 0;
const PLAYING = 1;
const GAMEOVER = 2;
let state = START;

// Game Objects
let player;
let levels;
let currentLevel = 0;

// Sound Effects
let jumpSound;
let hitSound;
let backgroundMusic;

// Color Palette for Retro Aesthetic
const COLORS = {
  BLACK: [0, 0, 0],
  WHITE: [255, 255, 255],
  RED: [255, 0, 0],
  GREEN: [0, 255, 0],
  BLUE: [0, 0, 255],
  YELLOW: [255, 255, 0],
  PURPLE: [128, 0, 128],
  ORANGE: [255, 165, 0]
};

// Setup Function: Initialize Canvas and Game Elements
function setup() {
  createCanvas(800, 600);
  frameRate(60);

  // Initialize Player
  player = new Player();

  // Define Levels
  levels = [
    new Level1(), // Cooking Show Theme
    new Level2(), // Sci-Fi Show Theme
    new Level3()  // Children's Show Theme
  ];

  // Initialize Sound Effects
  jumpSound = new p5.Oscillator('square');
  jumpSound.amp(0.1);
  jumpSound.freq(440);

  hitSound = new p5.Oscillator('sawtooth');
  hitSound.amp(0.1);
  hitSound.freq(220);

  // Start Background Music
  backgroundMusic = new p5.SoundLoop(soundLoop, 0.5);
  backgroundMusic.start();
}

// Draw Function: Game Loop
function draw() {
  if (state === START) {
    drawStartScreen();
  } else if (state === PLAYING) {
    levels[currentLevel].update();
    levels[currentLevel].draw();
    player.update();
    player.draw();
    drawScanLines(); // Retro TV effect
    drawHUD();       // Display lives
  } else if (state === GAMEOVER) {
    drawGameOverScreen();
  }
}

// Handle Key Presses
function keyPressed() {
  if (state === START) {
    state = PLAYING;
  } else if (state === PLAYING) {
    if (keyCode === LEFT_ARROW) {
      player.moveLeft();
    } else if (keyCode === RIGHT_ARROW) {
      player.moveRight();
    } else if (keyCode === UP_ARROW) {
      player.jump();
    }
  } else if (state === GAMEOVER) {
    // Restart Game
    player = new Player();
    currentLevel = 0;
    state = PLAYING;
  }
}

// Handle Key Releases
function keyReleased() {
  if (state === PLAYING) {
    if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
      player.stopMoving();
    }
  }
}

// --- Player Class ---
class Player {
  constructor() {
    this.x = 100;
    this.y = 500;
    this.vx = 0;
    this.vy = 0;
    this.width = 20;
    this.height = 40;
    this.jumping = false;
    this.lives = 3;
  }

  update() {
    // Apply Gravity
    this.vy += 0.5;
    this.y += this.vy;
    this.x += this.vx;

    // Keep Player Within Horizontal Bounds
    if (this.x < 0) this.x = 0;
    if (this.x > width - this.width) this.x = width - this.width;

    // Check Platform Collisions
    for (let platform of levels[currentLevel].platforms) {
      if (this.isOnPlatform(platform)) {
        this.y = platform.y - this.height;
        this.vy = 0;
        this.jumping = false;
      }
    }

    // Check Enemy Collisions
    for (let enemy of levels[currentLevel].enemies) {
      if (this.collidesWith(enemy)) {
        this.lives--;
        hitSound.start();
        setTimeout(() => hitSound.stop(), 100);
        if (this.lives <= 0) {
          state = GAMEOVER;
        } else {
          this.resetPosition();
        }
      }
    }

    // Check Exit
    if (this.x + this.width > levels[currentLevel].exitX) {
      currentLevel++;
      if (currentLevel >= levels.length) {
        state = GAMEOVER; // Game ends (could add a win state)
      } else {
        this.resetPosition();
      }
    }

    // Check if Fallen Off Screen
    if (this.y > height) {
      this.lives--;
      if (this.lives <= 0) {
        state = GAMEOVER;
      } else {
        this.resetPosition();
      }
    }
  }

  moveLeft() {
    this.vx = -5;
  }

  moveRight() {
    this.vx = 5;
  }

  stopMoving() {
    this.vx = 0;
  }

  jump() {
    if (!this.jumping) {
      this.vy = -12; // Adjusted for better jump height
      this.jumping = true;
      jumpSound.start();
      setTimeout(() => jumpSound.stop(), 100);
    }
  }

  resetPosition() {
    this.x = 100;
    this.y = 500;
    this.vy = 0;
    this.jumping = false;
  }

  draw() {
    fill(COLORS.RED);
    rect(this.x, this.y, this.width, this.height); // Body
    fill(COLORS.WHITE);
    rect(this.x + 5, this.y + 5, 10, 10);          // Simple face
  }

  isOnPlatform(platform) {
    return this.x + this.width > platform.x &&
           this.x < platform.x + platform.width &&
           this.y + this.height > platform.y &&
           this.y + this.height < platform.y + 10 &&
           this.vy > 0;
  }

  collidesWith(obj) {
    return this.x < obj.x + obj.width &&
           this.x + this.width > obj.x &&
           this.y < obj.y + obj.height &&
           this.y + this.height > obj.y;
  }
}

// --- Platform Class ---
class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw() {
    fill(COLORS.GREEN);
    rect(this.x, this.y, this.width, this.height);
  }
}

// --- Enemy Base Class ---
class Enemy {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.vx = 0;
    this.vy = 0;
  }

  update() {}
  draw() {}
}

// --- SpatulaEnemy (Cooking Show) ---
class SpatulaEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 30, 10);
    this.vx = 2;
  }

  update() {
    this.x += this.vx;
    if (this.x < 0 || this.x > width - this.width - 10) {
      this.vx *= -1;
    }
  }

  draw() {
    fill(COLORS.PURPLE);
    rect(this.x, this.y, this.width, this.height);                     // Handle
    triangle(
      this.x + this.width, this.y,
      this.x + this.width + 10, this.y - 5,
      this.x + this.width + 10, this.y + 15
    );                                                                 // Blade
  }
}

// --- AlienEnemy (Sci-Fi Show) ---
class AlienEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 20, 20);
    this.shootTimer = 0;
  }

  update() {
    this.shootTimer++;
    if (this.shootTimer > 120) { // Shoot every 2 seconds at 60fps
      levels[currentLevel].projectiles.push(new Projectile(this.x, this.y, 5, 0));
      this.shootTimer = 0;
    }
  }

  draw() {
    fill(COLORS.BLUE);
    ellipse(this.x + 10, this.y + 10, 20, 20); // Body
    fill(COLORS.YELLOW);
    ellipse(this.x + 5, this.y + 5, 5, 5);     // Eye 1
    ellipse(this.x + 15, this.y + 5, 5, 5);    // Eye 2
  }
}

// --- SmilingFaceEnemy (Children's Show) ---
class SmilingFaceEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 20, 20);
    this.vx = 2;
    this.wave = 0;
  }

  update() {
    this.x += this.vx;
    this.wave += 0.1;
    this.y += sin(this.wave) * 2; // Wavy movement
    if (this.x < 0 || this.x > width - this.width) {
      this.vx *= -1;
    }
  }

  draw() {
    fill(COLORS.YELLOW);
    ellipse(this.x + 10, this.y + 10, 20, 20); // Face
    fill(COLORS.BLACK);
    ellipse(this.x + 5, this.y + 5, 5, 5);     // Eye 1
    ellipse(this.x + 15, this.y + 5, 5, 5);    // Eye 2
    arc(this.x + 10, this.y + 15, 10, 5, 0, PI); // Smile
  }
}

// --- Projectile Class (For AlienEnemy) ---
class Projectile {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = 10;
    this.height = 5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    fill(COLORS.ORANGE);
    rect(this.x, this.y, this.width, this.height);
  }
}

// --- Level Base Class ---
class Level {
  constructor() {
    this.platforms = [];
    this.enemies = [];
    this.projectiles = [];
    this.exitX = 700;
  }

  update() {
    for (let enemy of this.enemies) {
      enemy.update();
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      this.projectiles[i].update();
      if (player.collidesWith(this.projectiles[i])) {
        player.lives--;
        hitSound.start();
        setTimeout(() => hitSound.stop(), 100);
        if (player.lives <= 0) {
          state = GAMEOVER;
        } else {
          player.resetPosition();
        }
        this.projectiles.splice(i, 1);
      } else if (this.projectiles[i].x > width || this.projectiles[i].x < 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  draw() {
    background(COLORS.BLACK);
    for (let platform of this.platforms) {
      platform.draw();
    }
    for (let enemy of this.enemies) {
      enemy.draw();
    }
    for (let projectile of this.projectiles) {
      projectile.draw();
    }
    fill(COLORS.YELLOW);
    rect(this.exitX, 500, 50, 50); // Exit
  }
}

// --- Level 1: Cooking Show ---
class Level1 extends Level {
  constructor() {
    super();
    this.platforms = [
      new Platform(0, 550, 800, 50),
      new Platform(200, 400, 150, 20),
      new Platform(400, 300, 150, 20)
    ];
    this.enemies = [
      new SpatulaEnemy(250, 380),
      new SpatulaEnemy(450, 280)
    ];
  }
}

// --- Level 2: Sci-Fi Show ---
class Level2 extends Level {
  constructor() {
    super();
    this.platforms = [
      new Platform(0, 550, 800, 50),
      new Platform(100, 450, 100, 20),
      new Platform(300, 350, 100, 20),
      new Platform(500, 250, 100, 20)
    ];
    this.enemies = [
      new AlienEnemy(150, 400),
      new AlienEnemy(400, 300)
    ];
  }
}

// --- Level 3: Children's Show ---
class Level3 extends Level {
  constructor() {
    super();
    this.platforms = [
      new Platform(0, 550, 800, 50),
      new Platform(50, 500, 100, 20),
      new Platform(200, 450, 100, 20),
      new Platform(350, 400, 100, 20),
      new Platform(500, 350, 100, 20),
      new Platform(650, 300, 100, 20)
    ];
    this.enemies = [
      new SmilingFaceEnemy(100, 450),
      new SmilingFaceEnemy(300, 400),
      new SmilingFaceEnemy(550, 300)
    ];
  }
}

// --- Helper Functions ---

// Draw Start Screen
function drawStartScreen() {
  background(COLORS.BLACK);
  fill(COLORS.WHITE);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("TV Escape", width / 2, height / 2 - 50);
  textSize(16);
  text("Press any key to start", width / 2, height / 2 + 50);
}

// Draw Game Over Screen
function drawGameOverScreen() {
  background(COLORS.BLACK);
  fill(COLORS.WHITE);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("Game Over", width / 2, height / 2 - 50);
  textSize(16);
  text("Press any key to restart", width / 2, height / 2 + 50);
}

// Draw Scan Lines for Retro TV Effect
function drawScanLines() {
  stroke(255, 50);
  for (let i = 0; i < height; i += 4) {
    line(0, i, width, i);
  }
  noStroke();
}

// Draw Heads-Up Display (Lives)
function drawHUD() {
  fill(COLORS.WHITE);
  textSize(16);
  textAlign(LEFT);
  text("Lives: " + player.lives, 10, 20);
}

// Background Music Loop
function soundLoop(timeFromNow) {
  let note = new p5.Oscillator('sine');
  note.amp(0.1);
  let midiNote = 60 + floor(random(0, 12)); // Simple random melody
  note.freq(midiToFreq(midiNote));
  note.start(timeFromNow);
  note.stop(timeFromNow + 0.2);
}