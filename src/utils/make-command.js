const { EOL } = require( 'os' );
const chalk = require( 'chalk' );
const logSymbols = require( 'log-symbols' );
const makeDocker = require( '../utils/make-docker' );

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

module.exports = function makeCommand( options = {}, { error }, command ) {
    const { checkDocker = true } = options;
    return ( ...params ) => {
        // Check if Docker is running.
        if ( checkDocker === true ) {
            pingDocker().then( result => {
                if ( result === false ) {
                    console.log( logSymbols.error, chalk.red( 'Docker is not running...' ) );
                    process.exit();
                }
            } );
        }
        return command( ...params ).catch( ( err ) => {
            process.stderr.write( chalk.red( `${ EOL }${ error } ${ err.message || 'Unexpected error' }${ EOL }${ EOL }` ) );
            process.exit( 1 );
        } );
    };
};
