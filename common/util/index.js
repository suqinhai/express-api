
const path = require('path');

module.exports.getEnvPath = () => {
    return path.resolve(__dirname, ('../../env/.env.' + process.env.NODE_ENV))
}
