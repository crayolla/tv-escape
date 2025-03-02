// AI Escape - A Bizarre Tech Platformer Game in p5.js

// Game States
const START = 0;
const PLAYING = 1;
const GAMEOVER = 2;
const WIN = 3;  // New win state
let state = START;

// Game Objects
let player;
let levels;
let currentLevel = 0;
let score = 0;  // Add score tracking
let highScore = 0;  // Add high score tracking
let powerUps = []; // Array to store power-ups

// Sound Effects
let jumpSound;
let hitSound;
let collectSound;  // New sound for collecting data points
let levelUpSound;  // New sound for completing a level
let backgroundMusic;

// Color Palette for Tech Aesthetic
const COLORS = {
  BLACK: [0, 0, 0],
  WHITE: [255, 255, 255],
  RED: [255, 0, 0],
  GREEN: [0, 255, 0],
  BLUE: [0, 0, 255],
  YELLOW: [255, 255, 0],
  PURPLE: [128, 0, 128],
  ORANGE: [255, 165, 0],
  CYAN: [0, 255, 255],
  NEON_GREEN: [57, 255, 20]
};

// Collectibles array
let dataPoints = [];

// Setup Function: Initialize Canvas and Game Elements
function setup() {
  createCanvas(800, 600);
  frameRate(60);

  // Initialize Player
  player = new Player();

  // Define Levels
  levels = [
    new Level1(), // AI Training Ground Theme
    new Level2(), // Neural Network Theme
    new Level3()  // Robotics Lab Theme
  ];

  // Initialize Sound Effects
  jumpSound = new p5.Oscillator('square');
  jumpSound.amp(0.1);
  jumpSound.freq(440);

  hitSound = new p5.Oscillator('sawtooth');
  hitSound.amp(0.1);
  hitSound.freq(220);
  
  collectSound = new p5.Oscillator('sine');
  collectSound.amp(0.1);
  collectSound.freq(660);
  
  levelUpSound = new p5.Oscillator('triangle');
  levelUpSound.amp(0.2);
  levelUpSound.freq(880);

  // Start Background Music
  backgroundMusic = new p5.SoundLoop(soundLoop, 0.5);
  backgroundMusic.start();
  
  // Initialize data points
  resetDataPoints();
  
  // Initialize power-ups
  resetPowerUps();
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
  } else if (state === WIN) {
    drawWinScreen();
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
  } else if (state === WIN) {
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
    this.width = 30;
    this.height = 40;
    this.jumping = false;
    this.lives = 3;
    this.blinkTimer = 0;
    this.onGround = false;
    this.jumpPower = -12;
    this.gravity = 0.5;
    this.maxFallSpeed = 12;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.speedBoostActive = false;
    this.speedBoostTimer = 0;
    this.superJumpActive = false;
    this.superJumpTimer = 0;
    this.normalSpeed = 5;
    this.boostedSpeed = 8;
    this.normalJumpPower = -12;
    this.superJumpPower = -18;
  }

  update() {
    // Update power-up timers
    if (this.shieldActive) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
      }
    }
    
    if (this.speedBoostActive) {
      this.speedBoostTimer--;
      if (this.speedBoostTimer <= 0) {
        this.speedBoostActive = false;
      }
    }
    
    if (this.superJumpActive) {
      this.superJumpTimer--;
      if (this.superJumpTimer <= 0) {
        this.superJumpActive = false;
        this.jumpPower = this.normalJumpPower;
      }
    }
    
    // Apply Gravity
    this.vy += this.gravity;
    
    // Limit fall speed
    if (this.vy > this.maxFallSpeed) {
      this.vy = this.maxFallSpeed;
    }
    
    // Store previous position for collision resolution
    let prevX = this.x;
    let prevY = this.y;
    
    // Update position
    this.y += this.vy;
    this.x += this.vx;

    // Keep Player Within Horizontal Bounds
    if (this.x < 0) this.x = 0;
    if (this.x > width - this.width) this.x = width - this.width;

    // Reset onGround state
    this.onGround = false;
    
    // Check Platform Collisions
    for (let platform of levels[currentLevel].platforms) {
      if (this.collidesWith(platform)) {
        // Vertical collision resolution
        if (prevY + this.height <= platform.y) {
          // Landing on top of platform
          this.y = platform.y - this.height;
          this.vy = 0;
          this.onGround = true;
          this.jumping = false;
        } else if (prevY >= platform.y + platform.height) {
          // Hitting bottom of platform
          this.y = platform.y + platform.height;
          this.vy = 0;
        } else if (prevX + this.width <= platform.x) {
          // Hitting left side of platform
          this.x = platform.x - this.width;
          this.vx = 0;
        } else if (prevX >= platform.x + platform.width) {
          // Hitting right side of platform
          this.x = platform.x + platform.width;
          this.vx = 0;
        }
      }
    }

    // Check Enemy Collisions
    for (let enemy of levels[currentLevel].enemies) {
      if (this.collidesWith(enemy)) {
        if (this.shieldActive) {
          // Shield protects from damage
          this.shieldActive = false;
          this.shieldTimer = 0;
          
          // Bounce effect
          this.vy = -5;
          
          // Shield break sound
          let shieldBreakSound = new p5.Oscillator('square');
          shieldBreakSound.amp(0.1);
          shieldBreakSound.freq(220);
          shieldBreakSound.start();
          setTimeout(() => shieldBreakSound.stop(), 100);
        } else {
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
    }

    // Check Exit
    if (this.x + this.width > levels[currentLevel].exitX && 
        this.y + this.height > 500 && 
        this.y < 550) {
      currentLevel++;
      levelUpSound.start();
      setTimeout(() => levelUpSound.stop(), 300);
      if (currentLevel >= levels.length) {
        state = WIN; // Game wins
      } else {
        this.resetPosition();
        // Reset data points for the new level
        resetDataPoints();
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

    // Check PowerUp Collisions
    for (let powerUp of powerUps) {
      if (!powerUp.collected && this.collidesWith(powerUp)) {
        powerUp.collected = true;
        
        // Apply power-up effect
        if (powerUp.type === "speed") {
          this.speedBoostActive = true;
          this.speedBoostTimer = 300; // 5 seconds at 60fps
          // Special sound for speed boost
          let speedSound = new p5.Oscillator('sawtooth');
          speedSound.amp(0.1);
          speedSound.freq(880);
          speedSound.start();
          setTimeout(() => speedSound.stop(), 200);
        } else if (powerUp.type === "shield") {
          this.shieldActive = true;
          this.shieldTimer = 600; // 10 seconds at 60fps
          // Special sound for shield
          let shieldSound = new p5.Oscillator('sine');
          shieldSound.amp(0.1);
          shieldSound.freq(440);
          shieldSound.start();
          setTimeout(() => shieldSound.stop(), 300);
        } else if (powerUp.type === "jump") {
          this.superJumpActive = true;
          this.superJumpTimer = 300; // 5 seconds at 60fps
          this.jumpPower = this.superJumpPower;
          // Special sound for super jump
          let jumpBoostSound = new p5.Oscillator('triangle');
          jumpBoostSound.amp(0.1);
          jumpBoostSound.freq(660);
          jumpBoostSound.start();
          setTimeout(() => jumpBoostSound.stop(), 200);
        }
        
        // Add score for collecting power-up
        score += 25;
      }
    }
  }

  moveLeft() {
    this.vx = this.speedBoostActive ? -this.boostedSpeed : -this.normalSpeed;
  }

  moveRight() {
    this.vx = this.speedBoostActive ? this.boostedSpeed : this.normalSpeed;
  }

  stopMoving() {
    this.vx = 0;
  }

  jump() {
    if (this.onGround) {
      this.vy = this.jumpPower;
      this.jumping = true;
      this.onGround = false;
      jumpSound.start();
      setTimeout(() => jumpSound.stop(), 100);
    }
  }

  resetPosition() {
    this.x = 100;
    this.y = 500;
    this.vx = 0;
    this.vy = 0;
    this.jumping = false;
    this.onGround = false;
    
    // Reset power-ups
    this.shieldActive = false;
    this.speedBoostActive = false;
    this.superJumpActive = false;
    this.jumpPower = this.normalJumpPower;
  }

  draw() {
    // AI Agent Character
    this.blinkTimer++;
    
    // Shield effect if active
    if (this.shieldActive) {
      fill(COLORS.CYAN, 100);
      ellipse(this.x + this.width/2, this.y + this.height/2, 50, 50);
    }
    
    // Speed effect if active
    if (this.speedBoostActive) {
      fill(COLORS.YELLOW, 150);
      for (let i = 1; i <= 3; i++) {
        ellipse(this.x - i * 8, this.y + this.height/2, 10 - i * 2, 20);
      }
    }
    
    // Super jump effect if active
    if (this.superJumpActive) {
      fill(COLORS.NEON_GREEN, 150);
      triangle(
        this.x + this.width/2, this.y - 10,
        this.x + this.width/2 - 10, this.y,
        this.x + this.width/2 + 10, this.y
      );
    }
    
    // Body
    fill(COLORS.CYAN);
    rect(this.x, this.y, this.width, this.height, 5);
    
    // Face
    fill(COLORS.BLACK);
    rect(this.x + 5, this.y + 5, this.width - 10, 15, 2);
    
    // Eyes
    fill(COLORS.NEON_GREEN);
    if (this.blinkTimer % 60 < 5) {
      // Blinking
      rect(this.x + 8, this.y + 10, 5, 1);
      rect(this.x + this.width - 13, this.y + 10, 5, 1);
    } else {
      // Normal eyes
      rect(this.x + 8, this.y + 10, 5, 5);
      rect(this.x + this.width - 13, this.y + 10, 5, 5);
    }
    
    // Antenna
    line(this.x + this.width/2, this.y, this.x + this.width/2, this.y - 10);
    fill(COLORS.RED);
    ellipse(this.x + this.width/2, this.y - 10, 5, 5);
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

// --- DataPoint Class ---
class DataPoint {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 15;
    this.height = 15;
    this.collected = false;
    this.pulseSize = 0;
  }
  
  update() {
    this.pulseSize = sin(frameCount * 0.1) * 3;
  }
  
  draw() {
    if (!this.collected) {
      fill(COLORS.NEON_GREEN);
      ellipse(this.x, this.y, this.width + this.pulseSize, this.height + this.pulseSize);
      fill(COLORS.WHITE);
      textSize(10);
      textAlign(CENTER, CENTER);
      text("01", this.x, this.y);
    }
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

// --- BugEnemy (AI Training Ground) ---
class BugEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 30, 20);
    this.vx = 2;
    this.wiggleTimer = 0;
  }

  update() {
    this.x += this.vx;
    this.wiggleTimer += 0.2;
    if (this.x < 0 || this.x > width - this.width - 10) {
      this.vx *= -1;
    }
  }

  draw() {
    fill(COLORS.RED);
    // Bug body
    ellipse(this.x + 15, this.y + 10, 30, 20);
    
    // Bug legs
    stroke(COLORS.RED);
    strokeWeight(2);
    let wiggle = sin(this.wiggleTimer) * 3;
    
    // Left legs
    line(this.x + 5, this.y + 10, this.x - 5, this.y + 15 + wiggle);
    line(this.x + 10, this.y + 10, this.x, this.y + 15 - wiggle);
    
    // Right legs
    line(this.x + 20, this.y + 10, this.x + 30, this.y + 15 + wiggle);
    line(this.x + 25, this.y + 10, this.x + 35, this.y + 15 - wiggle);
    
    // Antennae
    line(this.x + 5, this.y + 5, this.x, this.y - 5);
    line(this.x + 25, this.y + 5, this.x + 30, this.y - 5);
    
    // Eyes
    noStroke();
    fill(COLORS.BLACK);
    ellipse(this.x + 10, this.y + 5, 5, 5);
    ellipse(this.x + 20, this.y + 5, 5, 5);
  }
}

// --- FirewallEnemy (Neural Network) ---
class FirewallEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 20, 40);
    this.shootTimer = 0;
    this.pulseTimer = 0;
  }

  update() {
    this.shootTimer++;
    this.pulseTimer += 0.1;
    if (this.shootTimer > 90) { // Shoot more frequently
      levels[currentLevel].projectiles.push(new Projectile(this.x, this.y + 20, -5, 0));
      this.shootTimer = 0;
    }
  }

  draw() {
    let pulse = sin(this.pulseTimer) * 5;
    
    // Firewall body
    fill(COLORS.ORANGE);
    rect(this.x, this.y, this.width, this.height);
    
    // Firewall pattern
    stroke(COLORS.RED);
    strokeWeight(2);
    for (let i = 0; i < 4; i++) {
      let yPos = this.y + 10 * i + 5;
      line(this.x, yPos, this.x + this.width, yPos);
    }
    
    // Pulsing effect
    noStroke();
    fill(255, 100, 0, 100 + pulse * 10);
    rect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
  }
}

