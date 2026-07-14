import app from "./app.js";
import { logger } from 'shared';
import { syncDatabaseMonitorsWithQueue } from "./services/monitor.service.js";

const PORT = process.env.PORT || 3000

app.listen(PORT, async () => {
    logger.info(`The server up and running on port ${PORT}`);
    try {
        logger.info("Synchronizing database monitors with Redis queue...");
        await syncDatabaseMonitorsWithQueue();
        logger.info("Database monitor synchronization complete.");
    } catch (err) {
        logger.error(err, "Failed to synchronize database monitors");
    }
});