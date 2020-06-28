const database = require( '../../database' );

module.exports = function makeDatabase() {
    return async ( envSlug ) => {
        await database.create( envSlug );
        await database.assignPrivs( envSlug );
    };
};