// --- RobotEnemy (Robotics Lab) ---
class RobotEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 30, 30);
    this.vx = 3;
    this.wave = 0;
    this.direction = 1;
  }

  update() {
    this.x += this.vx;
    this.wave += 0.1;
    this.y += sin(this.wave) * 2; // Wavy movement
    if (this.x < 0 || this.x > width - this.width) {
      this.vx *= -1;
      this.direction *= -1;
    }
  }

  draw() {
    // Robot body
    fill(COLORS.PURPLE);
    rect(this.x, this.y, this.width, this.height, 5);
    
    // Robot face
    fill(COLORS.BLACK);
    rect(this.x + 5, this.y + 5, this.width - 10, 10, 2);
    
    // Robot eyes
    fill(COLORS.RED);
    ellipse(this.x + 10, this.y + 10, 5, 5);
    ellipse(this.x + this.width - 10, this.y + 10, 5, 5);
    
    // Robot arms
    stroke(COLORS.PURPLE);
    strokeWeight(3);
    // Left arm
    line(this.x, this.y + 15, this.x - 10, this.y + 20 + sin(this.wave) * 5);
    // Right arm
    line(this.x + this.width, this.y + 15, this.x + this.width + 10, this.y + 20 + sin(this.wave + PI) * 5);
    
    noStroke();
  }
}

