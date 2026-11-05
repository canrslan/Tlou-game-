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
const ammoText = document.getElementById("ammo");
const waveText = document.getElementById("wave");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScore = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");
const menuButton = document.getElementById("menuButton");

// Duraklatma elementleri
const pauseButton = document.getElementById("pauseButton");
const pauseScreen = document.getElementById("pauseScreen");
const resumeButton = document.getElementById("resumeButton");
const pauseMenuButton = document.getElementById("pauseMenuButton");

// Ses butonu (silah seslerini açar/kapatır)
const soundButton = document.getElementById("musicButton");

let soundEnabled = true;

// Mobil kontrol elementleri
const joystickArea = document.getElementById("joystickArea");
const joystickStick = document.getElementById("joystickStick");
const fireButton = document.getElementById("fireButton");
const reloadButton = document.getElementById("reloadButton");
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
// cooldown: iki atış arası kare sayısı (60 kare = 1 saniye)
// magSize: şarjör kapasitesi, reloadTime: doldurma süresi (kare)
const weapons = {
    pistol: {
        name: "Tabanca",
        cooldown: 18,
        type: "single",
        magSize: 12,
        reloadTime: 80,
        reserveStart: 36,
        reserveMax: 72,
        pickupAmount: 12
    },
    shotgun: {
        name: "Pompalı",
        cooldown: 45,
        type: "spread",
        magSize: 6,
        reloadTime: 110,
        reserveStart: 18,
        reserveMax: 36,
        pickupAmount: 6
    },
    rifle: {
        name: "Taramalı",
        cooldown: 6,
        type: "automatic",
        magSize: 30,
        reloadTime: 120,
        reserveStart: 90,
        reserveMax: 180,
        pickupAmount: 30
    }
};

let selectedWeapon = "pistol";
let fireCooldown = 0;
let mouseDown = false;

// Mermi / şarjör durumu
let ammo = weapons.pistol.magSize;
let reloading = false;
let reloadTimer = 0;
let reserveAmmo = weapons.pistol.reserveStart; // yedek mermi

// Yerden toplanabilen eşyalar ve süzülen yazılar
let pickups = [];
let floatingTexts = [];
let noAmmoMessageTimer = 0;

// Patlamalar ve parçacıkları
let explosions = [];
let particles = [];
let bombs = [];

// Harita: engeller (ağaç, kaya) ve önceden çizilmiş zemin
let obstacles = [];
let mapCanvas = null;

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
let keys = {};

// ZORLUK AYARLARI (oyunu zorlaştırmak/kolaylaştırmak için sadece bunları değiştir)
const difficulty = {
    // Zombi hızları (oyuncu hızı 3.5)
    speed: { normal: 1.2, fast: 1.8, boss: 0.9 },
    // Başlangıç canları
    health: { normal: 1, fast: 2, boss: 6 },

    speedPerWave: 0.05,       // her dalgada hız artışı (%5)
    maxSpeedMultiplier: 1.6,  // hız artışı için üst sınır
    contactDamage: 15,        // zombi dokununca giden can

    // Büyük zombi ölünce patlar
    bossExplosion: {
        radius: 170,          // patlamanın etki mesafesi (piksel)
        damage: 30            // tam merkezdeki hasar, kenara doğru azalır
    },

    // Büyük zombinin attığı yeşil bomba
    bossBomb: {
        cooldown: 300,        // iki bomba arası (kare, 300 = 5 saniye)
        minCooldown: 180,     // ileri dalgalarda en kısa bekleme
        flightTime: 75,       // havada kalma süresi (75 kare = 1.25 saniye)
        radius: 85,           // küçük patlama alanı
        damage: 15,
        range: 700            // bu mesafeden uzaktaysa bomba atmaz
    },

    waveBase: 5,              // 1. dalga zombi sayısı = waveBase + dalga * waveGrowth
    waveGrowth: 4,
    spawnDelayStart: 80,      // zombiler arası bekleme (kare)
    spawnDelayDrop: 6,        // her dalgada bekleme ne kadar kısalır
    spawnDelayMin: 15,        // en kısa bekleme
    groupEvery: 5             // her 5 dalgada aynı anda bir zombi daha çıkar
};

// Dalga sistemi değişkenleri
let wave = 1;
let waveTotal = 0;       // bu dalgada çıkacak toplam zombi
let waveSpawned = 0;     // şimdiye kadar çıkan zombi
let spawnTimer = 0;      // bir sonraki zombiye kalan kare
let waveBreakTimer = 0;  // dalgalar arası mola (0 = dalga aktif)

// Ekranda kısa süre görünen yazı (DALGA 2 gibi)
let bannerText = "";
let bannerTimer = 0;
let bannerDuration = 1;

// Sabit zaman adımı (her ekranda aynı hız)
const STEP = 1000 / 60;
let lastTime = null;
let accumulator = 0;

let mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

// Oyuncu
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height / 2 - 20,
    width: 40,
    height: 40,
    speed: 3.5,
    health: 100,
    damageCooldown: 0
};

// SES AÇ / KAPAT
function toggleSound() {
    soundEnabled = !soundEnabled;
    soundButton.textContent = soundEnabled ? "🔊" : "🔇";
}

soundButton.addEventListener("click", toggleSound);

// SES EFEKTLERİ (dosya yok, sesler kodla üretiliyor)
let audioCtx = null;
let masterGain = null;
let noiseBuffer = null;

