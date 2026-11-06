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
const fullscreenButton = document.getElementById("fullscreenButton");
const countdownScreen = document.getElementById("countdownScreen");
const countdownNumber = document.getElementById("countdownNumber");

const grenadeText = document.getElementById("grenades");
const molotovText = document.getElementById("molotovs");
const throwBombInfo = document.getElementById("throwBombInfo");
const throwMolotovInfo = document.getElementById("throwMolotovInfo");
const throwButton = document.getElementById("throwButton");
const swapThrowButton = document.getElementById("swapThrowButton");

const finalKills = document.getElementById("finalKills");
const finalWave = document.getElementById("finalWave");
const finalTime = document.getElementById("finalTime");
const newRecordText = document.getElementById("newRecord");
const highScoreList = document.getElementById("highScoreList");
const menuBest = document.getElementById("menuBest");

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

// BOMBA VE MOLOTOF AYARLARI
const throwables = {
    maxRange: 380,        // fareyle en fazla bu kadar uzağa atılabilir (piksel)
    cooldown: 40,         // iki atış arası bekleme (kare)
    maxCarry: 6,          // en fazla taşınabilir adet
    friendlyFire: true,   // kendi bombandan da zarar görürsün

    grenade: {
        radius: 135,      // patlama yarıçapı
        damage: 6,        // merkezdeki zombi hasarı (kenara doğru yarıya düşer)
        playerDamage: 18  // kendine yakın patlarsa
    },

    molotov: {
        radius: 100,      // yangın alanı
        duration: 360,    // yanma süresi (kare, 360 = 6 saniye)
        tickEvery: 20,    // kaç karede bir hasar verir
        tickDamage: 1,    // zombiye her vuruşta hasar
        playerTick: 3     // yangının içinde durursan hasar
    }
};

let grenadeCount = 2;
let molotovCount = 2;
let selectedThrowable = "grenade";
let throwCooldown = 0;
let thrown = [];          // havadaki bomba ve molotoflar
let fires = [];           // yerdeki yangınlar

// Karaktere göre değişen özellikler (resetGame içinde ayarlanır)
let reloadMultiplier = 1;
let reloadTotal = 1;
let healMultiplier = 1;
let grenadePower = 1;
let fireDurationMultiplier = 1;

// Efektler: ekran sarsıntısı, kan lekesi, namlu ışığı
let shakeTimer = 0;
let shakeMax = 1;
let shakeStrength = 0;
let hurtFlash = 0;
let muzzleFlash = 0;
let muzzleAngle = 0;
let stainCanvas = null;
let stainCtx = null;
let snowflakes = [];

// İstatistik
let kills = 0;

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
    maxHealth: 100,
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
        ability: "Dengeli savaşçı: can paketleri %25 daha fazla iyileştirir.",
        story: "Salgın başladığında şehri geride bırakıp ayakta kalmayı tek başına öğrenen, sakin ve soğukkanlı bir hayatta kalan. Yıllarca kimseye güvenmeden yaşamak ona dikkatli olmayı öğretti. Şimdi geriye kalan son güvenli bölgeyi korumak için silahını eline aldı."
    },
    ellie: {
        name: "Ellie",
        role: "Genç Savaşçı",
        ability: "Hızlı ve usta: şarjörü %25 daha çabuk doldurur, molotofları %50 daha uzun yanar.",
        story: "Salgından sonra doğan Ellie, çocukluğunu yıkık bir dünyanın askeri okulunda geçirdi. Enfeksiyona karşı bağışık çıkınca hayatı bir anda herkesin umudu haline geldi. Keskin zekâsı, alaycı mizahı ve inadıyla en tehlikeli yerlerde bile pes etmiyor."
    },
    joel: {
        name: "Joel",
        role: "Kaçakçı",
        ability: "Ağır ve dayanıklı: 130 canla başlar, bombaları daha geniş alanda ve daha güçlü patlar.",
        story: "Salgının ilk gecesinde en büyük kaybını yaşayan Joel, yıllar sonra karantina bölgelerinde kaçakçılık yapan sert ve kayıtsız bir adama dönüştü. Ağır bir yolculuğu üstlenmek zorunda kalınca, yaşadıklarının yükünü bir kez daha taşımayı öğrenmesi gerekti."
    }
};

// KARAKTER ÖZELLİKLERİ (oyunu gerçekten etkiler)
const characterStats = {
    player: {
        speed: 3.5, maxHealth: 100, reloadMultiplier: 1.0,
        grenades: 2, molotovs: 2,
        healMultiplier: 1.25, grenadePower: 1.0, fireDuration: 1.0
    },
    ellie: {
        speed: 4.1, maxHealth: 80, reloadMultiplier: 0.75,
        grenades: 1, molotovs: 3,
        healMultiplier: 1.0, grenadePower: 1.0, fireDuration: 1.5
    },
    joel: {
        speed: 3.0, maxHealth: 130, reloadMultiplier: 1.1,
        grenades: 3, molotovs: 1,
        healMultiplier: 1.0, grenadePower: 1.3, fireDuration: 1.0
    }
};

const characterInfoStats = document.getElementById("characterInfoStats");
const characterInfoAbility = document.getElementById("characterInfoAbility");

function renderCharacterStats(characterKey) {
    const stats = characterStats[characterKey];

    if (!stats) return;

    const rows = [
        ["Can", stats.maxHealth / 130],
        ["Hız", stats.speed / 4.1],
        ["Doldurma", 1 / stats.reloadMultiplier / 1.34],
        ["Bomba", stats.grenades / 3],
        ["Molotof", stats.molotovs / 3]
    ];

    characterInfoStats.innerHTML = rows.map(([label, ratio]) => {
        const percent = Math.max(6, Math.min(100, Math.round(ratio * 100)));

        return `<span class="stat-row">
            <span class="stat-label">${label}</span>
            <span class="stat-bar"><span class="stat-fill" style="width:${percent}%"></span></span>
        </span>`;
    }).join("");
}

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
    characterInfoAbility.textContent = "⭐ Özel: " + profile.ability;
    renderCharacterStats(characterKey);

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

// MOBİL BOMBA BUTONLARI
throwButton.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    throwSelected();
});

swapThrowButton.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    switchThrowable();
});

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

// TAM EKRAN
function isFullscreen() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function canFullscreen() {
    const element = document.documentElement;
    return Boolean(element.requestFullscreen || element.webkitRequestFullscreen);
}

// Tam ekranda ve telefonda oyun ekrana tam sığacak şekilde büyür (CSS: html.immersive)
function updateImmersiveMode() {
    document.documentElement.classList.toggle(
        "immersive",
        isFullscreen() || isMobileDevice
    );

    fullscreenButton.textContent = isFullscreen() ? "🗗" : "⛶";
}

