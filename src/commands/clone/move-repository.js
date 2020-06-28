const { join } = require( 'path' );

module.exports = function makeMoveRepository( { remove, move }, wordpress ) {
    return async ( from, to ) => {
        const dest = join( wordpress, to );
        await remove( dest );
        await move( from, dest );
    };
};
