const makeDocker = require( './make-docker' );
const displayError = require( './display-error' );

function makeCommand( options, command ) {
	const cmd = typeof options === 'function' ? options : command;
	const {
		checkDocker = true,
	} = typeof options === 'object' ? options : {};

	return async ( ...params ) => {
		if ( checkDocker === true ) {
			const docker = makeDocker();
			const ping = await docker.ping().catch( () => false );
			if ( ! ping ) {
				displayError( 'Docker is not running...' );
			}
		}

		return cmd( ...params ).catch( ( err ) => {
			displayError( err.message || err.err, err.exitCode );
		} );
	};
}

module.exports = makeCommand;
