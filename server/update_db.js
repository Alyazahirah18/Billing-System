const sequelize = require('./config/db');

async function updateSchema() {
    try {
        await sequelize.query("ALTER TABLE ticket MODIFY COLUMN TICKET_STATUS enum('open','on progress','selesai') NOT NULL DEFAULT 'open';");
        console.log("Database schema updated successfully.");
    } catch (error) {
        console.error("Failed to update schema:", error.message);
    } finally {
        process.exit();
    }
}

updateSchema();
