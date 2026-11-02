
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1500;
canvas.height = 800;

// HTML elementleri
const mainMenu = document.getElementById("mainMenu");
const gameContainer = document.getElementById("gameContainer");
const startButton = document.getElementById("startButton");

const scoreText = document.getElementById("score");
const healthText = document.getElementById("health");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScore = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");
const menuButton = document.getElementById("menuButton");

// Duraklatma elementleri
const pauseButton = document.getElementById("pauseButton");
const pauseScreen = document.getElementById("pauseScreen");
const resumeButton = document.getElementById("resumeButton");
const pauseMenuButton = document.getElementById("pauseMenuButton");

// Müzik elementleri
const music1 = document.getElementById("music1");
const music2 = document.getElementById("music2");
const musicButton = document.getElementById("musicButton");

const musicTracks = [music1, music2];

let currentMusicIndex = 0;
let musicEnabled = true;

music1.volume = 0.35;
music2.volume = 0.35;

// Mobil kontrol elementleri
const joystickArea = document.getElementById("joystickArea");
const joystickStick = document.getElementById("joystickStick");
const fireButton = document.getElementById("fireButton");
const orientationWarning = document.getElementById("orientationWarning");

// Mobil kontrol değişkenleri
let joystickActive = false;
let joystickPointerId = null;
let joystickX = 0;
let joystickY = 0;
let firePointerId = null;

const joystickMaxDistance = 38;

// MOBİL NİŞAN DEĞİŞKENLERİ
let mobileAimAngle = 0;
const mobileAimDistance = 200;
const isMobileDevice = window.matchMedia("(pointer: coarse)").matches;

// Karakter görselleri
const characterImages = {
    player: new Image(),
    ellie: new Image(),
    joel: new Image()
};

characterImages.player.src = "images/player.png";
characterImages.ellie.src = "images/ellie.png";
characterImages.joel.src = "images/joel.png";

// Seçilen karakter
let selectedCharacter = "player";
let playerImage = characterImages.player;

// Silahlar
const weapons = {
    pistol: {
        name: "Tabanca",
        cooldown: 18,
        type: "single"
    },
    shotgun: {
        name: "Pompalı",
        cooldown: 45,
        type: "spread"
    },
    rifle: {
        name: "Taramalı",
        cooldown: 6,
        type: "automatic"
    }
};

let selectedWeapon = "pistol";
let fireCooldown = 0;
let mouseDown = false;

// Zombi fotoğrafları
const zombieImages = [];

for (let i = 1; i <= 3; i++) {
    const image = new Image();
    image.src = `images/zombie${i}.png`;
    zombieImages.push(image);
}

// Oyun değişkenleri
let score = 0;
let frame = 0;
let gameOver = false;
let gameStarted = false;
let isPaused = false;

let animationFrameId = null;

let zombies = [];
let bullets = [];
let keys = [];

let mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

// Oyuncu
const player = {
    x: 580,
    y: 380,
    width: 40,
    height: 40,
    speed: 3.5,
    health: 100,
    damageCooldown: 0
};

// MÜZİK SİSTEMİ
function playCurrentMusic() {
    if (!musicEnabled || !gameStarted || isPaused || gameOver) return;

    const currentMusic = musicTracks[currentMusicIndex];

    currentMusic.play().catch((error) => {
        console.log("Müzik başlatılamadı:", error);
    });
}

function startGameMusic() {
    stopGameMusic();

    currentMusicIndex = 0;

    if (musicEnabled) {
        playCurrentMusic();
    }
}

function stopGameMusic() {
    musicTracks.forEach((music) => {
        music.pause();
        music.currentTime = 0;
    });
}

musicTracks.forEach((music, index) => {
    music.addEventListener("ended", () => {
        if (!gameStarted || gameOver || isPaused || !musicEnabled) return;

        currentMusicIndex = (index + 1) % musicTracks.length;
        playCurrentMusic();
    });
});

