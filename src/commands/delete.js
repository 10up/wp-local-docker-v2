const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );
const { resolveEnvironment } = require( '../env-utils' );
const { deleteAll, deleteEnv } = require( '../environment' );

exports.command = 'delete [<env>]';
exports.desc = 'Deletes a specific environment.';
exports.aliases = [ 'remove', 'rm' ];

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
		await deleteAll( spinner );
	} else {
		const envName = await resolveEnvironment( env || '' );
		await deleteEnv( envName, spinner );
	}
} );
