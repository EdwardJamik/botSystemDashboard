function isValidTelegramBotToken(token) {
    const tokenRegex = /^\d+:[A-Za-z0-9_-]{35}$/;

    if (!tokenRegex.test(token)) {
        return false;
    }

    const [botId, secretPart] = token.split(':');

    if (isNaN(botId) || botId.length < 3 || botId.length > 10) {
        return false;
    }

    if (secretPart.length !== 35) {
        return false;
    }

    const validChars = /^[A-Za-z0-9_-]+$/;
    if (!validChars.test(secretPart)) {
        return false;
    }

    return true;
}

module.exports = isValidTelegramBotToken