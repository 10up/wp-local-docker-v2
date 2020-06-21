const chalk = require( 'chalk' );
const { error } = require( 'log-symbols' );

module.exports = function makeCommand( command ) {
    return ( ...params ) => {
        return command( ...params ).catch( ( err ) => {
            process.stderr.write( chalk.red( `${ error } ${ err.message }\n` ) );
            process.exit( 1 );
        } );
    };
};
