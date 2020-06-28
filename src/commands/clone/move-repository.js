const { join } = require( 'path' );

module.exports = function makeMoveRepository( spinner, { remove, move }, root ) {
    return async ( from, to ) => {
        const dest = join( root, to );

        spinner.start( `Moving cloned repository to ${ to }...` );

        // remove existing directory
        await remove( dest );
        // move cloned repository
        await move( from, dest );

        spinner.succeed( `Moved cloned respository to ${ to }...` );
    };
};