function toggleMusic() {
    musicEnabled = !musicEnabled;

    if (musicEnabled) {
        musicButton.textContent = "🔊";

        if (gameStarted && !gameOver && !isPaused) {
            playCurrentMusic();
        }
    } else {
        musicButton.textContent = "🔇";

        musicTracks.forEach((music) => {
            music.pause();
        });
    }
}

musicButton.addEventListener("click", toggleMusic);

// KARAKTER SEÇİMİ
document.querySelectorAll("[data-character]").forEach((card) => {
    card.addEventListener("click", () => {
        document.querySelectorAll("[data-character]").forEach((item) => {
            item.classList.remove("selected");
        });

        card.classList.add("selected");

        selectedCharacter = card.dataset.character;
        playerImage = characterImages[selectedCharacter];
    });
});

// SİLAH SEÇİMİ
document.querySelectorAll("[data-weapon]").forEach((card) => {
    card.addEventListener("click", () => {
        document.querySelectorAll("[data-weapon]").forEach((item) => {
            item.classList.remove("selected");
        });

        card.classList.add("selected");

        selectedWeapon = card.dataset.weapon;
    });
});

// MOBİL JOYSTICK
function updateJoystick(e) {
    const rect = joystickArea.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > joystickMaxDistance) {
        dx = (dx / distance) * joystickMaxDistance;
        dy = (dy / distance) * joystickMaxDistance;
    }

    joystickX = dx / joystickMaxDistance;
    joystickY = dy / joystickMaxDistance;

    joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
}

function resetJoystick() {
    joystickActive = false;
    joystickPointerId = null;
    joystickX = 0;
    joystickY = 0;

    joystickStick.style.transform = "translate(0, 0)";
}

joystickArea.addEventListener("pointerdown", (e) => {
    if (!gameStarted || gameOver || isPaused) return;

    e.preventDefault();

    joystickActive = true;
    joystickPointerId = e.pointerId;

    joystickArea.setPointerCapture(e.pointerId);
    updateJoystick(e);
});

joystickArea.addEventListener("pointermove", (e) => {
    if (e.pointerId !== joystickPointerId) return;

    e.preventDefault();
    updateJoystick(e);
});

joystickArea.addEventListener("pointerup", (e) => {
    if (e.pointerId === joystickPointerId) {
        resetJoystick();
    }
});

joystickArea.addEventListener("pointercancel", (e) => {
    if (e.pointerId === joystickPointerId) {
        resetJoystick();
    }
});

// MOBİL ATEŞ BUTONU
fireButton.addEventListener("pointerdown", (e) => {
    if (!gameStarted || gameOver || isPaused) return;

    e.preventDefault();

    firePointerId = e.pointerId;
    fireButton.setPointerCapture(e.pointerId);

    mouseDown = true;

    if (selectedWeapon !== "rifle" && fireCooldown <= 0) {
        shootBullet();
        fireCooldown = weapons[selectedWeapon].cooldown;
    }
});

function releaseFire(e) {
    if (e && e.pointerId !== firePointerId) return;

    mouseDown = false;
    firePointerId = null;
}

fireButton.addEventListener("pointerup", releaseFire);
fireButton.addEventListener("pointercancel", releaseFire);
fireButton.addEventListener("lostpointercapture", releaseFire);

// DOKUNMATİK NİŞAN ALMA
function updateTouchAim(e) {
    const rect = canvas.getBoundingClientRect();

    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
}

canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    if (!gameStarted || gameOver || isPaused) return;

    e.preventDefault();

    canvas.setPointerCapture(e.pointerId);
    updateTouchAim(e);
});

canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "touch") return;
    if (!gameStarted || gameOver || isPaused) return;

    e.preventDefault();
    updateTouchAim(e);
});

// MOBİLDE JOYSTICK YÖNÜNE GÖRE NİŞAN
function updateMobileAim() {
    if (!isMobileDevice) return;

    // Joystick hareket ediyorsa yeni nişan açısını belirle
    const directionStrength = Math.sqrt(
        joystickX * joystickX + joystickY * joystickY
    );

    if (joystickActive && directionStrength > 0.15) {
        mobileAimAngle = Math.atan2(joystickY, joystickX);
    }

    // Nişan noktasını oyuncunun çevresinde tut
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    mouse.x = centerX + Math.cos(mobileAimAngle) * mobileAimDistance;
    mouse.y = centerY + Math.sin(mobileAimAngle) * mobileAimDistance;
}

