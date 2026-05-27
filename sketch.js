// ============================================================
// Fantasy Fighting Game
// ============================================================

const STATE_START = "start";
const STATE_FIGHT = "fight";
const STATE_WIN = "win";

let gameState = STATE_START;
let winner = null;

let punchSound;
let killSound;
let winSound;
let bgMusic;

let startBg;
let fightBg;
let winBg;

let fighter1;
let fighter2;
let groundY;

// ============================================================
// FIGHTER CLASS
// ============================================================

class Fighter {
  constructor(x, y, colour, controls, label) {
    this.x = x;
    this.y = y;
    this.vx = 0;

    this.speed = 0.5;
    this.maxSpeed = 4;
    this.friction = 0.78;
    this.r = 28;

    this.colour = colour;
    this.label = label;
    this.blobT = random(100);

    this.controls = controls;

    this.maxHealth = 3;
    this.health = 3;

    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 18;
    this.attackCooldown = 0;

    this.punchReach = 55;
    this.punchDir = 1;

    this.isBlocking = false;
    this.hitFlash = 0;
    this.hitLanded = false;
  }

  update() {
    if (gameState !== STATE_FIGHT) return;

    this.handleInput();
    this.applyPhysics();

    if (this.isAttacking) {
      this.attackTimer--;

      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.hitLanded = false;
        this.attackCooldown = 20;
      }
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    if (this.hitFlash > 0) {
      this.hitFlash--;
    }
  }

  handleInput() {
    if (keyIsDown(this.controls.left)) {
      this.vx -= this.speed;
    }

    if (keyIsDown(this.controls.right)) {
      this.vx += this.speed;
    }

    this.vx = constrain(this.vx, -this.maxSpeed, this.maxSpeed);

    if (!keyIsDown(this.controls.left) && !keyIsDown(this.controls.right)) {
      this.vx *= this.friction;
    }

    this.isBlocking = keyIsDown(this.controls.block);
  }

  applyPhysics() {
    this.x += this.vx;
    this.x = constrain(this.x, this.r, width - this.r);
  }

  startAttack(targetX) {
    if (this.isAttacking || this.attackCooldown > 0) return;

    this.isAttacking = true;
    this.attackTimer = this.attackDuration;
    this.hitLanded = false;

    this.punchDir = targetX > this.x ? 1 : -1;
  }

  getPunchX() {
    return this.x + this.punchDir * this.punchReach;
  }

  takeHit() {
    if (this.isBlocking) return;

    this.health--;
    this.hitFlash = 12;

    if (this.health <= 0) {
      this.health = 0;

      killSound.stop();
      killSound.play();

      setTimeout(() => {
        endGame(this.label === "P1" ? "P2" : "P1");
      }, 500);
    }
  }

  draw() {
    push();

    if (this.isBlocking) {
      noFill();
      stroke(255, 255, 255, 150);
      strokeWeight(3);
      ellipse(this.x, this.y, (this.r + 16) * 2, (this.r + 16) * 2);
    }

    if (this.isAttacking) {
      fill(this.hitFlash > 0 ? color(255) : this.colour);
      noStroke();
      ellipse(this.getPunchX(), this.y, 20, 20);
    }

    fill(this.hitFlash > 0 ? color(255) : this.colour);
    noStroke();

    beginShape();

    let numPoints = 48;

    for (let i = 0; i < numPoints; i++) {
      let angle = (TWO_PI / numPoints) * i;

      let noiseVal = noise(
        cos(angle) * 0.8 + this.blobT,
        sin(angle) * 0.8 + this.blobT
      );

      let r = this.r + map(noiseVal, 0, 1, -7, 7);

      vertex(
        this.x + cos(angle) * r,
        this.y + sin(angle) * r
      );
    }

    endShape(CLOSE);

    fill(10);
    ellipse(this.x - 9, this.y - 7, 8, 8);
    ellipse(this.x + 9, this.y - 7, 8, 8);

    pop();

    this.blobT += 0.015;
  }
}

// ============================================================
// PRELOAD
// ============================================================

function preload() {
  startBg = loadImage("assets/images/start-background.png");
  fightBg = loadImage("assets/images/fight-background.png");
  winBg = loadImage("assets/images/win-background.png");

  punchSound = loadSound("assets/sounds/punch.mp3");
  killSound = loadSound("assets/sounds/kill.mp3");
  winSound = loadSound("assets/sounds/win.mp3");
  bgMusic = loadSound("assets/sounds/music.mp3");
}

// ============================================================
// SETUP
// ============================================================

function setup() {
  createCanvas(800, 450);
  groundY = height - 80;
  setupFighters();
}

// ============================================================
// CREATE FIGHTERS
// ============================================================

function setupFighters() {
  fighter1 = new Fighter(
    200,
    groundY - 28,
    color(0, 200, 180),
    {
      left: 65,
      right: 68,
      attack: 70,
      block: 71
    },
    "P1"
  );

  fighter2 = new Fighter(
    600,
    groundY - 28,
    color(255, 150, 30),
    {
      left: LEFT_ARROW,
      right: RIGHT_ARROW,
      attack: 75,
      block: 76
    },
    "P2"
  );
}

