import app from "./app.js";
import { logger } from 'shared';

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    logger.info(`The server up and running on port ${PORT}`)
})