// Tarayıcılar sesi ancak kullanıcı tıkladıktan sonra açar, o yüzden oyun başlarken çağrılır
function initAudio() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        audioCtx = new AudioContextClass();

        // Çok sesli silahlar patlamasın diye sıkıştırıcı
        const compressor = audioCtx.createDynamicsCompressor();
        compressor.connect(audioCtx.destination);

        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.8;
        masterGain.connect(compressor);

        // 1 saniyelik rastgele gürültü (patlama sesinin ham maddesi)
        noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
        const data = noiseBuffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

// Gürültü patlaması: barut çatlaması / gümbürtüsü
function playNoise(duration, filterType, freqStart, freqEnd, gain) {
    const now = audioCtx.currentTime;

    const source = audioCtx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freqStart, now);
    filter.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);

    const volume = audioCtx.createGain();
    volume.gain.setValueAtTime(gain, now);
    volume.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(volume);
    volume.connect(masterGain);

    source.start(now, Math.random() * 0.5);
    source.stop(now + duration + 0.02);
}

// Alçak "tok" ses: silahın geri tepmesi / bas vuruşu
function playThump(duration, freqStart, freqEnd, gain) {
    const now = audioCtx.currentTime;

    const oscillator = audioCtx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freqStart, now);
    oscillator.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);

    const volume = audioCtx.createGain();
    volume.gain.setValueAtTime(gain, now);
    volume.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(volume);
    volume.connect(masterGain);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
}

// Silah türüne göre ateş sesi
function playShotSound(weaponName) {
    // Ses butonu kapalıysa efekt çalmaz
    if (!soundEnabled || !audioCtx) return;

    // Her atışta sesi çok az değiştir, makineli tüfek robot gibi çıkmasın
    const variation = 0.92 + Math.random() * 0.16;

    if (weaponName === "pistol") {
        // Keskin ve kısa çatlama
        playNoise(0.1, "bandpass", 2400 * variation, 700, 0.5);
        playThump(0.09, 220 * variation, 70, 0.55);
    } else if (weaponName === "shotgun") {
        // Geniş, gürleyen patlama
        playNoise(0.45, "lowpass", 3500 * variation, 250, 0.9);
        playNoise(0.07, "highpass", 2500, 1200, 0.5);
        playThump(0.3, 130 * variation, 35, 0.9);
    } else if (weaponName === "rifle") {
        // Seri atışta rahatsız etmeyecek kısa ve hafif ses
        playNoise(0.06, "bandpass", 3000 * variation, 900, 0.35);
        playThump(0.05, 260 * variation, 100, 0.35);
    }
}

// KARAKTER BİLGİLERİ (menüdeki bilgi kutusunda gösterilir, yazıları buradan değiştirebilirsin)
const characterProfiles = {
    player: {
        name: "Can",
        role: "Hayatta Kalan",
        story: "Salgın başladığında şehri geride bırakıp ayakta kalmayı tek başına öğrenen, sakin ve soğukkanlı bir hayatta kalan. Yıllarca kimseye güvenmeden yaşamak ona dikkatli olmayı öğretti. Şimdi geriye kalan son güvenli bölgeyi korumak için silahını eline aldı."
    },
    ellie: {
        name: "Ellie",
        role: "Genç Savaşçı",
        story: "Salgından sonra doğan Ellie, çocukluğunu yıkık bir dünyanın askeri okulunda geçirdi. Enfeksiyona karşı bağışık çıkınca hayatı bir anda herkesin umudu haline geldi. Keskin zekâsı, alaycı mizahı ve inadıyla en tehlikeli yerlerde bile pes etmiyor."
    },
    joel: {
        name: "Joel",
        role: "Kaçakçı",
        story: "Salgının ilk gecesinde en büyük kaybını yaşayan Joel, yıllar sonra karantina bölgelerinde kaçakçılık yapan sert ve kayıtsız bir adama dönüştü. Ağır bir yolculuğu üstlenmek zorunda kalınca, yaşadıklarının yükünü bir kez daha taşımayı öğrenmesi gerekti."
    }
};

const characterInfoName = document.getElementById("characterInfoName");
const characterInfoRole = document.getElementById("characterInfoRole");
const characterInfoStory = document.getElementById("characterInfoStory");
const characterInfoBox = document.getElementById("characterInfo");

function updateCharacterInfo(characterKey) {
    const profile = characterProfiles[characterKey];

    if (!profile) return;

    characterInfoName.textContent = profile.name;
    characterInfoRole.textContent = profile.role;
    characterInfoStory.textContent = profile.story;

    // Kutudaki geçiş animasyonunu her seçimde yeniden başlat
    characterInfoBox.style.animation = "none";
    void characterInfoBox.offsetWidth;
    characterInfoBox.style.animation = "";
}

// SON SEÇİMİ HATIRLAMA (tarayıcıda saklanır)
function saveChoice(name, value) {
    try {
        localStorage.setItem("zombieSurvival_" + name, value);
    } catch (error) {
        // Saklama kapalıysa (gizli sekme gibi) sorun değil, oyun yine çalışır
    }
}

function loadChoice(name) {
    try {
        return localStorage.getItem("zombieSurvival_" + name);
    } catch (error) {
        return null;
    }
}

// KARAKTER SEÇİMİ
function selectCharacter(key, save = true) {
    if (!characterProfiles[key]) return;

    document.querySelectorAll("[data-character]").forEach((item) => {
        item.classList.toggle("selected", item.dataset.character === key);
    });

    selectedCharacter = key;
    playerImage = characterImages[key];

    updateCharacterInfo(key);

    if (save) saveChoice("character", key);
}

document.querySelectorAll("[data-character]").forEach((card) => {
    card.addEventListener("click", () => {
        selectCharacter(card.dataset.character);
    });
});

