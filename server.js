// server.js (Versão para Produção no Render com PostgreSQL)
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const { Pool } = require('pg'); // Usa o driver do PostgreSQL
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Lê o segredo JWT das variáveis de ambiente do Render
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-para-ambiente-local';

// --- BANCO DE DADOS POSTGRESQL ---
// O Render fornecerá a DATABASE_URL como uma variável de ambiente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const setupDatabase = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                "passwordHash" TEXT NOT NULL,
                balance NUMERIC(10, 2) NOT NULL DEFAULT 0.50
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                id SERIAL PRIMARY KEY,
                "userId" INTEGER REFERENCES users(id),
                "itemId" TEXT,
                "itemName" TEXT,
                "itemImageUrl" TEXT,
                "itemValue" NUMERIC(10, 2),
                rarity TEXT,
                "openedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Banco de dados PostgreSQL verificado/criado com sucesso.');
    } catch (err) {
        console.error('Erro ao criar tabelas do banco de dados:', err);
    }
};

setupDatabase();

// --- DADOS DAS 10 CAIXAS ---
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

// --- ROTAS DA API (convertidas para async/await com PostgreSQL) ---

app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 4) return res.status(400).json({ message: 'Usuário e senha (mín. 4 caracteres) são obrigatórios.' });
    
    try {
        const passwordHash = bcrypt.hashSync(password, 10);
        const newUserQuery = 'INSERT INTO users (username, "passwordHash") VALUES ($1, $2) RETURNING id, username';
        const { rows } = await pool.query(newUserQuery, [username, passwordHash]);
        const newUser = rows[0];

        const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ token });
    } catch (err) {
        if (err.code === '23505') { // Código de erro para violação de constraint 'UNIQUE'
            return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
        }
        console.error("Erro no signup:", err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = rows[0];

        if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token });
    } catch (err) {
        console.error("Erro no login:", err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

app.get('/api/me', authMiddleware, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, username, balance FROM users WHERE id = $1', [req.user.id]);
        res.json(rows[0]);
    } catch (err) {
        console.error("Erro ao buscar perfil:", err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

app.get('/api/boxes', authMiddleware, (req, res) => res.json(boxes));

app.post('/api/open', authMiddleware, async (req, res) => {
    const { boxId } = req.body;
    const box = boxes.find(b => b.id === boxId);
    if (!box) return res.status(404).json({ message: 'Caixa não encontrada.' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Inicia uma transação

        const { rows } = await client.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
        const user = rows[0];

        if (Number(user.balance) < box.price) {
            return res.status(400).json({ message: 'Saldo insuficiente.' });
        }

        const totalWeight = box.drops.reduce((sum, drop) => sum + drop.weight, 0);
        let random = Math.random() * totalWeight;
        let wonItem;
        for (const drop of box.drops) {
            if (random < drop.weight) { wonItem = drop; break; }
            random -= drop.weight;
        }

        const newBalance = Number(user.balance) - box.price;
        await client.query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, req.user.id]);
        await client.query('INSERT INTO inventory ("userId", "itemId", "itemName", "itemImageUrl", "itemValue", rarity) VALUES ($1, $2, $3, $4, $5, $6)',
            [req.user.id, wonItem.id, wonItem.name, wonItem.imageUrl, wonItem.value, wonItem.rarity]);

        await client.query('COMMIT'); // Finaliza a transação

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
    } catch (err) {
        await client.query('ROLLBACK'); // Desfaz a transação em caso de erro
        console.error("Erro ao abrir caixa:", err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        client.release(); // Libera o cliente de volta para o pool
    }
});

app.post('/api/deposit', authMiddleware, async (req, res) => {
    const { amount } = req.body;
    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount <= 0 || depositAmount > 1000) {
        return res.status(400).json({ message: 'Valor de depósito inválido (entre $0.01 e $1000).' });
    }

    try {
        const { rows } = await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance', [depositAmount, req.user.id]);
        res.json({ newBalance: rows[0].balance });
        updateAndBroadcastLeaderboard();
    } catch (err) {
        console.error("Erro no depósito:", err);
        res.status(500).json({ message: 'Erro ao processar depósito.' });
    }
});

// --- SERVINDO O ARQUIVO PRINCIPAL ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// --- WEBSOCKET ---
wss.on('connection', ws => {
    console.log('Cliente WebSocket conectado');
    updateAndBroadcastLeaderboard();
    ws.on('error', console.error);
});

function broadcast(data) {
    wss.clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(JSON.stringify(data)));
}

async function updateAndBroadcastLeaderboard() {
    try {
        const { rows } = await pool.query('SELECT username, balance FROM users ORDER BY balance DESC LIMIT 5');
        broadcast({ type: 'leaderboard', payload: rows });
    } catch (err) {
        console.error("Erro ao buscar leaderboard:", err);
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
