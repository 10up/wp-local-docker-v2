const { EOL } = require( 'os' );

const chalk = require( 'chalk' );
const logSymbols = require( 'log-symbols' );

module.exports = function displayError( message = 'Unexpected error' ) {
    process.stderr.write( chalk.red( `${ EOL }${ logSymbols.error } ${ message }${ EOL }${ EOL }` ) );
    process.exit( 1 );
};