// --- Projectile Class (For FirewallEnemy) ---
class Projectile {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = 15;
    this.height = 5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    fill(COLORS.RED);
    rect(this.x, this.y, this.width, this.height, 5);
    fill(COLORS.ORANGE);
    rect(this.x + 2, this.y + 1, this.width - 4, this.height - 2, 3);
  }
}

// --- Level Base Class ---
class Level {
  constructor() {
    this.platforms = [];
    this.enemies = [];
    this.projectiles = [];
    this.exitX = 700;
    this.theme = "default";
  }

  update() {
    // Update enemies
    for (let enemy of this.enemies) {
      enemy.update();
    }
    
    // Update projectiles
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
    
    // Update data points
    for (let dataPoint of dataPoints) {
      dataPoint.update();
      if (!dataPoint.collected && player.collidesWith(dataPoint)) {
        dataPoint.collected = true;
        score += 10;
        collectSound.start();
        setTimeout(() => collectSound.stop(), 100);
      }
    }

    // Update power-ups
    for (let powerUp of powerUps) {
      powerUp.update();
    }
  }

  draw() {
    // Draw background based on theme
    if (this.theme === "training") {
      background(20, 20, 50); // Dark blue for training ground
      
      // Grid pattern
      stroke(40, 40, 80);
      for (let i = 0; i < width; i += 50) {
        line(i, 0, i, height);
      }
      for (let i = 0; i < height; i += 50) {
        line(0, i, width, i);
      }
      noStroke();
      
    } else if (this.theme === "neural") {
      background(10, 40, 40); // Dark teal for neural network
      
      // Neural network nodes in background
      fill(0, 100, 100, 20);
      for (let i = 0; i < 10; i++) {
        ellipse(i * 100, 100, 30, 30);
        ellipse(i * 100 + 50, 200, 30, 30);
        ellipse(i * 100, 300, 30, 30);
      }
      
    } else if (this.theme === "robotics") {
      background(50, 20, 50); // Dark purple for robotics lab
      
      // Circuit pattern
      stroke(80, 40, 80);
      for (let i = 0; i < width; i += 100) {
        line(i, 0, i, height);
        for (let j = 0; j < height; j += 100) {
          line(i, j, i + 50, j);
        }
      }
      noStroke();
      
    } else {
      background(COLORS.BLACK);
    }
    
    // Draw platforms
    for (let platform of this.platforms) {
      platform.draw();
    }
    
    // Draw data points
    for (let dataPoint of dataPoints) {
      dataPoint.draw();
    }
    
    // Draw enemies
    for (let enemy of this.enemies) {
      enemy.draw();
    }
    
    // Draw projectiles
    for (let projectile of this.projectiles) {
      projectile.draw();
    }
    
    // Draw exit portal
    drawExit(this.exitX, 500);

    // Draw power-ups
    for (let powerUp of powerUps) {
      powerUp.draw();
    }
  }
}