// Telefonu otomatik yatay çevirir (Android Chrome'da tam ekranda çalışır)
function lockLandscape() {
    if (!isMobileDevice || !screen.orientation || !screen.orientation.lock) return;

    screen.orientation.lock("landscape").catch(() => {
        console.log("Yatay ekran kilidi desteklenmiyor.");
    });
}

async function enterFullscreen() {
    const element = document.documentElement;

    try {
        if (element.requestFullscreen) {
            await element.requestFullscreen({ navigationUI: "hide" });
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        }
    } catch (error) {
        console.log("Tam ekran açılamadı:", error);
    }

    // Yatay kilit ancak tam ekran açıldıktan sonra kabul edilir
    lockLandscape();
}

function exitFullscreen() {
    try {
        if (document.fullscreenElement && document.exitFullscreen) {
            Promise.resolve(document.exitFullscreen()).catch(() => {});
        } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    } catch (error) {
        console.log("Tam ekrandan çıkılamadı:", error);
    }
}

function toggleFullscreen() {
    if (isFullscreen()) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
}

fullscreenButton.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", onFullscreenChange);
document.addEventListener("webkitfullscreenchange", onFullscreenChange);

function onFullscreenChange() {
    updateImmersiveMode();
    updateOrientationWarning();
}

// iPhone gibi tam ekranı desteklemeyen cihazlarda buton gizlenir
if (!canFullscreen()) {
    fullscreenButton.style.display = "none";
}

updateImmersiveMode();

// BAŞLAMADAN ÖNCE 3 SANİYELİK GERİ SAYIM
let countdownTimer = null;

function playBeep(frequency, duration) {
    if (!soundEnabled || !audioCtx) return;

    const now = audioCtx.currentTime;

    const oscillator = audioCtx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);

    const volume = audioCtx.createGain();
    volume.gain.setValueAtTime(0.3, now);
    volume.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(volume);
    volume.connect(masterGain);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
}

function cancelCountdown() {
    if (countdownTimer !== null) {
        clearTimeout(countdownTimer);
        countdownTimer = null;
    }

    countdownScreen.classList.add("hidden");
}

function startCountdown(onDone) {
    cancelCountdown();

    let count = 3;

    function showNumber() {
        countdownNumber.textContent = count;

        // Sayı animasyonunu her sayıda yeniden başlat
        countdownNumber.style.animation = "none";
        void countdownNumber.offsetWidth;
        countdownNumber.style.animation = "";

        playBeep(440, 0.15);
    }

    countdownScreen.classList.remove("hidden");
    showNumber();

    function tick() {
        count--;

        if (count > 0) {
            showNumber();
            countdownTimer = setTimeout(tick, 1000);
        } else {
            countdownTimer = null;
            countdownScreen.classList.add("hidden");
            playBeep(880, 0.3);
            onDone();
        }
    }

    countdownTimer = setTimeout(tick, 1000);
}

