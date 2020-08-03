const { EOL } = require( 'os' );

const chalk = require( 'chalk' );
const logSymbols = require( 'log-symbols' );

module.exports = function displayMessage( type = 'info', message = 'Unexpected error' ) {
    const messageIconColors = { success: 'green', warning: 'yellow', error: 'red', info: 'blue' };
    const errorMessage = `${ EOL }${ logSymbols[type] } ${ message }${ EOL }${ EOL }`;
    process.stderr.write( chalk[messageIconColors[type]]( errorMessage ) );
    process.exit();
};