// SİLAH SEÇİMİ
function selectWeapon(key, save = true) {
    if (!weapons[key]) return;

    document.querySelectorAll("[data-weapon]").forEach((item) => {
        item.classList.toggle("selected", item.dataset.weapon === key);
    });

    selectedWeapon = key;

    if (save) saveChoice("weapon", key);
}

document.querySelectorAll("[data-weapon]").forEach((card) => {
    card.addEventListener("click", () => {
        selectWeapon(card.dataset.weapon);
    });
});

// SİLAH ÖZELLİK ÇUBUKLARI (değerler weapons verisinden hesaplanır,
// silah dengesini değiştirirsen çubuklar kendiliğinden güncellenir)
function renderWeaponStats() {
    document.querySelectorAll("[data-stats]").forEach((box) => {
        const weapon = weapons[box.dataset.stats];

        if (!weapon) return;

        // Pompalı bir atışta 3 saçma çıkarır (shootBullet içindeki spreadAngles)
        const pelletsPerShot = weapon.type === "spread" ? 3 : 1;

        const stats = [
            ["Hasar", pelletsPerShot / 3],
            ["Hız", 60 / weapon.cooldown / 10],
            ["Şarjör", weapon.magSize / 30],
            ["Dolum", 60 / weapon.reloadTime]
        ];

        box.innerHTML = stats.map(([label, ratio]) => {
            const percent = Math.max(6, Math.min(100, Math.round(ratio * 100)));

            return `<span class="stat-row">
                <span class="stat-label">${label}</span>
                <span class="stat-bar"><span class="stat-fill" style="width:${percent}%"></span></span>
            </span>`;
        }).join("");
    });
}

renderWeaponStats();

// Menü açılınca son seçilenleri geri yükle (yoksa varsayılanlar kalır)
selectCharacter(loadChoice("character") || selectedCharacter, false);
selectWeapon(loadChoice("weapon") || selectedWeapon, false);

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

    if (selectedWeapon !== "rifle") {
        tryShoot();
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

// MOBİL YENİDEN DOLDURMA BUTONU
if (reloadButton) {
    reloadButton.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        startReload();
    });
}

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

    const directionStrength = Math.sqrt(
        joystickX * joystickX + joystickY * joystickY
    );

    if (joystickActive && directionStrength > 0.15) {
        mobileAimAngle = Math.atan2(joystickY, joystickX);
    }

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

    initAudio();
    updateOrientationWarning();

    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(() => {
            console.log("Yatay ekran kilidi desteklenmiyor.");
        });
    }

    resetTiming();
    gameLoop();
}

startButton.addEventListener("click", startGame);

// KLAVYE KONTROLLERİ
window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (key === "r" && !e.repeat) {
        startReload();
    }
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

    if (selectedWeapon !== "rifle") {
        tryShoot();
    }
});

window.addEventListener("mouseup", () => {
    mouseDown = false;
});

canvas.addEventListener("mouseleave", () => {
    mouseDown = false;
});

// MERMİ / ŞARJÖR SİSTEMİ
function updateAmmoText() {
    const weapon = weapons[selectedWeapon];

    ammoText.textContent = reloading
        ? "Doluyor..."
        : `${ammo} / ${reserveAmmo}`;
}

function startReload() {
    if (!gameStarted || gameOver || isPaused) return;

    const weapon = weapons[selectedWeapon];

    if (reloading || ammo >= weapon.magSize || reserveAmmo <= 0) return;

    reloading = true;
    reloadTimer = weapon.reloadTime;
    updateAmmoText();
}

function updateReload() {
    if (!reloading) return;

    reloadTimer--;

    if (reloadTimer <= 0) {
        const needed = weapons[selectedWeapon].magSize - ammo;
        const taken = Math.min(needed, reserveAmmo);

        ammo += taken;
        reserveAmmo -= taken;
        reloading = false;
        updateAmmoText();
    }
}

// Ateş etmeyi dener: şarjör boşsa veya doluyorsa ateş etmez
function tryShoot() {
    if (reloading || fireCooldown > 0) return;

    if (ammo <= 0) {
        if (reserveAmmo > 0) {
            startReload();
        } else {
            showNoAmmo();
        }

        return;
    }

    shootBullet();
    playShotSound(selectedWeapon);

    ammo--;
    fireCooldown = weapons[selectedWeapon].cooldown;
    updateAmmoText();

    // Şarjör bitince yedek mermi varsa otomatik doldur
    if (ammo <= 0 && reserveAmmo > 0) {
        startReload();
    }
}

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

    if (selectedWeapon === "rifle" && mouseDown) {
        tryShoot();
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

    // Ağaç ve kayalara çarpınca içinden geçme
    const pushed = pushOutOfObstacles(
        player.x + player.width / 2,
        player.y + player.height / 2,
        player.width / 2 - 2
    );

    player.x = pushed.x - player.width / 2;
    player.y = pushed.y - player.height / 2;

    player.x = Math.max(
        0,
        Math.min(canvas.width - player.width, player.x)
    );

    player.y = Math.max(
        0,
        Math.min(canvas.height - player.height, player.y)
    );

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

// ŞARJÖR DOLDURMA ÇUBUĞU
function drawReloadBar() {
    if (!reloading) return;

    const total = weapons[selectedWeapon].reloadTime;
    const progress = 1 - reloadTimer / total;

    const barWidth = 60;
    const barHeight = 6;
    const barX = player.x + player.width / 2 - barWidth / 2;
    const barY = player.y + player.height / 2 + 42;

    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
}

// OYUNCUYA HASAR VERME (temas ve patlama için ortak)
function damagePlayer(amount) {
    if (gameOver) return;

    player.health -= amount;

    if (player.health <= 0) {
        player.health = 0;
        healthText.textContent = 0;
        endGame();
    } else {
        healthText.textContent = player.health;
    }
}

// PATLAMA GÖRÜNTÜSÜ (büyük zombi ve bomba ortak kullanır)
function spawnExplosionEffect(x, y, radius, particleCount) {
    explosions.push({
        x: x,
        y: y,
        radius: radius,
        life: 40,
        maxLife: 40
    });

    // Yeşil parçacıklar
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        const life = 30 + Math.random() * 25;

        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: life,
            maxLife: life,
            size: 3 + Math.random() * 5
        });
    }
}