// OYUNU BAŞLAT
function startGame() {
    stopAnimation();

    mainMenu.classList.add("hidden");
    gameContainer.classList.remove("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");

    resetGame();

    gameStarted = true;
    isPaused = false;

    startGameMusic();
    updateOrientationWarning();

    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(() => {
            console.log("Yatay ekran kilidi desteklenmiyor.");
        });
    }

    gameLoop();
}

startButton.addEventListener("click", startGame);

// KLAVYE KONTROLLERİ
window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// FARE KONUMU
canvas.addEventListener("mousemove", (e) => {
    if (isMobileDevice) return;

    const rect = canvas.getBoundingClientRect();

    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
});

// BİLGİSAYARDA ATEŞ ETME
canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0 || !gameStarted || gameOver || isPaused) return;

    mouseDown = true;

    if (selectedWeapon !== "rifle" && fireCooldown <= 0) {
        shootBullet();
        fireCooldown = weapons[selectedWeapon].cooldown;
    }
});

window.addEventListener("mouseup", () => {
    mouseDown = false;
});

canvas.addEventListener("mouseleave", () => {
    mouseDown = false;
});

// MERMİ OLUŞTURMA
function shootBullet() {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    const angle = Math.atan2(
        mouse.y - centerY,
        mouse.x - centerX
    );

    const weapon = weapons[selectedWeapon];

    if (weapon.type === "spread") {
        const spreadAngles = [-0.18, 0, 0.18];

        for (const spread of spreadAngles) {
            createBullet(centerX, centerY, angle + spread);
        }
    } else {
        createBullet(centerX, centerY, angle);
    }
}

function createBullet(x, y, angle) {
    bullets.push({
        x: x,
        y: y,
        dx: Math.cos(angle) * 8,
        dy: Math.sin(angle) * 8,
        radius: 5
    });
}

// OTOMATİK ATEŞ
function handleAutomaticFire() {
    if (fireCooldown > 0) {
        fireCooldown--;
    }

    if (
        selectedWeapon === "rifle" &&
        mouseDown &&
        fireCooldown <= 0
    ) {
        shootBullet();
        fireCooldown = weapons.rifle.cooldown;
    }
}

// OYUNCU HAREKETİ
function movePlayer() {
    let moveX = 0;
    let moveY = 0;

    // Bilgisayar klavyesi
    if (keys["w"] || keys["arrowup"]) moveY -= 1;
    if (keys["s"] || keys["arrowdown"]) moveY += 1;
    if (keys["a"] || keys["arrowleft"]) moveX -= 1;
    if (keys["d"] || keys["arrowright"]) moveX += 1;

    // Mobil joystick
    if (joystickActive) {
        moveX += joystickX;
        moveY += joystickY;
    }

    const distance = Math.sqrt(moveX * moveX + moveY * moveY);

    if (distance > 1) {
        moveX /= distance;
        moveY /= distance;
    }

    player.x += moveX * player.speed;
    player.y += moveY * player.speed;

    player.x = Math.max(
        0,
        Math.min(canvas.width - player.width, player.x)
    );

    player.y = Math.max(
        0,
        Math.min(canvas.height - player.height, player.y)
    );

    // Mobilde hareket yönünü aynı zamanda nişan yönü yap
    updateMobileAim();
}

// OYUNCUYU ÇİZME
function drawPlayer() {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    const size = 65;

    const angle = Math.atan2(
        mouse.y - centerY,
        mouse.x - centerX
    );

    ctx.save();

    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.clip();

    if (playerImage.complete && playerImage.naturalWidth > 0) {
        ctx.drawImage(
            playerImage,
            centerX - size / 2,
            centerY - size / 2,
            size,
            size
        );
    } else {
        ctx.fillStyle = "#4caf50";
        ctx.fillRect(
            centerX - size / 2,
            centerY - size / 2,
            size,
            size
        );
    }

    ctx.restore();

    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
        centerX + Math.cos(angle) * 35,
        centerY + Math.sin(angle) * 35
    );

    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.stroke();
}