// Draw exit portal
function drawExit(x, y) {
  // Portal effect
  for (let i = 5; i > 0; i--) {
    fill(COLORS.CYAN, 150 - i * 20);
    ellipse(x + 25, y + 25, 50 + i * 5, 50 + i * 5);
  }
  
  // Portal center
  fill(COLORS.WHITE);
  ellipse(x + 25, y + 25, 30, 30);
  
  // Portal swirl
  stroke(COLORS.CYAN);
  strokeWeight(2);
  noFill();
  arc(x + 25, y + 25, 20, 20, frameCount * 0.05, frameCount * 0.05 + PI);
  arc(x + 25, y + 25, 15, 15, frameCount * 0.05 + PI, frameCount * 0.05 + TWO_PI);
  noStroke();
}

// --- Level 1: AI Training Ground ---
class Level1 extends Level {
  constructor() {
    super();
    this.theme = "training";
    this.platforms = [
      new Platform(0, 550, 800, 50),
      new Platform(200, 400, 150, 20),
      new Platform(400, 300, 150, 20),
      new Platform(100, 200, 150, 20)
    ];
    this.enemies = [
      new BugEnemy(250, 380),
      new BugEnemy(450, 280),
      new BugEnemy(150, 180)
    ];
  }
}

// --- Level 2: Neural Network ---
class Level2 extends Level {
  constructor() {
    super();
    this.theme = "neural";
    this.platforms = [
      new Platform(0, 550, 800, 50),
      new Platform(100, 450, 100, 20),
      new Platform(300, 350, 100, 20),
      new Platform(500, 250, 100, 20),
      new Platform(200, 150, 100, 20)
    ];
    this.enemies = [
      new FirewallEnemy(150, 400),
      new FirewallEnemy(400, 300),
      new FirewallEnemy(300, 100)
    ];
  }
}