// PATLAMA HASARI: oyuncu menzildeyse hasar alır (uzaklaştıkça azalır)
function applyBlastDamage(x, y, radius, maxDamage) {
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    const dx = playerCenterX - x;
    const dy = playerCenterY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= radius) return;

    const falloff = 1 - (distance / radius) * 0.6;
    const damage = Math.round(maxDamage * falloff);

    damagePlayer(damage);

    // Hemen ardından zombi hasarı da yememek için kısa koruma
    player.damageCooldown = Math.max(player.damageCooldown, 30);

    addFloatingText(
        playerCenterX,
        playerCenterY - 40,
        `-${damage} CAN`,
        "#ff5555"
    );
}

// BÜYÜK ZOMBİ ÖLÜNCE PATLAMASI
function createBossExplosion(x, y) {
    const config = difficulty.bossExplosion;

    spawnExplosionEffect(x, y, config.radius, 35);
    applyBlastDamage(x, y, config.radius, config.damage);
}

// BÜYÜK ZOMBİNİN BOMBASI
function throwBomb(zombie) {
    // Oyuncunun o andaki yerine atar, yani hareket eden kurtulur
    bombs.push({
        startX: zombie.x,
        startY: zombie.y,
        targetX: player.x + player.width / 2,
        targetY: player.y + player.height / 2,
        t: 0
    });
}

function updateBombs() {
    const config = difficulty.bossBomb;

    for (const bomb of bombs) {
        bomb.t++;

        if (bomb.t >= config.flightTime) {
            bomb.landed = true;

            spawnExplosionEffect(bomb.targetX, bomb.targetY, config.radius, 15);
            applyBlastDamage(bomb.targetX, bomb.targetY, config.radius, config.damage);
        }
    }

    bombs = bombs.filter((bomb) => !bomb.landed);
}

