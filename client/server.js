import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Sajikan file statis hasil build dari folder 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// 2. Tangani routing SPA (Single Page Application) React
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 3. Jalankan server pada port yang disediakan Hostinger atau default 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));