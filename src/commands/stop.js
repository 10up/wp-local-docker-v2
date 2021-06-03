const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );
const { resolveEnvironment } = require( '../env-utils' );
const { stop, stopAll } = require( '../environment' );

exports.command = 'stop [<env>]';
exports.desc = 'Stops a specific docker environment.';

exports.builder = function( yargs ) {
	yargs.positional( 'env', {
		type: 'string',
		describe: 'Optional. Environment name.',
	} );
};

exports.handler = makeCommand( async ( { verbose, env } ) => {
	const spinner = ! verbose ? makeSpinner() : undefined;
	const all = env === 'all';

	if ( all ) {
		await stopAll( spinner );
	} else {
		const envName = await resolveEnvironment( env || '' );
		await stop( envName, spinner );
	}
} );