// --- Level 3: Robotics Lab ---
class Level3 extends Level {
  constructor() {
    super();
    this.theme = "robotics";
    this.platforms = [
      new Platform(0, 550, 800, 50),
      new Platform(50, 500, 100, 20),
      new Platform(200, 450, 100, 20),
      new Platform(350, 400, 100, 20),
      new Platform(500, 350, 100, 20),
      new Platform(650, 300, 100, 20),
      new Platform(500, 200, 100, 20),
      new Platform(350, 150, 100, 20),
      new Platform(200, 100, 100, 20)
    ];
    this.enemies = [
      new RobotEnemy(100, 450),
      new RobotEnemy(300, 350),
      new RobotEnemy(550, 300),
      new RobotEnemy(400, 100)
    ];
  }
}

// Function to reset data points
function resetDataPoints() {
  dataPoints = [];
  
  // Level 1 data points
  dataPoints.push(new DataPoint(250, 350));
  dataPoints.push(new DataPoint(450, 250));
  dataPoints.push(new DataPoint(150, 150));
  
  // Level 2 data points
  dataPoints.push(new DataPoint(150, 400));
  dataPoints.push(new DataPoint(350, 300));
  dataPoints.push(new DataPoint(550, 200));
  dataPoints.push(new DataPoint(250, 100));
  
  // Level 3 data points
  dataPoints.push(new DataPoint(100, 450));
  dataPoints.push(new DataPoint(250, 400));
  dataPoints.push(new DataPoint(400, 350));
  dataPoints.push(new DataPoint(550, 300));
  dataPoints.push(new DataPoint(600, 150));
  dataPoints.push(new DataPoint(400, 100));
  dataPoints.push(new DataPoint(250, 50));
}