// ============================================================
// DRAW
// ============================================================

function draw() {
  if (gameState === STATE_START) {
    image(startBg, 0, 0, width, height);
    drawStartScreen();
  }

  else if (gameState === STATE_FIGHT) {
    image(fightBg, 0, 0, width, height);

    updateAndDrawFighters();
    checkHits();
    drawHealthBars();
    drawFightHUD();
  }

  else if (gameState === STATE_WIN) {
    image(winBg, 0, 0, width, height);

    fighter1.draw();
    fighter2.draw();

    drawWinScreen();
  }
}

// ============================================================
// MUSIC
// ============================================================

function startMusic() {
  userStartAudio();

  if (!bgMusic.isPlaying()) {
    bgMusic.loop();
  }
}

// ============================================================
// GAME STATE FUNCTIONS
// ============================================================

function startGame() {
  gameState = STATE_FIGHT;
  winner = null;
  setupFighters();
}

function endGame(winnerLabel) {
  gameState = STATE_WIN;
  winner = winnerLabel;

  bgMusic.stop();

  winSound.stop();
  winSound.play();
}

// ============================================================
// START SCREEN
// ============================================================

function drawStartScreen() {
  fill(0, 0, 0, 120);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER);

  textFont("cursive");
  textSize(64);
  text("Blob Brawl", width / 2, height / 2 - 65);

  textFont("sans-serif");

  fill(230);
  textSize(18);
  text("First to land 3 hits wins", width / 2, height / 2 - 20);

  textSize(14);

  fill(0, 255, 220);
  text("P1: A/D move   F attack   G block", width / 2, height / 2 + 30);

  fill(255, 180, 60);
  text("P2: Arrows move   K attack   L block", width / 2, height / 2 + 55);

  fill(255);
  textSize(16);
  text("Press any key for music", width / 2, height / 2 + 95);
  text("Press ENTER to start", width / 2, height / 2 + 120);
}

// ============================================================
// WIN SCREEN
// ============================================================

function drawWinScreen() {
  fill(0, 0, 0, 130);
  rect(0, 0, width, height);

  fill(winner === "P1" ? color(0, 255, 220) : color(255, 180, 60));

  textAlign(CENTER);
  textSize(56);
  textFont("sans-serif");
  text(winner + " WINS!", width / 2, height / 2 - 30);

  fill(255);
  textSize(18);
  text("Press ENTER to rematch", width / 2, height / 2 + 40);
}

// ============================================================
// UPDATE + DRAW
// ============================================================

function updateAndDrawFighters() {
  fighter1.update();
  fighter2.update();

  fighter1.draw();
  fighter2.draw();
}

// ============================================================
// HIT DETECTION
// ============================================================

function checkHits() {
  if (fighter1.isAttacking && !fighter1.hitLanded) {
    let fistX = fighter1.getPunchX();
    let dist = abs(fistX - fighter2.x);

    if (dist < fighter2.r + 10) {
      punchSound.stop();
      punchSound.play();

      fighter2.takeHit();
      fighter1.hitLanded = true;
    }
  }

  if (fighter2.isAttacking && !fighter2.hitLanded) {
    let fistX = fighter2.getPunchX();
    let dist = abs(fistX - fighter1.x);

    if (dist < fighter1.r + 10) {
      punchSound.stop();
      punchSound.play();

      fighter1.takeHit();
      fighter2.hitLanded = true;
    }
  }
}

// ============================================================
// HEALTH BARS
// ============================================================

function drawHealthBars() {
  let barW = 200;
  let barH = 18;
  let barY = 45;
  let padding = 30;

  let p1W = map(fighter1.health, 0, fighter1.maxHealth, 0, barW);

  fill(40);
  rect(padding, barY, barW, barH, 4);

  fill(0, 200, 180);
  rect(padding, barY, p1W, barH, 4);

  let p2W = map(fighter2.health, 0, fighter2.maxHealth, 0, barW);

  fill(40);
  rect(width - padding - barW, barY, barW, barH, 4);

  fill(255, 150, 30);
  rect(width - padding - p2W, barY, p2W, barH, 4);

  fill(255);
  textSize(13);
  noStroke();

  textAlign(LEFT);
  text("P1", padding, barY - 5);

  textAlign(RIGHT);
  text("P2", width - padding, barY - 5);
}

// ============================================================
// HUD
// ============================================================

function drawFightHUD() {
  noStroke();
  fill(255);
  textSize(12);
  textFont("sans-serif");

  textAlign(LEFT);
  text("A/D move   F attack   G block", 16, height - 12);

  textAlign(RIGHT);
  text("Arrows move   K attack   L block", width - 16, height - 12);
}

// ============================================================
// KEYS
// ============================================================

function keyPressed() {
  startMusic();

  if (keyCode === ENTER) {
    if (gameState === STATE_START || gameState === STATE_WIN) {
      startGame();
    }
  }

  if (keyCode === 70 && gameState === STATE_FIGHT) {
    fighter1.startAttack(fighter2.x);
  }

  if (keyCode === 75 && gameState === STATE_FIGHT) {
    fighter2.startAttack(fighter1.x);
  }
}