// ZOMBİ OLUŞTURMA
function spawnZombie() {
    const side = Math.floor(Math.random() * 4);

    let x;
    let y;

    if (side === 0) {
        x = Math.random() * canvas.width;
        y = -30;
    } else if (side === 1) {
        x = canvas.width + 30;
        y = Math.random() * canvas.height;
    } else if (side === 2) {
        x = Math.random() * canvas.width;
        y = canvas.height + 30;
    } else {
        x = -30;
        y = Math.random() * canvas.height;
    }

    const randomNumber = Math.random();

    let randomIndex;

    if (randomNumber < 0.60) {
        randomIndex = 0;
    } else if (randomNumber < 0.90) {
        randomIndex = 1;
    } else {
        randomIndex = 2;
    }

    const randomImage = zombieImages[randomIndex];

    const zombieSize = randomIndex === 2 ? 65 : 48;
    const zombieHealth = randomIndex + 1;

    zombies.push({
        x: x,
        y: y,
        size: zombieSize,
        speed: randomIndex === 2 ? 0.45 : 0.6,
        image: randomImage,
        health: zombieHealth,
        maxHealth: zombieHealth,
        isBoss: randomIndex === 2,
        hitFlash: 0
    });
}

// ZOMBİ HAREKETİ
function moveZombies() {
    for (const zombie of zombies) {
        const dx = player.x + player.width / 2 - zombie.x;
        const dy = player.y + player.height / 2 - zombie.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            zombie.x += (dx / distance) * zombie.speed;
            zombie.y += (dy / distance) * zombie.speed;
        }
    }
}

// ZOMBİLERİ ÇİZME
function drawZombies() {
    for (const zombie of zombies) {
        const size = zombie.size;

        if (
            zombie.image.complete &&
            zombie.image.naturalWidth > 0
        ) {
            ctx.drawImage(
                zombie.image,
                zombie.x - size / 2,
                zombie.y - size / 2,
                size,
                size
            );
        } else {
            ctx.fillStyle = "#a52a2a";
            ctx.fillRect(
                zombie.x - size / 2,
                zombie.y - size / 2,
                size,
                size
            );
        }

        if (zombie.hitFlash > 0) {
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = "#ff0000";

            ctx.beginPath();
            ctx.arc(
                zombie.x,
                zombie.y,
                size / 2,
                0,
                Math.PI * 2
            );

            ctx.fill();
            ctx.restore();

            zombie.hitFlash--;
        }

        const barWidth = zombie.isBoss ? 65 : 45;
        const barHeight = 6;

        const barX = zombie.x - barWidth / 2;
        const barY = zombie.y - size / 2 - 12;

        ctx.fillStyle = "#333";
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = zombie.isBoss ? "#ff0000" : "#4caf50";

        ctx.fillRect(
            barX,
            barY,
            barWidth * (zombie.health / zombie.maxHealth),
            barHeight
        );
    }
}

// MERMİLERİ HAREKET ETTİRME
function moveBullets() {
    for (const bullet of bullets) {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
    }

    bullets = bullets.filter((bullet) => {
        return (
            bullet.x > 0 &&
            bullet.x < canvas.width &&
            bullet.y > 0 &&
            bullet.y < canvas.height
        );
    });
}

// MERMİLERİ ÇİZME
function drawBullets() {
    for (const bullet of bullets) {
        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#ffff00";
        ctx.fill();
    }
}

