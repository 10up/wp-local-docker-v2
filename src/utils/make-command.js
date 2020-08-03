const makeDocker = require( './make-docker' );
const displayMessage = require( './display-message' );

/**
 * Check if Docker app is running.
 *
 * @return {Promise<boolean|*>}
 */
async function pingDocker() {
    try{
        const docker = makeDocker();
        return await docker.ping();
    } catch( ex ) {
        return false;
    }
}

module.exports = function makeCommand( options = {}, command ) {
    const { checkDocker = true } = options;
    return async ( ...params ) => {
        // Check if Docker is running.
        if ( checkDocker === true ) {
            const ping = await pingDocker().catch( () => false );
            if ( ! ping ) {
                displayMessage( 'error', 'Docker is not running...' );
            }
        }
        return command( ...params ).catch( ( err ) => {
            displayMessage( 'error', err.message );
        } );
    };
};
