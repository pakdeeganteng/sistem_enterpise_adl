const app = require('./apps');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Product Service berjalan di http://localhost:${PORT}`);
});