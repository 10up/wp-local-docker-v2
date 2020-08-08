/**
 * Internal dependencies.
 */
const envUtils = require( '../env-utils' );
const makeCommand = require( '../utils/make-command' );
const makeDocker = require( '../utils/make-docker' );
const { replaceLinks } = require( '../utils/make-link' );
const makeTable = require( '../utils/make-table' );

// Add command name, alias and description.
exports.aliases = [ 'ls' ];
exports.command = 'list';
exports.desc = 'Lists all the environments and meta information.';

exports.handler = makeCommand( async () => {
	// Create docker object and make sure it is available.
	const docker = makeDocker();
	// Get all the environments and initialize a status array.
	const environments = await envUtils.getAllEnvironments();
	const envStatus = [ [ 'Name', 'Status', 'URL', 'Home' ] ];
	const links = {};

	// Loop through each environment and add details.
	for ( const envSlug of environments ) {
		// Get path of the current environment to perform dedicated checks.
		const envPath = await envUtils.envPath( envSlug );

		// Get current environment host name, use the starting index.
		const envHosts = await envUtils.getEnvHosts( envPath );
		const hostName = `https://${ envHosts[0] }/`;

		links[ hostName ] = hostName;

		try {
			const containers = await docker.listContainers( { filters: { 'name': [ envSlug ] } } );

			// Check containers availability and push to list with appropriate status.
			envStatus.push( [
				envSlug,
				Array.isArray( containers ) && containers.length ? 'UP' : 'DOWN',
				hostName,
				envPath,
			] );
		} catch( ex ) {
			console.error( ex );
		}
	}

	// Output the environment status.
	console.log( replaceLinks( makeTable( envStatus ), links ) );
} );
