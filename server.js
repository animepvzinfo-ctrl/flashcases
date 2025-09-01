// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const JWT_SECRET = 'este-e-o-segredo-final-e-super-seguro-do-flash-cases';

// --- DADOS COMPLETOS - 10 CAIXAS ---
const boxes = [
    { id: "box_cobalt", name: "Cobalt Starter", price: 0.10, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Package/Package.png", drops: [
        { id: "c_01", name: "Sticker | Glitch", rarity: "common", weight: 60, value: 0.05, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Ghost/Ghost.png" },
        { id: "u_01", name: "P250 | Digital Mesh", rarity: "uncommon", weight: 25, value: 0.45, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Pistol/Pistol.png" },
        { id: "r_01", name: "AK-47 | Lazarus", rarity: "rare", weight: 12, value: 18.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Alien/Alien.png" },
        { id: "l_01", name: "★ Bayonet | Sapphire", rarity: "legendary", weight: 3, value: 1500.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Dagger/Dagger.png" }
    ]},
    { id: "box_voltaic", name: "Voltaic Cache", price: 0.75, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Package/Package.png", drops: [
        { id: "c_02", name: "Patch | High Voltage", rarity: "common", weight: 60, value: 0.10, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/High%20Voltage/High%20Voltage.png" },
        { id: "u_02", name: "MAC-10 | Neon Grid", rarity: "uncommon", weight: 25, value: 1.50, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Pistol/Pistol.png" },
        { id: "r_02", name: "M4A1-S | Blue Phosphor", rarity: "rare", weight: 12, value: 250.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Alien/Alien.png" },
        { id: "l_02", name: "★ Karambit | Doppler", rarity: "legendary", weight: 3, value: 1800.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Dagger/Dagger.png" }
    ]},
    { id: "box_azure", name: "Azure Box", price: 1.50, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Package/Package.png", drops: [
        { id: "c_03", name: "Glock | Moonrise", rarity: "common", weight: 65, value: 0.80, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Pistol/Pistol.png" },
        { id: "u_03", name: "USP-S | Blueprint", rarity: "uncommon", weight: 23, value: 3.50, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Pistol/Pistol.png" },
        { id: "r_03", name: "AWP | Corticera", rarity: "rare", weight: 9, value: 15.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Alien/Alien.png" },
        { id: "l_03", name: "★ M9 Bayonet | Bright Water", rarity: "legendary", weight: 3, value: 700.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Dagger/Dagger.png" }
    ]},
    { id: "box_glacier", name: "Glacier Case", price: 2.25, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Package/Package.png", drops: [
        { id: "c_04", name: "MP9 | Hypnotic", rarity: "common", weight: 60, value: 1.20, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Pistol/Pistol.png" },
        { id: "u_04", name: "Five-SeveN | Coolant", rarity: "uncommon", weight: 25, value: 4.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Pistol/Pistol.png" },
        { id: "r_04", name: "AK-47 | Vulcan", rarity: "rare", weight: 12, value: 300.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Alien/Alien.png" },
        { id: "l_04", name: "★ Sport Gloves | Amphibious", rarity: "legendary", weight: 3, value: 1900.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Dagger/Dagger.png" }
    ]},
    { id: "box_quantum", name: "Quantum Crate", price: 5.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Package/Package.png", drops: [
        { id: "c_05", name: "Sawed-Off | Apocalypto", rarity: "common", weight: 55, value: 2.50, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Pistol/Pistol.png" },
        { id: "u_05", name: "M4A4 | Cyber Security", rarity: "uncommon", weight: 28, value: 10.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Pistol/Pistol.png" },
        { id: "r_05", name: "AWP | Hyper Beast", rarity: "rare", weight: 12, value: 80.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Alien/Alien.png" },
        { id: "l_05", name: "★ Butterfly Knife | Doppler", rarity: "legendary", weight: 5, value: 2200.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Dagger/Dagger.png" }
    ]},
    { id: "box_nebula", name: "Nebula Container", price: 7.50, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Package/Package.png", drops: [
        { id: "u_06", name: "R8 Revolver | Fade", rarity: "uncommon", weight: 60, value: 8.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Pistol/Pistol.png" },
        { id: "r_06", name: "SSG 08 | Dragonfire", rarity: "rare", weight: 30, value: 25.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Alien/Alien.png" },
        { id: "l_06", name: "★ Karambit | Lore", rarity: "legendary", weight: 10, value: 1600.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Dagger/Dagger.png" }
    ]},
    { id: "box_singularity", name: "Singularity Safe", price: 10.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Package/Package.png", drops: [
        { id: "r_07", name: "M4A1-S | Printstream", rarity: "rare", weight: 80, value: 120.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Alien/Alien.png" },
        { id: "l_07", name: "★ Sport Gloves | Vice", rarity: "legendary", weight: 20, value: 1500.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Dagger/Dagger.png" }
    ]},
    { id: "box_rift", name: "Rift Relic", price: 15.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Package/Package.png", drops: [
        { id: "r_08", name: "USP-S | Kill Confirmed", rarity: "rare", weight: 75, value: 90.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Pistol/Pistol.png" },
        { id: "l_08", name: "★ Skeleton Knife | Fade", rarity: "legendary", weight: 25, value: 2500.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Dagger/Dagger.png" }
    ]},
    { id: "box_aether", name: "Aether Artifact", price: 20.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Package/Package.png", drops: [
        { id: "r_09", name: "AK-47 | Fire Serpent", rarity: "rare", weight: 70, value: 600.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Alien/Alien.png" },
        { id: "l_09", name: "★ Specialist Gloves | Crimson Kimono", rarity: "legendary", weight: 30, value: 2800.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Dagger/Dagger.png" }
    ]},
    { id: "box_cyber", name: "Cyber Legend", price: 50.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Package/Package.png", drops: [
        { id: "r_10", name: "AWP | Gungnir", rarity: "rare", weight: 80, value: 8000.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Alien/Alien.png" },
        { id: "l_10", name: "★ Karambit | Emerald", rarity: "legendary", weight: 20, value: 12000.00, imageUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/assets/Dagger/Dagger.png" }
    ]},
];


// --- BANCO DE DADOS ---
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) return console.error("Erro ao conectar ao DB:", err.message);
    console.log('Conectado ao banco de dados SQLite.');
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, passwordHash TEXT NOT NULL, balance REAL NOT NULL DEFAULT 0.50)`);
        db.run(`CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, itemId TEXT, itemName TEXT, itemImageUrl TEXT, itemValue REAL, rarity TEXT, openedAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(userId) REFERENCES users(id))`);
    });
});

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- ROTAS DA API ---
app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 4) return res.status(400).json({ message: 'Usuário e senha (mín. 4 caracteres) são obrigatórios.' });
    const passwordHash = bcrypt.hashSync(password, 10);
    db.run('INSERT INTO users (username, passwordHash) VALUES (?, ?)', [username, passwordHash], function (err) {
        if (err) return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ token });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (!user || !bcrypt.compareSync(password, user.passwordHash)) return res.status(401).json({ message: 'Credenciais inválidas.' });
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token });
    });
});

app.get('/api/me', authMiddleware, (req, res) => {
    db.get('SELECT id, username, balance FROM users WHERE id = ?', [req.user.id], (err, user) => res.json(user));
});

app.get('/api/boxes', authMiddleware, (req, res) => res.json(boxes));

app.post('/api/open', authMiddleware, (req, res) => {
    const { boxId } = req.body;
    const box = boxes.find(b => b.id === boxId);
    if (!box) return res.status(404).json({ message: 'Caixa não encontrada.' });
    
    db.get('SELECT balance FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) return res.status(500).json({ message: "Erro ao consultar usuário." });
        if (user.balance < box.price) return res.status(400).json({ message: 'Saldo insuficiente.' });

        const totalWeight = box.drops.reduce((sum, drop) => sum + drop.weight, 0);
        let random = Math.random() * totalWeight;
        let wonItem;
        for (const drop of box.drops) {
            if (random < drop.weight) { wonItem = drop; break; }
            random -= drop.weight;
        }

        const newBalance = user.balance - box.price;
        db.serialize(() => {
            db.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, req.user.id]);
            db.run('INSERT INTO inventory (userId, itemId, itemName, itemImageUrl, itemValue, rarity) VALUES (?, ?, ?, ?, ?, ?)', [req.user.id, wonItem.id, wonItem.name, wonItem.imageUrl, wonItem.value, wonItem.rarity]);
        });
        
        const randomRoll = Array.from({length: 100}, () => {
            let r = Math.random() * totalWeight;
            let tempItem = box.drops[0];
            for (const drop of box.drops) { if (r < drop.weight) { tempItem = drop; break; } r -= drop.weight; }
            return tempItem;
        });
        randomRoll[95] = wonItem;

        res.json({ item: wonItem, newBalance, randomRoll });

        broadcast({ type: 'activity', payload: { username: req.user.username, itemName: wonItem.name, itemValue: wonItem.value, rarity: wonItem.rarity } });
        updateAndBroadcastLeaderboard();
    });
});

app.post('/api/deposit', authMiddleware, (req, res) => {
    const { amount } = req.body;
    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount <= 0 || depositAmount > 1000) {
        return res.status(400).json({ message: 'Valor de depósito inválido (entre $0.01 e $1000).' });
    }

    const sql = `UPDATE users SET balance = balance + ? WHERE id = ? RETURNING balance`;
    db.get(sql, [depositAmount, req.user.id], function(err, row) {
        if (err) return res.status(500).json({ message: 'Erro ao processar depósito.' });
        res.json({ newBalance: row.balance });
        updateAndBroadcastLeaderboard();
    });
});


// --- SERVINDO O ARQUIVO PRINCIPAL ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// --- WEBSOCKET ---
wss.on('connection', ws => {
    console.log('Cliente WebSocket conectado');
    updateAndBroadcastLeaderboard();
    ws.on('error', console.error);
});

function broadcast(data) { wss.clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(JSON.stringify(data))); }

function updateAndBroadcastLeaderboard() {
    db.all('SELECT username, balance FROM users ORDER BY balance DESC LIMIT 5', [], (err, rows) => {
        if (!err) broadcast({ type: 'leaderboard', payload: rows });
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));