const { EOL } = require( 'os' );

const chalk = require( 'chalk' );

module.exports = function displayError( message = 'Unexpected error', exitCode = 1 ) {
	process.stderr.write( EOL );
	process.stderr.write( chalk.bgHex( '#a70334' )( ' Error ' ) );
	process.stderr.write( chalk.gray( ': ' ) );
	process.stderr.write( chalk.whiteBright( message ) );
	process.stderr.write( EOL );
	process.stderr.write( EOL );
	process.exit( exitCode );
};