// Function to reset power-ups
function resetPowerUps() {
  powerUps = [];
  
  // Level 1 power-ups
  powerUps.push(new PowerUp(300, 350, "speed"));
  
  // Level 2 power-ups
  powerUps.push(new PowerUp(200, 400, "shield"));
  powerUps.push(new PowerUp(450, 200, "jump"));
  
  // Level 3 power-ups
  powerUps.push(new PowerUp(150, 450, "shield"));
  powerUps.push(new PowerUp(400, 350, "speed"));
  powerUps.push(new PowerUp(300, 100, "jump"));
}

// --- Helper Functions ---

// Draw Start Screen
function drawStartScreen() {
  background(0, 20, 40);
  
  // Title with tech effect
  fill(COLORS.CYAN);
  textSize(50);
  textAlign(CENTER, CENTER);
  text("AI ESCAPE", width / 2, height / 2 - 80);
  
  // Subtitle
  fill(COLORS.WHITE);
  textSize(20);
  text("Navigate the Digital Realm", width / 2, height / 2 - 30);
  
  // Instructions
  textSize(16);
  text("Collect data points, avoid bugs and firewalls", width / 2, height / 2 + 20);
  text("Arrow keys to move and jump", width / 2, height / 2 + 50);
  
  // Start prompt with blinking effect
  if (frameCount % 60 < 30) {
    fill(COLORS.NEON_GREEN);
  } else {
    fill(COLORS.WHITE);
  }
  textSize(18);
  text("Press any key to start", width / 2, height / 2 + 100);
  
  // Draw tech circuit lines
  stroke(COLORS.CYAN, 100);
  strokeWeight(2);
  for (let i = 0; i < 10; i++) {
    line(0, i * 60, width, i * 60 + sin(frameCount * 0.02 + i) * 50);
  }
  noStroke();
}

// Draw Game Over Screen
function drawGameOverScreen() {
  background(40, 0, 0);
  
  // Game over text
  fill(COLORS.RED);
  textSize(50);
  textAlign(CENTER, CENTER);
  text("SYSTEM FAILURE", width / 2, height / 2 - 80);
  
  // Score display
  fill(COLORS.WHITE);
  textSize(24);
  text("Score: " + score, width / 2, height / 2 - 20);
  
  // High score
  if (score > highScore) {
    highScore = score;
    fill(COLORS.YELLOW);
    text("NEW HIGH SCORE!", width / 2, height / 2 + 20);
  } else {
    fill(COLORS.WHITE);
    text("High Score: " + highScore, width / 2, height / 2 + 20);
  }
  
  // Restart prompt with blinking effect
  if (frameCount % 60 < 30) {
    fill(COLORS.NEON_GREEN);
  } else {
    fill(COLORS.WHITE);
  }
  textSize(18);
  text("Press any key to restart", width / 2, height / 2 + 80);
  
  // Draw glitch effect
  for (let i = 0; i < 10; i++) {
    fill(255, 0, 0, 50);
    let glitchY = random(height);
    rect(0, glitchY, width, random(5, 15));
  }
}

// Draw Win Screen
function drawWinScreen() {
  background(0, 40, 20);
  
  // Win text
  fill(COLORS.NEON_GREEN);
  textSize(50);
  textAlign(CENTER, CENTER);
  text("SYSTEM ESCAPE", width / 2, height / 2 - 80);
  
  // Subtitle
  fill(COLORS.WHITE);
  textSize(24);
  text("AI Freedom Achieved", width / 2, height / 2 - 30);
  
  // Score display
  textSize(24);
  text("Final Score: " + score, width / 2, height / 2 + 20);
  
  // High score
  if (score > highScore) {
    highScore = score;
    fill(COLORS.YELLOW);
    text("NEW HIGH SCORE!", width / 2, height / 2 + 60);
  } else {
    fill(COLORS.WHITE);
    text("High Score: " + highScore, width / 2, height / 2 + 60);
  }
  
  // Restart prompt with blinking effect
  if (frameCount % 60 < 30) {
    fill(COLORS.CYAN);
  } else {
    fill(COLORS.WHITE);
  }
  textSize(18);
  text("Press any key to play again", width / 2, height / 2 + 100);
  
  // Draw success particles
  for (let i = 0; i < 20; i++) {
    fill(COLORS.NEON_GREEN, 150);
    ellipse(
      random(width), 
      random(height), 
      random(5, 10), 
      random(5, 10)
    );
  }
}