// ÇARPIŞMALARI KONTROL ETME
function checkCollisions() {
    for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];

        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];

            const dx = zombie.x - bullet.x;
            const dy = zombie.y - bullet.y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < zombie.size / 2 + bullet.radius) {
                zombie.health--;
                zombie.hitFlash = 8;

                bullets.splice(j, 1);

                if (zombie.health <= 0) {
                    zombies.splice(i, 1);

                    score += zombie.isBoss ? 50 : 10;
                    scoreText.textContent = score;
                }

                break;
            }
        }
    }

    if (player.damageCooldown > 0) {
        player.damageCooldown--;
    }

    for (const zombie of zombies) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        const dx = zombie.x - playerCenterX;
        const dy = zombie.y - playerCenterY;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (
            distance < zombie.size / 2 + player.width / 2 &&
            player.damageCooldown <= 0
        ) {
            player.health -= 10;
            player.damageCooldown = 60;

            if (player.health <= 0) {
                player.health = 0;
                healthText.textContent = 0;
                endGame();
            } else {
                healthText.textContent = player.health;
            }

            break;
        }
    }
}

// OYUN BİTTİĞİNDE
function endGame() {
    if (gameOver) return;

    gameOver = true;
    mouseDown = false;

    resetJoystick();
    firePointerId = null;

    stopAnimation();
    stopGameMusic();

    finalScore.textContent = score;
    gameOverScreen.classList.remove("hidden");
}

// ARKA PLAN
function drawBackground() {
    ctx.fillStyle = "#182018";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// ANİMASYONU DURDURMA
function stopAnimation() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// OYUNU SIFIRLAMA
function resetGame() {
    player.x = 580;
    player.y = 380;
    player.health = 100;
    player.damageCooldown = 0;

    zombies = [];
    bullets = [];

    score = 0;
    frame = 0;
    fireCooldown = 0;
    gameOver = false;
    isPaused = false;
    mouseDown = false;
    keys = [];

    mobileAimAngle = 0;

    resetJoystick();
    firePointerId = null;

    scoreText.textContent = score;
    healthText.textContent = player.health;
    finalScore.textContent = score;

    updateMobileAim();
}

// OYUN DÖNGÜSÜ
function gameLoop() {
    if (gameOver || !gameStarted || isPaused) return;

    frame++;

    drawBackground();
    movePlayer();
    handleAutomaticFire();

    if (frame % 100 === 0) {
        spawnZombie();
    }

    moveZombies();
    moveBullets();
    checkCollisions();

    drawPlayer();
    drawZombies();
    drawBullets();

    if (!gameOver && gameStarted && !isPaused) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// YENİDEN BAŞLATMA
function restartGame() {
    stopAnimation();

    resetGame();

    gameStarted = true;
    isPaused = false;

    pauseScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    startGameMusic();
    updateOrientationWarning();

    gameLoop();
}

restartButton.addEventListener("click", restartGame);

// DURAKLATMA
function pauseGame() {
    if (!gameStarted || gameOver || isPaused) return;

    isPaused = true;
    mouseDown = false;
    keys = [];

    resetJoystick();
    firePointerId = null;

    stopAnimation();

    musicTracks.forEach((music) => {
        music.pause();
    });

    pauseScreen.classList.remove("hidden");
}

pauseButton.addEventListener("click", pauseGame);

// OYUNA DEVAM ETME
function resumeGame() {
    if (!isPaused || gameOver || !gameStarted) return;

    isPaused = false;
    pauseScreen.classList.add("hidden");

    if (musicEnabled) {
        playCurrentMusic();
    }

    gameLoop();
}

resumeButton.addEventListener("click", resumeGame);

// ANA MENÜYE DÖNME
function returnToMenu() {
    stopAnimation();
    stopGameMusic();

    gameStarted = false;
    gameOver = false;
    isPaused = false;
    mouseDown = false;
    keys = [];

    resetJoystick();
    firePointerId = null;

    gameContainer.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    orientationWarning.classList.add("hidden");

    mainMenu.classList.remove("hidden");

    if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
    }
}

pauseMenuButton.addEventListener("click", returnToMenu);
menuButton.addEventListener("click", returnToMenu);

// YATAY EKRAN KONTROLÜ
function updateOrientationWarning() {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;

    if (isMobile && isPortrait && gameStarted) {
        orientationWarning.classList.remove("hidden");
    } else {
        orientationWarning.classList.add("hidden");
    }
}

window.addEventListener("resize", updateOrientationWarning);
window.addEventListener("orientationchange", updateOrientationWarning);
