const { join } = require( 'path' );

module.exports = function makeMoveRepository( chmodr, chalk, spinner, { remove, move }, root ) {
    return async ( from, to ) => {
        const dest = join( root, to );

        spinner.start( `Moving cloned repository to ${ chalk.cyan( to ) }...` );

        // remove existing directory
        await remove( dest );
        // move cloned repository
        await move( from, dest );
        // change permissions
        await new Promise( ( resolve ) => {
            chmodr( dest, 0o755, resolve );
        } );

        spinner.succeed( `The cloned respository is moved to ${ chalk.cyan( to ) }...` );
    };
};