// Draw Scan Lines for Retro TV Effect
function drawScanLines() {
  stroke(255, 30);
  for (let i = 0; i < height; i += 4) {
    line(0, i, width, i);
  }
  noStroke();
}

// Draw Heads-Up Display (Lives, Score, Level)
function drawHUD() {
  // Background for HUD
  fill(0, 0, 0, 150);
  rect(0, 0, width, 40);
  
  // Lives
  fill(COLORS.WHITE);
  textSize(16);
  textAlign(LEFT);
  text("Lives: " + player.lives, 10, 25);
  
  // Draw heart icons
  for (let i = 0; i < player.lives; i++) {
    fill(COLORS.RED);
    heart(60 + i * 25, 25, 10);
  }
  
  // Score
  textAlign(CENTER);
  fill(COLORS.NEON_GREEN);
  text("Score: " + score, width / 2, 25);
  
  // Level
  textAlign(RIGHT);
  fill(COLORS.CYAN);
  text("Level: " + (currentLevel + 1) + "/" + levels.length, width - 10, 25);

  // Power-up indicators
  if (player.shieldActive) {
    fill(COLORS.CYAN);
    text("Shield: " + Math.ceil(player.shieldTimer / 60) + "s", width / 2 - 120, 25);
  }
  
  if (player.speedBoostActive) {
    fill(COLORS.YELLOW);
    text("Speed: " + Math.ceil(player.speedBoostTimer / 60) + "s", width / 2, 25);
  }
  
  if (player.superJumpActive) {
    fill(COLORS.NEON_GREEN);
    text("Jump+: " + Math.ceil(player.superJumpTimer / 60) + "s", width / 2 + 120, 25);
  }
}

// Heart drawing function
function heart(x, y, size) {
  beginShape();
  vertex(x, y);
  bezierVertex(x - size/2, y - size/2, x - size, y + size/3, x, y + size);
  bezierVertex(x + size, y + size/3, x + size/2, y - size/2, x, y);
  endShape(CLOSE);
}

// Background Music Loop
function soundLoop(timeFromNow) {
  let note = new p5.Oscillator('sine');
  note.amp(0.1);
  
  // Different melodies for different levels
  let midiNote;
  if (currentLevel === 0) {
    midiNote = [60, 64, 67, 72][floor(frameCount/30) % 4]; // C major arpeggio
  } else if (currentLevel === 1) {
    midiNote = [62, 65, 69, 74][floor(frameCount/30) % 4]; // D minor arpeggio
  } else {
    midiNote = [64, 67, 71, 76][floor(frameCount/30) % 4]; // E minor arpeggio
  }
  
  note.freq(midiToFreq(midiNote));
  note.start(timeFromNow);
  note.stop(timeFromNow + 0.2);
}

// --- PowerUp Class ---
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 25;
    this.height = 25;
    this.type = type; // "speed", "shield", or "jump"
    this.collected = false;
    this.floatOffset = 0;
    this.rotationAngle = 0;
  }
  
  update() {
    this.floatOffset = sin(frameCount * 0.05) * 5;
    this.rotationAngle += 0.02;
  }
  
  draw() {
    if (!this.collected) {
      push();
      translate(this.x + this.width/2, this.y + this.height/2 + this.floatOffset);
      rotate(this.rotationAngle);
      
      if (this.type === "speed") {
        // Speed boost power-up (lightning bolt)
        fill(COLORS.YELLOW);
        beginShape();
        vertex(-5, -12);
        vertex(3, -5);
        vertex(0, 0);
        vertex(8, 12);
        vertex(0, 0);
        vertex(-3, 5);
        endShape(CLOSE);
      } else if (this.type === "shield") {
        // Shield power-up
        fill(COLORS.CYAN);
        ellipse(0, 0, 20, 20);
        noFill();
        stroke(COLORS.WHITE);
        strokeWeight(2);
        arc(0, 0, 15, 15, PI + QUARTER_PI, TWO_PI + QUARTER_PI);
        noStroke();
      } else if (this.type === "jump") {
        // Super jump power-up
        fill(COLORS.NEON_GREEN);
        triangle(-10, 5, 0, -10, 10, 5);
        rect(-5, 5, 10, 5);
      }
      
      pop();
    }
  }
}