function drawBombs() {
    const config = difficulty.bossBomb;

    for (const bomb of bombs) {
        const p = bomb.t / config.flightTime; // 0'dan 1'e

        ctx.save();

        // Düşeceği yeri gösteren uyarı halkası (içi dolarak yaklaşır)
        ctx.fillStyle = `rgba(120, 255, 60, ${0.08 + 0.1 * p})`;
        ctx.beginPath();
        ctx.arc(bomb.targetX, bomb.targetY, config.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(120, 255, 60, 0.28)";
        ctx.beginPath();
        ctx.arc(bomb.targetX, bomb.targetY, config.radius * p, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(160, 255, 90, 0.8)";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.arc(bomb.targetX, bomb.targetY, config.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Havadaki bomba: yere doğru ilerler, yayı çizerek yükselip alçalır
        const groundX = bomb.startX + (bomb.targetX - bomb.startX) * p;
        const groundY = bomb.startY + (bomb.targetY - bomb.startY) * p;
        const height = Math.sin(Math.PI * p) * 110;

        // Yerdeki gölge
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.ellipse(groundX, groundY, 9, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bombanın kendisi
        ctx.shadowColor = "#7cff3c";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#4fd62a";
        ctx.beginPath();
        ctx.arc(groundX, groundY - height, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#c8ff8a";
        ctx.beginPath();
        ctx.arc(groundX - 3, groundY - height - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

function updateExplosions() {
    for (const explosion of explosions) {
        explosion.life--;
    }

    explosions = explosions.filter((explosion) => explosion.life > 0);

    for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.94;
        particle.vy *= 0.94;
        particle.life--;
    }

    particles = particles.filter((particle) => particle.life > 0);
}

function drawExplosions() {
    for (const explosion of explosions) {
        const t = 1 - explosion.life / explosion.maxLife; // 0'dan 1'e
        const eased = 1 - Math.pow(1 - t, 3);              // hızlı başlar, yavaşlar
        const radius = explosion.radius * eased;
        const alpha = 1 - t;

        ctx.save();

        // Yeşil patlama bulutu
        const gradient = ctx.createRadialGradient(
            explosion.x, explosion.y, 0,
            explosion.x, explosion.y, Math.max(radius, 1)
        );

        gradient.addColorStop(0, `rgba(200, 255, 100, ${0.9 * alpha})`);
        gradient.addColorStop(0.6, `rgba(60, 200, 40, ${0.55 * alpha})`);
        gradient.addColorStop(1, "rgba(20, 120, 20, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, Math.max(radius, 1), 0, Math.PI * 2);
        ctx.fill();

        // Şok dalgası halkası
        ctx.strokeStyle = `rgba(150, 255, 80, ${alpha})`;
        ctx.lineWidth = 2 + 6 * (1 - t);
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    for (const particle of particles) {
        const alpha = particle.life / particle.maxLife;

        ctx.save();
        ctx.shadowColor = "#7cff3c";
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(130, 255, 60, ${alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// EŞYA SİSTEMİ (MERMİ KUTUSU VE KALP)
function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x: x, y: y, text: text, color: color, life: 60 });
}

function showNoAmmo() {
    if (noAmmoMessageTimer > 0) return;

    addFloatingText(
        player.x + player.width / 2,
        player.y - 25,
        "MERMİ BİTTİ!",
        "#ff5555"
    );

    noAmmoMessageTimer = 45;
}

function spawnPickup(type, x, y) {
    const free = pushOutOfObstacles(
        Math.max(30, Math.min(canvas.width - 30, x)),
        Math.max(30, Math.min(canvas.height - 30, y)),
        22
    );

    pickups.push({
        type: type,
        x: free.x,
        y: free.y,
        life: 900 // 15 saniye sonra kaybolur
    });
}

// Zombi ölünce eşya düşürme şansı
function dropLoot(zombie) {
    const healthChance = zombie.isBoss ? 0.4 : 0.05;
    const ammoChance = zombie.isBoss ? 0.6 : 0.18;

    const roll = Math.random();

    if (roll < healthChance) {
        spawnPickup("health", zombie.x, zombie.y);
    } else if (roll < healthChance + ammoChance) {
        spawnPickup("ammo", zombie.x, zombie.y);
    }
}

function updatePickups() {
    if (noAmmoMessageTimer > 0) noAmmoMessageTimer--;

    const weapon = weapons[selectedWeapon];

    // Hiç mermi kalmadıysa takılıp kalmasın: haritaya bir mermi kutusu çıkar
    if (
        ammo + reserveAmmo === 0 &&
        !reloading &&
        !pickups.some((p) => p.type === "ammo")
    ) {
        spawnPickup(
            "ammo",
            100 + Math.random() * (canvas.width - 200),
            100 + Math.random() * (canvas.height - 200)
        );
    }

    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];

        pickup.life--;

        if (pickup.life <= 0) {
            pickups.splice(i, 1);
            continue;
        }

        const dx = pickup.x - playerCenterX;
        const dy = pickup.y - playerCenterY;

        if (Math.sqrt(dx * dx + dy * dy) > 40) continue;

        if (pickup.type === "health") {
            // Can doluysa kalp yerde bekler
            if (player.health >= 100) continue;

            player.health = Math.min(100, player.health + 20);
            healthText.textContent = player.health;

            addFloatingText(pickup.x, pickup.y - 20, "+20 CAN", "#ff6b6b");
        } else {
            // Yedek mermi doluysa kutu yerde bekler
            if (reserveAmmo >= weapon.reserveMax) continue;

            reserveAmmo = Math.min(
                weapon.reserveMax,
                reserveAmmo + weapon.pickupAmount
            );
            updateAmmoText();

            addFloatingText(
                pickup.x,
                pickup.y - 20,
                `+${weapon.pickupAmount} MERMİ`,
                "#ffd54f"
            );
        }

        pickups.splice(i, 1);
    }

    for (const text of floatingTexts) {
        text.y -= 0.8;
        text.life--;
    }

    floatingTexts = floatingTexts.filter((text) => text.life > 0);
}

function drawHeart(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.9);

    ctx.bezierCurveTo(
        x - size * 1.3, y - size * 0.1,
        x - size * 0.6, y - size * 1.0,
        x, y - size * 0.35
    );

    ctx.bezierCurveTo(
        x + size * 0.6, y - size * 1.0,
        x + size * 1.3, y - size * 0.1,
        x, y + size * 0.9
    );

    ctx.closePath();
}

function drawPickups() {
    for (const pickup of pickups) {
        // Kaybolmadan önce yanıp söner
        if (pickup.life < 180 && Math.floor(pickup.life / 10) % 2 === 0) {
            continue;
        }

        const x = pickup.x;
        const y = pickup.y + Math.sin(frame * 0.1 + pickup.x) * 3;

        ctx.save();

        if (pickup.type === "health") {
            ctx.shadowColor = "#ff3b3b";
            ctx.shadowBlur = 14;

            drawHeart(x, y, 14);
            ctx.fillStyle = "#e53935";
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.shadowColor = "#ffd54f";
            ctx.shadowBlur = 14;

            ctx.fillStyle = "#6b5a1e";
            ctx.fillRect(x - 15, y - 11, 30, 22);

            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#e6c35c";
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 15, y - 11, 30, 22);

            ctx.fillStyle = "#ffd54f";
            ctx.fillRect(x - 9, y - 7, 5, 14);
            ctx.fillRect(x - 2, y - 7, 5, 14);
            ctx.fillRect(x + 5, y - 7, 5, 14);
        }

        ctx.restore();
    }
}

function drawFloatingTexts() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 20px Arial";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";

    for (const text of floatingTexts) {
        ctx.globalAlpha = Math.min(1, text.life / 30);
        ctx.fillStyle = text.color;

        ctx.strokeText(text.text, text.x, text.y);
        ctx.fillText(text.text, text.x, text.y);
    }

    ctx.restore();
}

// DALGA SİSTEMİ
function showBanner(text, duration = 120) {
    bannerText = text;
    bannerTimer = duration;
    bannerDuration = duration;
}

function startWave(number) {
    wave = number;

    waveTotal = difficulty.waveBase + number * difficulty.waveGrowth;  // 9, 13, 17...
    waveSpawned = 0;
    spawnTimer = 90;
    waveBreakTimer = 0;

    waveText.textContent = wave;
    showBanner(`DALGA ${wave}`, 120);
}

function updateWave() {
    if (bannerTimer > 0) bannerTimer--;

    // Dalgalar arası mola
    if (waveBreakTimer > 0) {
        waveBreakTimer--;

        if (waveBreakTimer === 0) {
            startWave(wave + 1);
        }

        return;
    }

    // Zombileri sırayla çıkar
    if (waveSpawned < waveTotal) {
        spawnTimer--;

        if (spawnTimer <= 0) {
            // İleri dalgalarda aynı anda birden fazla zombi çıkar
            const group = 1 + Math.floor(wave / difficulty.groupEvery);

            for (let i = 0; i < group && waveSpawned < waveTotal; i++) {
                spawnZombie();
                waveSpawned++;
            }

            // Dalga ilerledikçe daha sık çıkarlar
            spawnTimer = Math.max(
                difficulty.spawnDelayMin,
                difficulty.spawnDelayStart - wave * difficulty.spawnDelayDrop
            );
        }
    } else if (zombies.length === 0) {
        // Dalga bitti: bonus puan ve biraz can
        score += wave * 20;
        scoreText.textContent = score;

        player.health = Math.min(100, player.health + 10);
        healthText.textContent = player.health;

        // Dalga bonusu: bir şarjör yedek mermi
        const weapon = weapons[selectedWeapon];
        reserveAmmo = Math.min(weapon.reserveMax, reserveAmmo + weapon.magSize);
        updateAmmoText();

        waveBreakTimer = 180;
        showBanner(`DALGA ${wave} TAMAMLANDI`, 150);
    }
}

function drawBanner() {
    if (bannerTimer <= 0) return;

    const alpha = Math.min(1, bannerTimer / 40);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 64px Arial";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillStyle = "#e8e8e8";

    ctx.strokeText(bannerText, canvas.width / 2, 150);
    ctx.fillText(bannerText, canvas.width / 2, 150);
    ctx.restore();
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

    // Dalga ilerledikçe güçlü zombi ihtimali artar
    const bossChance = Math.min(0.05 + wave * 0.015, 0.25);
    const mediumChance = Math.min(0.25 + wave * 0.01, 0.4);

    const randomNumber = Math.random();

    let randomIndex;

    if (randomNumber < bossChance) {
        randomIndex = 2;
    } else if (randomNumber < bossChance + mediumChance) {
        randomIndex = 1;
    } else {
        randomIndex = 0;
    }

    const randomImage = zombieImages[randomIndex];

    const zombieSize = randomIndex === 2 ? 65 : 48;

    // Her 4 dalgada zombilere +1 can, hız yavaş yavaş artar
    const typeName = ["normal", "fast", "boss"][randomIndex];

    const zombieHealth =
        difficulty.health[typeName] + Math.floor((wave - 1) / 4);

    const speedMultiplier = Math.min(
        1 + (wave - 1) * difficulty.speedPerWave,
        difficulty.maxSpeedMultiplier
    );

    const baseSpeed = difficulty.speed[typeName];

    zombies.push({
        x: x,
        y: y,
        size: zombieSize,
        speed: baseSpeed * speedMultiplier,
        image: randomImage,
        health: zombieHealth,
        maxHealth: zombieHealth,
        isBoss: randomIndex === 2,
        slideSign: Math.random() < 0.5 ? 1 : -1,
        hitFlash: 0,
        bombTimer: randomIndex === 2 ? 150 + Math.random() * 100 : 0
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

            // Engele çarptıysa içinden geçmesin, kenarından kayarak dolansın
            const radius = zombie.size * 0.35;
            const result = pushOutOfObstacles(zombie.x, zombie.y, radius);

            if (result.hit) {
                zombie.x = result.x;
                zombie.y = result.y;

                let tangentX = -result.ny;
                let tangentY = result.nx;

                // Oyuncuya daha yakın olan yöne kay; tam karşıdaysa kendi yönünü seç
                const alignment =
                    (tangentX * dx + tangentY * dy) / distance;

                if (Math.abs(alignment) < 0.15) {
                    tangentX *= zombie.slideSign;
                    tangentY *= zombie.slideSign;
                } else if (alignment < 0) {
                    tangentX = -tangentX;
                    tangentY = -tangentY;
                }

                zombie.x += tangentX * zombie.speed;
                zombie.y += tangentY * zombie.speed;

                const settled = pushOutOfObstacles(zombie.x, zombie.y, radius);
                zombie.x = settled.x;
                zombie.y = settled.y;
            }
        }

        if (zombie.hitFlash > 0) {
            zombie.hitFlash--;
        }

        // Büyük zombi belli aralıklarla bomba atar
        if (zombie.isBoss) {
            zombie.bombTimer--;

            if (zombie.bombTimer <= 0 && distance < difficulty.bossBomb.range) {
                throwBomb(zombie);

                zombie.bombTimer = Math.max(
                    difficulty.bossBomb.minCooldown,
                    difficulty.bossBomb.cooldown - wave * 10
                );
            }
        }
    }
}

// ZOMBİLERİ ÇİZME
function drawZombies() {
    for (const zombie of zombies) {
        const size = zombie.size;

        // Büyük zombinin patlama menzilini hafifçe göster
        if (zombie.isBoss) {
            ctx.save();
            ctx.strokeStyle = "rgba(120, 255, 60, 0.18)";
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.arc(
                zombie.x,
                zombie.y,
                difficulty.bossExplosion.radius,
                0,
                Math.PI * 2
            );
            ctx.stroke();
            ctx.restore();
        }

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
            bullet.y < canvas.height &&
            !obstacles.some((o) => {
                return Math.hypot(bullet.x - o.x, bullet.y - o.y) < o.r;
            })
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

                    dropLoot(zombie);

                    if (zombie.isBoss) {
                        createBossExplosion(zombie.x, zombie.y);
                    }
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
            damagePlayer(difficulty.contactDamage);
            player.damageCooldown = 60;

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

    finalScore.textContent = score;
    gameOverScreen.classList.remove("hidden");
}

// HARİTA SİSTEMİ
function rand(min, max) {
    return min + Math.random() * (max - min);
}

// Bir daireyi engellerden dışarı iter (oyuncu, zombi ve eşyalar için)
function pushOutOfObstacles(x, y, radius) {
    let hit = false;
    let nx = 0;
    let ny = 0;

    for (let pass = 0; pass < 2; pass++) {
        for (const o of obstacles) {
            let dx = x - o.x;
            let dy = y - o.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            const minDistance = o.r + radius;

            if (d >= minDistance) continue;

            if (d === 0) {
                dx = 1;
                dy = 0;
                d = 1;
            }

            nx = dx / d;
            ny = dy / d;

            x = o.x + nx * minDistance;
            y = o.y + ny * minDistance;
            hit = true;
        }
    }

    return { x: x, y: y, hit: hit, nx: nx, ny: ny };
}

// HARİTA AYARLARI (engel sayısını ve sıklığını buradan değiştir)
const mapSettings = {
    trees: 7,          // ağaç sayısı
    rocks: 4,          // kaya sayısı
    gap: 130,          // engeller arası en az boşluk (piksel)
    centerClear: 200   // ortadaki boş bırakılan alanın yarıçapı
};

// Rastgele ağaç ve kaya yerleştir
function generateMap() {
    obstacles = [];

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const types = [
        { type: "tree", count: mapSettings.trees },
        { type: "rock", count: mapSettings.rocks }
    ];

    for (const config of types) {
        for (let i = 0; i < config.count; i++) {
            for (let attempt = 0; attempt < 100; attempt++) {
                const isTree = config.type === "tree";

                const size = isTree ? rand(34, 52) : rand(18, 30);
                const r = isTree ? size * 0.7 : size * 0.9;

                const x = rand(70, canvas.width - 70);
                const y = rand(70, canvas.height - 70);

                // Oyuncunun doğduğu orta bölge boş kalsın
                if (Math.hypot(x - centerX, y - centerY) < mapSettings.centerClear + r) continue;

                // Engeller arasında geçiş için boşluk bırak
                const tooClose = obstacles.some((o) => {
                    return Math.hypot(o.x - x, o.y - y) < o.r + r + mapSettings.gap;
                });

                if (tooClose) continue;

                obstacles.push({
                    type: config.type,
                    x: x,
                    y: y,
                    r: r,
                    size: size
                });

                break;
            }
        }
    }

    buildMapCanvas();
}

function drawTreeOnMap(m, o) {
    const size = o.size;

    // Gölge
    m.fillStyle = "rgba(0, 0, 0, 0.35)";
    m.beginPath();
    m.ellipse(o.x + 10, o.y + 14, size * 0.95, size * 0.8, 0, 0, Math.PI * 2);
    m.fill();

    // Taç tabanı
    m.fillStyle = "#1b361b";
    m.beginPath();
    m.arc(o.x, o.y, size, 0, Math.PI * 2);
    m.fill();

    // Yapraklardan oluşan tümsekler
    const greens = ["#27502a", "#2f6030", "#2a5a2c", "#336a34"];
    const lobes = 7;

    for (let i = 0; i < lobes; i++) {
        const angle = (i / lobes) * Math.PI * 2 + rand(-0.25, 0.25);
        const distance = size * 0.45;

        m.fillStyle = greens[i % greens.length];
        m.beginPath();
        m.arc(
            o.x + Math.cos(angle) * distance,
            o.y + Math.sin(angle) * distance,
            size * 0.55,
            0,
            Math.PI * 2
        );
        m.fill();
    }

    // Işık vuran yerler (sol üst)
    for (let i = 0; i < 4; i++) {
        m.fillStyle = "rgba(130, 190, 90, 0.22)";
        m.beginPath();
        m.arc(
            o.x - size * 0.25 + rand(-size * 0.25, size * 0.25),
            o.y - size * 0.25 + rand(-size * 0.25, size * 0.25),
            size * 0.26,
            0,
            Math.PI * 2
        );
        m.fill();
    }
}

function drawRockOnMap(m, o) {
    const size = o.size;
    const points = [];
    const sides = 9;

    for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const distance = size * rand(0.8, 1.05);

        points.push({
            x: o.x + Math.cos(angle) * distance,
            y: o.y + Math.sin(angle) * distance
        });
    }

    // Gölge
    m.fillStyle = "rgba(0, 0, 0, 0.35)";
    m.beginPath();
    m.ellipse(o.x + 6, o.y + 9, size * 1.05, size * 0.85, 0, 0, Math.PI * 2);
    m.fill();

    // Kaya gövdesi
    m.beginPath();
    points.forEach((p, i) => {
        if (i === 0) m.moveTo(p.x, p.y);
        else m.lineTo(p.x, p.y);
    });
    m.closePath();
    m.fillStyle = "#5b6159";
    m.fill();
    m.strokeStyle = "#383d37";
    m.lineWidth = 2;
    m.stroke();

    // Işık vuran üst yüzey
    m.beginPath();
    points.forEach((p, i) => {
        const x = o.x + (p.x - o.x) * 0.6 - size * 0.12;
        const y = o.y + (p.y - o.y) * 0.6 - size * 0.12;

        if (i === 0) m.moveTo(x, y);
        else m.lineTo(x, y);
    });
    m.closePath();
    m.fillStyle = "rgba(160, 168, 156, 0.4)";
    m.fill();
}

// Zemini ve engelleri bir kez çiz (her karede tekrar çizmeyelim diye)
function buildMapCanvas() {
    if (!mapCanvas) {
        mapCanvas = document.createElement("canvas");
    }

    mapCanvas.width = canvas.width;
    mapCanvas.height = canvas.height;

    const m = mapCanvas.getContext("2d");

    // Zemin
    m.fillStyle = "#182018";
    m.fillRect(0, 0, canvas.width, canvas.height);

    // Zeminde açık/koyu çim ve toprak lekeleri
    const patchColors = [
        "rgba(45, 80, 40, 0.10)",
        "rgba(8, 18, 8, 0.14)",
        "rgba(80, 62, 38, 0.10)"
    ];

    for (let i = 0; i < 110; i++) {
        m.fillStyle = patchColors[i % patchColors.length];
        m.beginPath();
        m.ellipse(
            rand(0, canvas.width),
            rand(0, canvas.height),
            rand(30, 120),
            rand(20, 80),
            rand(0, Math.PI),
            0,
            Math.PI * 2
        );
        m.fill();
    }

    // Çim tutamları
    m.lineWidth = 1.5;
    m.lineCap = "round";

    for (let i = 0; i < 450; i++) {
        const x = rand(0, canvas.width);
        const y = rand(0, canvas.height);

        m.strokeStyle = `rgba(${rand(60, 100)}, ${rand(110, 150)}, ${rand(50, 80)}, 0.35)`;

        for (let blade = -1; blade <= 1; blade++) {
            m.beginPath();
            m.moveTo(x + blade * 3, y);
            m.lineTo(x + blade * 5, y - rand(5, 10));
            m.stroke();
        }
    }

    // Küçük taşlar
    for (let i = 0; i < 70; i++) {
        m.fillStyle = "rgba(120, 125, 115, 0.35)";
        m.beginPath();
        m.arc(rand(0, canvas.width), rand(0, canvas.height), rand(1.5, 3.5), 0, Math.PI * 2);
        m.fill();
    }

    // Çalılar (sadece süs, içinden geçilir)
    for (let i = 0; i < 14; i++) {
        const bx = rand(30, canvas.width - 30);
        const by = rand(30, canvas.height - 30);

        for (let blob = 0; blob < 4; blob++) {
            m.fillStyle = blob % 2 === 0 ? "#223f22" : "#2b4f2b";
            m.beginPath();
            m.arc(bx + rand(-12, 12), by + rand(-8, 8), rand(9, 16), 0, Math.PI * 2);
            m.fill();
        }
    }

    // Engeller
    for (const o of obstacles) {
        if (o.type === "tree") {
            drawTreeOnMap(m, o);
        } else {
            drawRockOnMap(m, o);
        }
    }

    // Kenarları karartan atmosfer
    const vignette = m.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.35,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.65
    );

    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.45)");

    m.fillStyle = vignette;
    m.fillRect(0, 0, canvas.width, canvas.height);
}

// ARKA PLAN
function drawBackground() {
    if (!mapCanvas) {
        generateMap();
    }

    ctx.drawImage(mapCanvas, 0, 0);
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
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height / 2 - player.height / 2;
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
    keys = {};

    mobileAimAngle = 0;

    // Seçilen silaha göre şarjörü doldur
    ammo = weapons[selectedWeapon].magSize;
    reserveAmmo = weapons[selectedWeapon].reserveStart;
    reloading = false;
    reloadTimer = 0;

    pickups = [];
    floatingTexts = [];
    noAmmoMessageTimer = 0;
    explosions = [];
    particles = [];
    bombs = [];

    generateMap();

    resetJoystick();
    firePointerId = null;

    scoreText.textContent = score;
    healthText.textContent = player.health;
    finalScore.textContent = score;
    updateAmmoText();

    startWave(1);

    updateMobileAim();
}

// ZAMANLAYICIYI SIFIRLA (başlama, devam etme, yeniden başlatma)
function resetTiming() {
    lastTime = null;
    accumulator = 0;
}

// OYUN MANTIĞI (saniyede tam 60 kez çalışır)
function update() {
    frame++;

    movePlayer();
    handleAutomaticFire();
    updateReload();
    updateWave();
    updatePickups();
    updateExplosions();

    moveZombies();
    updateBombs();
    moveBullets();
    checkCollisions();
}

// ÇİZİM
function render() {
    drawBackground();
    drawPickups();
    drawPlayer();
    drawZombies();
    drawBombs();
    drawBullets();
    drawExplosions();
    drawReloadBar();
    drawFloatingTexts();
    drawBanner();
}

// OYUN DÖNGÜSÜ
function gameLoop(timestamp = performance.now()) {
    if (gameOver || !gameStarted || isPaused) return;

    if (lastTime === null) {
        lastTime = timestamp;
    }

    let delta = timestamp - lastTime;
    lastTime = timestamp;

    // Sekme arka plana gidip gelince oyun fırlamasın
    if (delta > 100) delta = 100;

    accumulator += delta;

    while (accumulator >= STEP) {
        update();
        accumulator -= STEP;

        if (gameOver) break;
    }

    render();

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

    updateOrientationWarning();

    resetTiming();
    gameLoop();
}

restartButton.addEventListener("click", restartGame);

// DURAKLATMA
function pauseGame() {
    if (!gameStarted || gameOver || isPaused) return;

    isPaused = true;
    mouseDown = false;
    keys = {};

    resetJoystick();
    firePointerId = null;

    stopAnimation();

    pauseScreen.classList.remove("hidden");
}

pauseButton.addEventListener("click", pauseGame);

// OYUNA DEVAM ETME
function resumeGame() {
    if (!isPaused || gameOver || !gameStarted) return;

    isPaused = false;
    pauseScreen.classList.add("hidden");

    resetTiming();
    gameLoop();
}

resumeButton.addEventListener("click", resumeGame);

// ANA MENÜYE DÖNME
function returnToMenu() {
    stopAnimation();

    gameStarted = false;
    gameOver = false;
    isPaused = false;
    mouseDown = false;
    keys = {};

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