const { EOL } = require( 'os' );

const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );
const makeBoxen = require( '../utils/make-boxen' );
const { replaceLinks } = require( '../utils/make-link' );

const envUtils = require( '../env-utils' );
const { startAll, start } = require( '../environment' );

exports.command = 'start [<env>] [--pull]';
exports.desc = 'Starts a specific docker environment.';

exports.builder = function( yargs ) {
	yargs.positional( 'env', {
		type: 'string',
		describe: 'Optional. Environment name.',
	} );

	yargs.option( 'pull', {
		description: 'Pull images when environment starts',
		default: false,
		type: 'boolean',
	} );
};

exports.handler = makeCommand( async ( { verbose, pull, env } ) => {
	const spinner = ! verbose ? makeSpinner() : undefined;
	const all = env === 'all';

	if ( all ) {
		await startAll( spinner, pull );
	} else {
		const envName = await envUtils.resolveEnvironment( env || '' );
		await start( envName, spinner, pull );

		const envPath = await envUtils.getPathOrError( envName, spinner );
		const envHosts = await envUtils.getEnvHosts( envPath );
		const certs = await envUtils.getEnvConfig( envPath, 'certs' );

		if ( Array.isArray( envHosts ) && envHosts.length > 0 ) {
			let info = '';
			const links = {};
			const http = certs ? 'https' : 'http';

			envHosts.forEach( ( host ) => {
				const home = `${ http }://${ host }/`;
				const admin = `${ http }://${ host }/wp-admin/`;

				links[ home ] = home;
				links[ admin ] = admin;

				info += `Homepage: ${ home }${ EOL }`;
				info += `WP admin: ${ admin }${ EOL }`;
				info += EOL;
			} );

			console.log( replaceLinks( makeBoxen()( info ), links ) );
		}
	}
} );
