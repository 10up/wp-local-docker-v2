const { EOL } = require( 'os' );

module.exports = function makeCommand( chalk, { error }, command ) {
    return ( ...params ) => {
        return command( ...params ).catch( ( err ) => {
            process.stderr.write( chalk.red( `${ error } ${ err.message }${ EOL }` ) );
            process.exit( 1 );
        } );
    };
};
