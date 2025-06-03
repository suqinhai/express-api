const sequelize = require('./mysql');
const routeHandler = require('./routeHandler');

module.exports = {
    ...require('./util'),
    sequelize,
    ...routeHandler
};