// OYUNU BAŞLAT
function startGame() {
    stopAnimation();
    cancelCountdown();

    mainMenu.classList.add("hidden");
    gameContainer.classList.remove("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    orientationWarning.classList.add("hidden");

    resetGame();

    // Geri sayım bitene kadar oyun başlamaz
    gameStarted = false;
    isPaused = false;

    initAudio();

    // Tam ekran isteği, butona basılan anda yapılmalı (tarayıcı kuralı)
    enterFullscreen();

    // Geri sayım sırasında arkada sahne görünsün
    render();

    startCountdown(() => {
        gameStarted = true;

        updateOrientationWarning();
        resetTiming();
        gameLoop();
    });
}

startButton.addEventListener("click", startGame);

// KLAVYE KONTROLLERİ
window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (key === "r" && !e.repeat) {
        startReload();
    }

    if (key === "f" && !e.repeat && gameStarted) {
        toggleFullscreen();
    }

    if (!e.repeat) {
        if (key === "g") throwSelected();
        if (key === "q") switchThrowable();
        if (key === "1") selectThrowable("grenade");
        if (key === "2") selectThrowable("molotov");
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
// Sağ tık: seçili bombayı fareyle gösterilen yere at
canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

canvas.addEventListener("mousedown", (e) => {
    if (e.button === 2) {
        throwSelected();
        return;
    }

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
    reloadTotal = Math.round(weapon.reloadTime * reloadMultiplier);
    reloadTimer = reloadTotal;
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

    if (selectedWeapon === "shotgun") {
        addShake(3.5, 7);
    }

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

    muzzleFlash = 3;
    muzzleAngle = angle;

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

    const total = reloadTotal;
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

    addShake(5, 12);
    hurtFlash = 12;

    player.health -= amount;

    if (player.health <= 0) {
        player.health = 0;
        healthText.textContent = 0;
        endGame();
    } else {
        healthText.textContent = player.health;
    }
}

// PATLAMA GÖRÜNTÜSÜ (büyük zombi, boss bombası, bomba ve molotof ortak kullanır)
const explosionThemes = {
    acid: {
        core: [200, 255, 100], mid: [60, 200, 40], edge: [20, 120, 20],
        ring: [150, 255, 80], particle: [130, 255, 60], glow: "#7cff3c"
    },
    fire: {
        core: [255, 240, 160], mid: [255, 140, 30], edge: [160, 40, 10],
        ring: [255, 190, 80], particle: [255, 160, 50], glow: "#ff9a2e"
    }
};

function spawnExplosionEffect(x, y, radius, particleCount, theme = "acid") {
    explosions.push({
        x: x,
        y: y,
        radius: radius,
        theme: theme,
        life: 40,
        maxLife: 40
    });

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
            size: 3 + Math.random() * 5,
            theme: theme
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
    addShake(12, 25);
    addScorch(x, y, config.radius * 0.5);
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

        ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(bomb.targetX, bomb.targetY, config.radius, 0, Math.PI * 2);
        ctx.stroke();

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
        const colors = explosionThemes[explosion.theme || "acid"];

        const t = 1 - explosion.life / explosion.maxLife; // 0'dan 1'e
        const eased = 1 - Math.pow(1 - t, 3);              // hızlı başlar, yavaşlar
        const radius = explosion.radius * eased;
        const alpha = 1 - t;

        ctx.save();

        // Patlama bulutu
        const gradient = ctx.createRadialGradient(
            explosion.x, explosion.y, 0,
            explosion.x, explosion.y, Math.max(radius, 1)
        );

        gradient.addColorStop(0, `rgba(${colors.core.join(",")}, ${0.9 * alpha})`);
        gradient.addColorStop(0.6, `rgba(${colors.mid.join(",")}, ${0.55 * alpha})`);
        gradient.addColorStop(1, `rgba(${colors.edge.join(",")}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, Math.max(radius, 1), 0, Math.PI * 2);
        ctx.fill();

        // Şok dalgası halkası
        ctx.strokeStyle = `rgba(${colors.ring.join(",")}, ${alpha})`;
        ctx.lineWidth = 2 + 6 * (1 - t);
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    for (const particle of particles) {
        const colors = explosionThemes[particle.theme || "acid"];
        const alpha = particle.life / particle.maxLife;

        ctx.save();
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(${colors.particle.join(",")}, ${alpha})`;
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

// Zombi ölünce eşya düşürme şansı (liste sırayla toplanır, sonuncudan sonrası: eşya yok)
function dropLoot(zombie) {
    const table = zombie.isBoss
        ? [["health", 0.30], ["ammo", 0.40], ["grenade", 0.15], ["molotov", 0.15]]
        : [["health", 0.05], ["ammo", 0.18], ["grenade", 0.03], ["molotov", 0.03]];

    const roll = Math.random();
    let total = 0;

    for (const [type, chance] of table) {
        total += chance;

        if (roll < total) {
            spawnPickup(type, zombie.x, zombie.y);
            return;
        }
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
            if (player.health >= player.maxHealth) continue;

            const heal = Math.round(20 * healMultiplier);

            player.health = Math.min(player.maxHealth, player.health + heal);
            healthText.textContent = player.health;

            addFloatingText(pickup.x, pickup.y - 20, `+${heal} CAN`, "#ff6b6b");
        } else if (pickup.type === "grenade" || pickup.type === "molotov") {
            const isGrenade = pickup.type === "grenade";
            const current = isGrenade ? grenadeCount : molotovCount;

            // Taşıma sınırı doluysa yerde bekler
            if (current >= throwables.maxCarry) continue;

            if (isGrenade) {
                grenadeCount++;
            } else {
                molotovCount++;
            }

            updateThrowText();

            addFloatingText(
                pickup.x,
                pickup.y - 20,
                isGrenade ? "+1 BOMBA" : "+1 MOLOTOF",
                "#ffb15c"
            );
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
        } else if (pickup.type === "ammo") {
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
        } else if (pickup.type === "grenade") {
            ctx.shadowColor = "#9acd5a";
            ctx.shadowBlur = 14;

            ctx.fillStyle = "#3f4f2a";
            ctx.beginPath();
            ctx.arc(x, y + 2, 11, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#c8e08a";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = "#c8e08a";
            ctx.fillRect(x - 3, y - 13, 6, 5);
            ctx.fillRect(x - 1, y - 16, 10, 3);
        } else if (pickup.type === "molotov") {
            ctx.shadowColor = "#ff9a2e";
            ctx.shadowBlur = 14;

            ctx.fillStyle = "rgba(110, 160, 90, 0.9)";
            ctx.fillRect(x - 7, y - 4, 14, 17);
            ctx.fillRect(x - 3, y - 11, 6, 8);

            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#cfe6b0";
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 7, y - 4, 14, 17);

            ctx.fillStyle = "#ff8a1f";
            ctx.beginPath();
            ctx.arc(x, y - 15, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#ffe08a";
            ctx.beginPath();
            ctx.arc(x, y - 14, 3, 0, Math.PI * 2);
            ctx.fill();
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

        player.health = Math.min(player.maxHealth, player.health + 10);
        healthText.textContent = player.health;

        // Dalga bonusu: bir şarjör yedek mermi
        const weapon = weapons[selectedWeapon];
        reserveAmmo = Math.min(weapon.reserveMax, reserveAmmo + weapon.magSize);
        updateAmmoText();

        // Dalga bonusu: elinde az olan fırlatılabilir silahtan bir tane
        if (grenadeCount <= molotovCount) {
            grenadeCount = Math.min(throwables.maxCarry, grenadeCount + 1);
        } else {
            molotovCount = Math.min(throwables.maxCarry, molotovCount + 1);
        }

        updateThrowText();

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
            ctx.strokeStyle = mapThemes[selectedMap].dangerRing;
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
        ctx.strokeStyle = "rgba(90, 70, 0, 0.9)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

// ÇARPIŞMALARI KONTROL ETME
function checkCollisions() {
    for (const zombie of zombies) {
        if (zombie.dead) continue;

        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];

            const dx = zombie.x - bullet.x;
            const dy = zombie.y - bullet.y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < zombie.size / 2 + bullet.radius) {
                bullets.splice(j, 1);
                damageZombie(zombie, 1);
                break;
            }
        }
    }

    purgeDeadZombies();

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

// ZOMBİYE HASAR VERME VE ÖLÜM (mermi, bomba ve yangın ortak kullanır)
function damageZombie(zombie, amount) {
    if (zombie.dead) return;

    zombie.health -= amount;
    zombie.hitFlash = 8;

    if (zombie.health <= 0) {
        killZombie(zombie);
    }
}

function killZombie(zombie) {
    zombie.dead = true;
    kills++;

    score += zombie.isBoss ? 50 : 10;
    scoreText.textContent = score;

    addBloodStain(zombie.x, zombie.y, zombie.isBoss);
    dropLoot(zombie);

    if (zombie.isBoss) {
        createBossExplosion(zombie.x, zombie.y);
    }
}

// Ölen zombileri listeden temizle
function purgeDeadZombies() {
    if (zombies.some((zombie) => zombie.dead)) {
        zombies = zombies.filter((zombie) => !zombie.dead);
    }
}

// BOMBA VE MOLOTOF
function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function updateThrowText() {
    grenadeText.textContent = grenadeCount;
    molotovText.textContent = molotovCount;

    throwBombInfo.classList.toggle("throw-selected", selectedThrowable === "grenade");
    throwMolotovInfo.classList.toggle("throw-selected", selectedThrowable === "molotov");

    throwButton.textContent = selectedThrowable === "grenade" ? "💣" : "🔥";
}

function selectThrowable(type) {
    if (type !== "grenade" && type !== "molotov") return;

    selectedThrowable = type;
    updateThrowText();
}

function switchThrowable() {
    selectThrowable(selectedThrowable === "grenade" ? "molotov" : "grenade");
}

// Fare nereyi gösteriyorsa oraya atılır, ama en fazla maxRange kadar uzağa
function getThrowTarget() {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    let dx = mouse.x - centerX;
    let dy = mouse.y - centerY;

    const distance = Math.hypot(dx, dy);
    const clamped = distance > throwables.maxRange;

    if (clamped) {
        dx = (dx / distance) * throwables.maxRange;
        dy = (dy / distance) * throwables.maxRange;
    }

    return {
        x: clampValue(centerX + dx, 10, canvas.width - 10),
        y: clampValue(centerY + dy, 10, canvas.height - 10),
        distance: Math.min(distance, throwables.maxRange),
        clamped: clamped
    };
}

function getGrenadeRadius() {
    // Güç artışı alanı yarı oranda büyütür (Joel: x1.3 güç = %15 daha geniş)
    return throwables.grenade.radius * (1 + (grenadePower - 1) * 0.5);
}

function throwSelected() {
    if (!gameStarted || gameOver || isPaused) return;
    if (throwCooldown > 0) return;

    const count = selectedThrowable === "grenade" ? grenadeCount : molotovCount;

    if (count <= 0) {
        addFloatingText(
            player.x + player.width / 2,
            player.y - 25,
            selectedThrowable === "grenade" ? "BOMBA KALMADI!" : "MOLOTOF KALMADI!",
            "#ff5555"
        );

        throwCooldown = 25;
        return;
    }

    const target = getThrowTarget();

    // Uzağa atılan daha uzun süre havada kalır
    const flight = Math.round(30 + 25 * (target.distance / throwables.maxRange));

    thrown.push({
        type: selectedThrowable,
        startX: player.x + player.width / 2,
        startY: player.y + player.height / 2,
        targetX: target.x,
        targetY: target.y,
        distance: target.distance,
        t: 0,
        flight: flight
    });

    if (selectedThrowable === "grenade") {
        grenadeCount--;
    } else {
        molotovCount--;
    }

    throwCooldown = throwables.cooldown;
    updateThrowText();
    playThrowSound();
}

function updateThrown() {
    if (throwCooldown > 0) throwCooldown--;

    for (const item of thrown) {
        item.t++;

        if (item.t >= item.flight) {
            item.landed = true;

            if (item.type === "grenade") {
                explodeGrenade(item.targetX, item.targetY);
            } else {
                startFire(item.targetX, item.targetY);
            }
        }
    }

    thrown = thrown.filter((item) => !item.landed);
    purgeDeadZombies();
}

function explodeGrenade(x, y) {
    const config = throwables.grenade;
    const radius = getGrenadeRadius();
    const damage = config.damage * grenadePower;

    spawnExplosionEffect(x, y, radius, 32, "fire");
    addShake(10, 20);
    addScorch(x, y, radius * 0.45);
    playExplosionSound();

    // Merkeze yakın olan daha çok hasar alır, kenarda yarıya düşer
    for (const zombie of zombies) {
        if (zombie.dead) continue;

        const distance = Math.hypot(zombie.x - x, zombie.y - y);

        if (distance < radius + zombie.size * 0.3) {
            const falloff = 1 - Math.min(distance / radius, 1) * 0.5;
            damageZombie(zombie, damage * falloff);
        }
    }

    // Çok yakına atarsan sen de zarar görürsün
    if (throwables.friendlyFire) {
        applyBlastDamage(x, y, radius * 0.8, config.playerDamage);
    }
}

function startFire(x, y) {
    const config = throwables.molotov;
    const duration = Math.round(config.duration * fireDurationMultiplier);

    fires.push({
        x: x,
        y: y,
        radius: config.radius,
        life: duration,
        maxLife: duration,
        tick: 0
    });

    spawnExplosionEffect(x, y, config.radius * 0.8, 14, "fire");
    addShake(3, 8);
    addScorch(x, y, config.radius * 0.6);
    playFireSound();
}

function updateFires() {
    const config = throwables.molotov;

    for (const fire of fires) {
        fire.life--;
        fire.tick++;

        if (fire.tick % config.tickEvery !== 0) continue;

        for (const zombie of zombies) {
            if (zombie.dead) continue;

            const distance = Math.hypot(zombie.x - fire.x, zombie.y - fire.y);

            if (distance < fire.radius + zombie.size * 0.3) {
                damageZombie(zombie, config.tickDamage);
            }
        }

        if (throwables.friendlyFire) {
            const playerX = player.x + player.width / 2;
            const playerY = player.y + player.height / 2;

            if (Math.hypot(playerX - fire.x, playerY - fire.y) < fire.radius) {
                damagePlayer(config.playerTick);

                addFloatingText(
                    playerX,
                    playerY - 40,
                    `-${config.playerTick} YANIK`,
                    "#ff8a3d"
                );
            }
        }
    }

    fires = fires.filter((fire) => fire.life > 0);
    purgeDeadZombies();
}

function drawFires() {
    for (const fire of fires) {
        const fade = Math.min(1, fire.life / 60);

        ctx.save();
        ctx.globalAlpha = fade;

        // Yerdeki ateş parıltısı
        const glow = ctx.createRadialGradient(
            fire.x, fire.y, 0,
            fire.x, fire.y, fire.radius
        );

        glow.addColorStop(0, "rgba(255, 160, 50, 0.5)");
        glow.addColorStop(0.7, "rgba(200, 70, 10, 0.28)");
        glow.addColorStop(1, "rgba(120, 20, 0, 0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(fire.x, fire.y, fire.radius, 0, Math.PI * 2);
        ctx.fill();

        // Titreyen alev dilleri
        for (let i = 0; i < 10; i++) {
            const angle = i * 0.628 + i * 0.7;
            const distance = fire.radius * (0.12 + 0.6 * (((i * 37) % 10) / 10));
            const flicker = Math.sin(frame * 0.25 + i * 1.9);

            const size = 13 + 7 * flicker + (i % 3) * 3;
            const px = fire.x + Math.cos(angle) * distance;
            const py = fire.y + Math.sin(angle) * distance - 6 - 4 * flicker;

            ctx.shadowColor = "#ff8a1f";
            ctx.shadowBlur = 12;
            ctx.fillStyle = "rgba(255, 120, 20, 0.85)";
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(255, 225, 100, 0.9)";
            ctx.beginPath();
            ctx.arc(px, py - 2, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Havadaki bomba ve molotof
function drawThrown() {
    for (const item of thrown) {
        const p = item.t / item.flight; // 0'dan 1'e
        const isGrenade = item.type === "grenade";
        const radius = isGrenade ? getGrenadeRadius() : throwables.molotov.radius;

        ctx.save();

        // Düşeceği yeri gösteren halka
        ctx.fillStyle = `rgba(255, 140, 30, ${0.07 + 0.1 * p})`;
        ctx.beginPath();
        ctx.arc(item.targetX, item.targetY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(item.targetX, item.targetY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 170, 70, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.arc(item.targetX, item.targetY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Yay çizerek uçuş
        const groundX = item.startX + (item.targetX - item.startX) * p;
        const groundY = item.startY + (item.targetY - item.startY) * p;
        const height = Math.sin(Math.PI * p) * (50 + 60 * (item.distance / throwables.maxRange));

        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.ellipse(groundX, groundY, 8, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(groundX, groundY - height);
        ctx.rotate(p * 14);

        if (isGrenade) {
            ctx.fillStyle = "#3f4f2a";
            ctx.strokeStyle = "#1c2412";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#c8e08a";
            ctx.fillRect(-2.5, -13, 5, 5);
        } else {
            ctx.fillStyle = "rgba(120, 170, 100, 0.95)";
            ctx.strokeStyle = "#2a3d22";
            ctx.lineWidth = 2;
            ctx.fillRect(-5, -2, 10, 14);
            ctx.strokeRect(-5, -2, 10, 14);
            ctx.fillRect(-2.5, -10, 5, 8);

            ctx.shadowColor = "#ff8a1f";
            ctx.shadowBlur = 12;
            ctx.fillStyle = "#ff8a1f";
            ctx.beginPath();
            ctx.arc(0, -13, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Bombanın nereye düşeceğini gösteren silik nişan
function drawAimPreview() {
    if (!gameStarted || gameOver || isPaused) return;

    const count = selectedThrowable === "grenade" ? grenadeCount : molotovCount;

    if (count <= 0) return;

    const target = getThrowTarget();
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    const radius = selectedThrowable === "grenade"
        ? getGrenadeRadius()
        : throwables.molotov.radius;

    ctx.save();

    // Önce koyu alt çizgi (açık renkli haritada görünsün)
    for (const pass of [0, 1]) {
        ctx.strokeStyle = pass === 0
            ? "rgba(0, 0, 0, 0.22)"
            : (target.clamped ? "rgba(255, 130, 60, 0.7)" : "rgba(255, 255, 255, 0.5)");

        ctx.lineWidth = pass === 0 ? 4 : 2;
        ctx.setLineDash([6, 9]);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.fillStyle = target.clamped ? "rgba(255, 130, 60, 0.9)" : "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.arc(target.x, target.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// EFEKTLER: sarsıntı, kan, namlu ışığı, düşük can
function addShake(strength, duration) {
    const current = shakeTimer > 0 ? shakeStrength * (shakeTimer / shakeMax) : 0;

    if (strength >= current) {
        shakeStrength = strength;
        shakeMax = duration;
        shakeTimer = duration;
    }
}

function updateEffects() {
    if (shakeTimer > 0) shakeTimer--;
    if (hurtFlash > 0) hurtFlash--;
    if (muzzleFlash > 0) muzzleFlash--;

    // Can azaldığında kalp atışı sesi
    if (
        player.health > 0 &&
        player.health / player.maxHealth < 0.35 &&
        frame % 75 === 0
    ) {
        playHeartbeat();
    }

    updateSnow();
}

function resetStains() {
    if (!stainCanvas) {
        stainCanvas = document.createElement("canvas");
    }

    stainCanvas.width = canvas.width;
    stainCanvas.height = canvas.height;
    stainCtx = stainCanvas.getContext("2d");
}

// Kalıcı kan lekesi (büyük zombide yeşilimsi sıvı)
function addBloodStain(x, y, isBoss) {
    if (!stainCtx) return;

    const blobs = isBoss ? 10 : 5;

    for (let i = 0; i < blobs; i++) {
        stainCtx.fillStyle = isBoss
            ? `rgba(55, 115, 30, ${rand(0.35, 0.55)})`
            : `rgba(${Math.round(rand(95, 140))}, 8, 8, ${rand(0.35, 0.6)})`;

        stainCtx.beginPath();
        stainCtx.ellipse(
            x + rand(-16, 16) * (isBoss ? 1.6 : 1),
            y + rand(-16, 16) * (isBoss ? 1.6 : 1),
            rand(4, 12) * (isBoss ? 1.5 : 1),
            rand(3, 9) * (isBoss ? 1.5 : 1),
            rand(0, Math.PI),
            0,
            Math.PI * 2
        );
        stainCtx.fill();
    }
}

// Patlama sonrası yanık izi
function addScorch(x, y, radius) {
    if (!stainCtx) return;

    const gradient = stainCtx.createRadialGradient(x, y, 0, x, y, radius);

    gradient.addColorStop(0, "rgba(10, 8, 6, 0.55)");
    gradient.addColorStop(0.6, "rgba(10, 8, 6, 0.3)");
    gradient.addColorStop(1, "rgba(10, 8, 6, 0)");

    stainCtx.fillStyle = gradient;
    stainCtx.beginPath();
    stainCtx.arc(x, y, radius, 0, Math.PI * 2);
    stainCtx.fill();
}

function drawStains() {
    if (stainCanvas) {
        ctx.drawImage(stainCanvas, 0, 0);
    }
}

function drawMuzzleFlash() {
    if (muzzleFlash <= 0) return;

    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    const size = selectedWeapon === "shotgun" ? 36 : 22;
    const tipX = centerX + Math.cos(muzzleAngle) * 40;
    const tipY = centerY + Math.sin(muzzleAngle) * 40;

    ctx.save();
    ctx.globalAlpha = muzzleFlash / 3;

    const glow = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, size);
    glow.addColorStop(0, "rgba(255, 245, 170, 0.95)");
    glow.addColorStop(0.5, "rgba(255, 170, 50, 0.5)");
    glow.addColorStop(1, "rgba(255, 120, 0, 0)");

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(tipX, tipY, size, 0, Math.PI * 2);
    ctx.fill();

    // Namlu ucundan çıkan alev
    ctx.translate(tipX, tipY);
    ctx.rotate(muzzleAngle);
    ctx.fillStyle = "rgba(255, 235, 130, 0.85)";
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.2);
    ctx.lineTo(size * 1.5, 0);
    ctx.lineTo(0, size * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// Can azalınca ekran kenarları kızarır ve nabız gibi atar
function drawLowHealth() {
    if (!gameStarted || gameOver || player.maxHealth <= 0) return;

    const ratio = player.health / player.maxHealth;

    if (ratio >= 0.35 || player.health <= 0) return;

    const pulse = (Math.sin(frame * 0.12) + 1) / 2;
    const strength = (0.35 - ratio) / 0.35; // can azaldıkça artar

    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.62
    );

    gradient.addColorStop(0, "rgba(150, 0, 0, 0)");
    gradient.addColorStop(1, `rgba(150, 0, 0, ${0.25 + 0.2 * strength + 0.15 * pulse})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawHurtFlash() {
    if (hurtFlash <= 0) return;

    ctx.fillStyle = `rgba(200, 0, 0, ${(hurtFlash / 12) * 0.22})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// BOMBA, YANGIN VE KALP ATIŞI SESLERİ
function playThrowSound() {
    if (!soundEnabled || !audioCtx) return;

    playNoise(0.18, "bandpass", 500, 1600, 0.25);
}

function playExplosionSound() {
    if (!soundEnabled || !audioCtx) return;

    playNoise(0.6, "lowpass", 2200, 120, 1.0);
    playNoise(0.08, "highpass", 3000, 1500, 0.5);
    playThump(0.45, 100, 28, 1.0);
}

function playFireSound() {
    if (!soundEnabled || !audioCtx) return;

    playNoise(0.08, "highpass", 3500, 2000, 0.45); // cam kırılması
    playNoise(0.5, "bandpass", 900, 300, 0.4);     // alev patlaması
    playThump(0.2, 150, 50, 0.4);
}

function playHeartbeat() {
    if (!soundEnabled || !audioCtx) return;

    playThump(0.12, 70, 40, 0.6);

    setTimeout(() => {
        if (soundEnabled && audioCtx) playThump(0.1, 60, 38, 0.45);
    }, 180);
}

// EN YÜKSEK SKORLAR (tarayıcıda saklanır, ilk 5)
function loadHighScores() {
    try {
        const raw = loadChoice("scores");
        const list = raw ? JSON.parse(raw) : [];

        return Array.isArray(list) ? list : [];
    } catch (error) {
        return [];
    }
}

function saveHighScore(entry) {
    const list = loadHighScores();
    const previousBest = list.length ? list[0].score : 0;

    list.push(entry);
    list.sort((a, b) => b.score - a.score);

    const top = list.slice(0, 5);
    saveChoice("scores", JSON.stringify(top));

    return {
        list: top,
        isRecord: entry.score > previousBest && entry.score > 0
    };
}

function formatTime(frames) {
    const totalSeconds = Math.floor(frames / 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function renderHighScores(list, currentEntry) {
    highScoreList.innerHTML = list.map((entry) => {
        const css = entry === currentEntry ? "current-score" : "";

        return `<li class="${css}">${entry.score} puan · Dalga ${entry.wave} · ${entry.kills} zombi</li>`;
    }).join("");
}

function updateMenuBest() {
    const list = loadHighScores();

    if (list.length && list[0].score > 0) {
        menuBest.textContent = `🏆 EN YÜKSEK SKOR: ${list[0].score}`;
        menuBest.classList.remove("hidden");
    } else {
        menuBest.classList.add("hidden");
    }
}

updateMenuBest();

// OYUN BİTTİĞİNDE
function endGame() {
    if (gameOver) return;

    gameOver = true;
    mouseDown = false;

    resetJoystick();
    firePointerId = null;

    stopAnimation();

    finalScore.textContent = score;
    finalKills.textContent = kills;
    finalWave.textContent = wave;
    finalTime.textContent = formatTime(frame);

    const entry = { score: score, wave: wave, kills: kills };
    const result = saveHighScore(entry);

    newRecordText.classList.toggle("hidden", !result.isRecord);
    renderHighScores(result.list, entry);
    updateMenuBest();

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
    gap: 130,          // engeller arası en az boşluk (piksel)
    centerClear: 200,  // ortadaki boş bırakılan alanın yarıçapı
    counts: {
        forest: { trees: 7, rocks: 4 },
        winter: { trees: 7, rocks: 3 }
    }
};

// HARİTA TEMALARI
const mapThemes = {
    forest: {
        name: "Orman",
        dangerRing: "rgba(120, 255, 60, 0.18)", // büyük zombinin patlama halkası
        snow: false
    },
    winter: {
        name: "Kış",
        dangerRing: "rgba(30, 110, 20, 0.5)",
        snow: true
    }
};

let selectedMap = "forest";

// Rastgele ağaç ve kaya yerleştir
function createObstacles(themeKey) {
    const list = [];
    const counts = mapSettings.counts[themeKey];

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const types = [
        { type: "tree", count: counts.trees },
        { type: "rock", count: counts.rocks }
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
                const tooClose = list.some((o) => {
                    return Math.hypot(o.x - x, o.y - y) < o.r + r + mapSettings.gap;
                });

                if (tooClose) continue;

                list.push({
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

    return list;
}

function generateMap() {
    obstacles = createObstacles(selectedMap);

    buildMapCanvas();
    createSnow();
}

// ORMAN: yaprak tacı
function drawTreeOnMap(m, o) {
    const size = o.size;

    m.fillStyle = "rgba(0, 0, 0, 0.35)";
    m.beginPath();
    m.ellipse(o.x + 10, o.y + 14, size * 0.95, size * 0.8, 0, 0, Math.PI * 2);
    m.fill();

    m.fillStyle = "#1b361b";
    m.beginPath();
    m.arc(o.x, o.y, size, 0, Math.PI * 2);
    m.fill();

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

// KIŞ: karla kaplı çam (üstten bakış, yıldız biçimli dallar)
function drawPineOnMap(m, o) {
    const size = o.size;

    m.fillStyle = "rgba(20, 35, 55, 0.3)";
    m.beginPath();
    m.ellipse(o.x + 10, o.y + 14, size * 0.95, size * 0.8, 0, 0, Math.PI * 2);
    m.fill();

    const layers = [
        { scale: 1.0, color: "#17382a" },
        { scale: 0.78, color: "#1f4a35" },
        { scale: 0.56, color: "#295c41" }
    ];

    layers.forEach((layer, index) => {
        const spikes = 10;
        const outer = size * layer.scale;
        const inner = outer * 0.62;
        const rotation = index * 0.3 + rand(-0.1, 0.1);

        m.beginPath();

        for (let i = 0; i < spikes * 2; i++) {
            const angle = rotation + (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outer : inner;
            const px = o.x + Math.cos(angle) * radius;
            const py = o.y + Math.sin(angle) * radius;

            if (i === 0) m.moveTo(px, py);
            else m.lineTo(px, py);
        }

        m.closePath();
        m.fillStyle = layer.color;
        m.fill();
    });

    // Dallardaki kar
    m.fillStyle = "rgba(245, 250, 255, 0.88)";

    for (let i = 0; i < 7; i++) {
        const angle = rand(0, Math.PI * 2);
        const distance = rand(0, size * 0.65);

        m.beginPath();
        m.arc(
            o.x + Math.cos(angle) * distance - size * 0.08,
            o.y + Math.sin(angle) * distance - size * 0.08,
            rand(size * 0.12, size * 0.22),
            0,
            Math.PI * 2
        );
        m.fill();
    }

    m.fillStyle = "#ffffff";
    m.beginPath();
    m.arc(o.x - size * 0.04, o.y - size * 0.04, size * 0.16, 0, Math.PI * 2);
    m.fill();
}

// Kaya: orman (gri) ve kış (karlı) için ortak çizim
function drawRockOnMap(m, o, snowy) {
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

    m.fillStyle = snowy ? "rgba(20, 35, 55, 0.3)" : "rgba(0, 0, 0, 0.35)";
    m.beginPath();
    m.ellipse(o.x + 6, o.y + 9, size * 1.05, size * 0.85, 0, 0, Math.PI * 2);
    m.fill();

    m.beginPath();
    points.forEach((p, i) => {
        if (i === 0) m.moveTo(p.x, p.y);
        else m.lineTo(p.x, p.y);
    });
    m.closePath();
    m.fillStyle = snowy ? "#6c7782" : "#5b6159";
    m.fill();
    m.strokeStyle = snowy ? "#3f4a54" : "#383d37";
    m.lineWidth = 2;
    m.stroke();

    // Işık vuran yüzey (kışta kar örtüsü)
    const scale = snowy ? 0.66 : 0.6;
    const shift = snowy ? 0.16 : 0.12;

    m.beginPath();
    points.forEach((p, i) => {
        const x = o.x + (p.x - o.x) * scale - size * shift;
        const y = o.y + (p.y - o.y) * scale - size * shift;

        if (i === 0) m.moveTo(x, y);
        else m.lineTo(x, y);
    });
    m.closePath();
    m.fillStyle = snowy ? "rgba(245, 250, 255, 0.92)" : "rgba(160, 168, 156, 0.4)";
    m.fill();
}

// ORMAN ZEMİNİ
function drawForestGround(m, w, h) {
    m.fillStyle = "#182018";
    m.fillRect(0, 0, w, h);

    const patchColors = [
        "rgba(45, 80, 40, 0.10)",
        "rgba(8, 18, 8, 0.14)",
        "rgba(80, 62, 38, 0.10)"
    ];

    for (let i = 0; i < 110; i++) {
        m.fillStyle = patchColors[i % patchColors.length];
        m.beginPath();
        m.ellipse(rand(0, w), rand(0, h), rand(30, 120), rand(20, 80), rand(0, Math.PI), 0, Math.PI * 2);
        m.fill();
    }

    m.lineWidth = 1.5;
    m.lineCap = "round";

    for (let i = 0; i < 450; i++) {
        const x = rand(0, w);
        const y = rand(0, h);

        m.strokeStyle = `rgba(${rand(60, 100)}, ${rand(110, 150)}, ${rand(50, 80)}, 0.35)`;

        for (let blade = -1; blade <= 1; blade++) {
            m.beginPath();
            m.moveTo(x + blade * 3, y);
            m.lineTo(x + blade * 5, y - rand(5, 10));
            m.stroke();
        }
    }

    for (let i = 0; i < 70; i++) {
        m.fillStyle = "rgba(120, 125, 115, 0.35)";
        m.beginPath();
        m.arc(rand(0, w), rand(0, h), rand(1.5, 3.5), 0, Math.PI * 2);
        m.fill();
    }

    for (let i = 0; i < 14; i++) {
        const bx = rand(30, w - 30);
        const by = rand(30, h - 30);

        for (let blob = 0; blob < 4; blob++) {
            m.fillStyle = blob % 2 === 0 ? "#223f22" : "#2b4f2b";
            m.beginPath();
            m.arc(bx + rand(-12, 12), by + rand(-8, 8), rand(9, 16), 0, Math.PI * 2);
            m.fill();
        }
    }
}

// KIŞ ZEMİNİ: karlı arazi, kar yığınları, donmuş su birikintileri
function drawWinterGround(m, w, h) {
    m.fillStyle = "#a9b8c4";
    m.fillRect(0, 0, w, h);

    const patchColors = [
        "rgba(240, 247, 252, 0.20)",
        "rgba(90, 115, 140, 0.14)",
        "rgba(70, 90, 110, 0.10)"
    ];

    for (let i = 0; i < 110; i++) {
        m.fillStyle = patchColors[i % patchColors.length];
        m.beginPath();
        m.ellipse(rand(0, w), rand(0, h), rand(30, 120), rand(20, 80), rand(0, Math.PI), 0, Math.PI * 2);
        m.fill();
    }

    // Kar yığınları (altlarında gölge)
    for (let i = 0; i < 45; i++) {
        const x = rand(0, w);
        const y = rand(0, h);
        const rx = rand(35, 90);
        const ry = rand(14, 34);
        const rotation = rand(-0.3, 0.3);

        m.fillStyle = "rgba(100, 125, 150, 0.22)";
        m.beginPath();
        m.ellipse(x + 4, y + 6, rx, ry, rotation, 0, Math.PI * 2);
        m.fill();

        m.fillStyle = "rgba(248, 252, 255, 0.45)";
        m.beginPath();
        m.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
        m.fill();
    }

    // Donmuş su birikintileri
    for (let i = 0; i < 5; i++) {
        m.fillStyle = "rgba(140, 185, 215, 0.45)";
        m.strokeStyle = "rgba(225, 242, 255, 0.6)";
        m.lineWidth = 2;
        m.beginPath();
        m.ellipse(rand(80, w - 80), rand(80, h - 80), rand(30, 60), rand(16, 30), rand(0, Math.PI), 0, Math.PI * 2);
        m.fill();
        m.stroke();
    }

    // Karın altından çıkan kuru otlar
    m.lineWidth = 1.5;
    m.lineCap = "round";
    m.strokeStyle = "rgba(95, 85, 72, 0.55)";

    for (let i = 0; i < 140; i++) {
        const x = rand(0, w);
        const y = rand(0, h);

        for (let blade = -1; blade <= 1; blade++) {
            m.beginPath();
            m.moveTo(x + blade * 3, y);
            m.lineTo(x + blade * 5, y - rand(5, 10));
            m.stroke();
        }
    }

    // Kar parıltısı
    for (let i = 0; i < 140; i++) {
        m.fillStyle = "rgba(255, 255, 255, 0.7)";
        m.beginPath();
        m.arc(rand(0, w), rand(0, h), rand(0.8, 2), 0, Math.PI * 2);
        m.fill();
    }

    // Karlı çalılar
    for (let i = 0; i < 10; i++) {
        const bx = rand(30, w - 30);
        const by = rand(30, h - 30);

        for (let blob = 0; blob < 4; blob++) {
            m.fillStyle = blob % 2 === 0 ? "#2c4a45" : "#35564f";
            m.beginPath();
            m.arc(bx + rand(-12, 12), by + rand(-8, 8), rand(9, 15), 0, Math.PI * 2);
            m.fill();
        }

        m.fillStyle = "rgba(248, 252, 255, 0.85)";
        m.beginPath();
        m.arc(bx - 3, by - 5, rand(8, 12), 0, Math.PI * 2);
        m.fill();
    }
}

// Seçilen temaya göre zemini ve engelleri verilen canvas'a çiz
function drawMapScene(m, themeKey, list, w, h) {
    if (themeKey === "winter") {
        drawWinterGround(m, w, h);
    } else {
        drawForestGround(m, w, h);
    }

    for (const o of list) {
        if (o.type === "tree") {
            if (themeKey === "winter") drawPineOnMap(m, o);
            else drawTreeOnMap(m, o);
        } else {
            drawRockOnMap(m, o, themeKey === "winter");
        }
    }

    // Kenarları karartan atmosfer
    const vignette = m.createRadialGradient(
        w / 2, h / 2, h * 0.35,
        w / 2, h / 2, w * 0.65
    );

    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(
        1,
        themeKey === "winter" ? "rgba(10, 25, 45, 0.4)" : "rgba(0, 0, 0, 0.45)"
    );

    m.fillStyle = vignette;
    m.fillRect(0, 0, w, h);
}

// Zemini ve engelleri bir kez çiz (her karede tekrar çizmeyelim diye)
function buildMapCanvas() {
    if (!mapCanvas) {
        mapCanvas = document.createElement("canvas");
    }

    mapCanvas.width = canvas.width;
    mapCanvas.height = canvas.height;

    drawMapScene(
        mapCanvas.getContext("2d"),
        selectedMap,
        obstacles,
        canvas.width,
        canvas.height
    );
}

// KAR YAĞIŞI (sadece kış haritasında)
function createSnow() {
    snowflakes = [];

    if (!mapThemes[selectedMap].snow) return;

    for (let i = 0; i < 130; i++) {
        snowflakes.push({
            x: rand(0, canvas.width),
            y: rand(0, canvas.height),
            speed: rand(0.6, 1.8),
            size: rand(1, 3),
            phase: rand(0, 100)
        });
    }
}

function updateSnow() {
    for (const flake of snowflakes) {
        flake.y += flake.speed;
        flake.x += Math.sin((frame + flake.phase) * 0.03) * 0.5 + 0.6;

        if (flake.y > canvas.height) {
            flake.y = -5;
            flake.x = rand(0, canvas.width);
        }

        if (flake.x > canvas.width) {
            flake.x = 0;
        }
    }
}

function drawSnow() {
    if (snowflakes.length === 0) return;

    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();

    for (const flake of snowflakes) {
        ctx.moveTo(flake.x + flake.size, flake.y);
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
    }

    ctx.fill();
    ctx.restore();
}

// HARİTA SEÇİMİ (menüde küçük önizlemeler de aynı çizim koduyla yapılır)
function renderMapPreviews() {
    document.querySelectorAll("[data-preview]").forEach((previewCanvas) => {
        const key = previewCanvas.dataset.preview;

        if (!mapThemes[key]) return;

        const temp = document.createElement("canvas");
        temp.width = canvas.width;
        temp.height = canvas.height;

        drawMapScene(
            temp.getContext("2d"),
            key,
            createObstacles(key),
            canvas.width,
            canvas.height
        );

        previewCanvas
            .getContext("2d")
            .drawImage(temp, 0, 0, previewCanvas.width, previewCanvas.height);
    });
}

function selectMap(key, save = true) {
    if (!mapThemes[key]) return;

    document.querySelectorAll("[data-map]").forEach((item) => {
        item.classList.toggle("selected", item.dataset.map === key);
    });

    selectedMap = key;

    if (save) saveChoice("map", key);
}

document.querySelectorAll("[data-map]").forEach((card) => {
    card.addEventListener("click", () => {
        selectMap(card.dataset.map);
    });
});

selectMap(loadChoice("map") || selectedMap, false);
renderMapPreviews();

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
    // Seçilen karakterin özelliklerini uygula
    const stats = characterStats[selectedCharacter] || characterStats.player;

    player.speed = stats.speed;
    player.maxHealth = stats.maxHealth;
    player.health = player.maxHealth;
    player.damageCooldown = 0;

    reloadMultiplier = stats.reloadMultiplier;
    healMultiplier = stats.healMultiplier;
    grenadePower = stats.grenadePower;
    fireDurationMultiplier = stats.fireDuration;

    grenadeCount = stats.grenades;
    molotovCount = stats.molotovs;
    selectedThrowable = "grenade";
    throwCooldown = 0;
    thrown = [];
    fires = [];

    kills = 0;
    shakeTimer = 0;
    hurtFlash = 0;
    muzzleFlash = 0;
    resetStains();

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
    updateThrowText();

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
    updateThrown();
    updateFires();
    updateEffects();

    moveZombies();
    updateBombs();
    moveBullets();
    checkCollisions();
}

// ÇİZİM
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Ekran sarsıntısı
    if (shakeTimer > 0) {
        const magnitude = shakeStrength * (shakeTimer / shakeMax);

        ctx.translate(
            (Math.random() * 2 - 1) * magnitude,
            (Math.random() * 2 - 1) * magnitude
        );
    }

    drawBackground();
    drawStains();
    drawPickups();
    drawFires();
    drawPlayer();
    drawMuzzleFlash();
    drawZombies();
    drawBombs();
    drawThrown();
    drawBullets();
    drawExplosions();
    drawAimPreview();
    drawReloadBar();
    drawSnow();

    ctx.restore();

    drawLowHealth();
    drawHurtFlash();
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
    cancelCountdown();

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

    // Menü kaydırılabilir bir sayfa, o yüzden tam ekrandan çık
    exitFullscreen();
}

pauseMenuButton.addEventListener("click", returnToMenu);
menuButton.addEventListener("click", returnToMenu);

// YATAY EKRAN KONTROLÜ
function updateOrientationWarning() {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;

    if (isMobile && isPortrait && gameStarted) {
        orientationWarning.classList.remove("hidden");

        // Uyarı açıkken oyun arkada akıp gitmesin
        if (!isPaused && !gameOver) {
            pauseGame();
        }
    } else {
        orientationWarning.classList.add("hidden");
    }
}

window.addEventListener("resize", updateOrientationWarning);
window.addEventListener("orientationchange", updateOrientationWarning);