const { join } = require( 'path' );
const { readFile, writeFile } = require( 'fs' ).promises;

const { srcPath } = require( '../../env-utils' );
const { createProxyConfig } = require( '../../configure' );

async function updateConfig( envPath, name, cb ) {
	const nginxConfigPath = join( envPath, 'config', 'nginx', name );
	const curConfig = await readFile( nginxConfigPath, { encoding: 'utf-8' } );
	await writeFile( nginxConfigPath, cb( curConfig ) );
}

module.exports = function makeCopyConfigs( spinner, { copy } ) {
	return async ( { paths, mediaProxy, domain } ) => {
		const envPath = paths['/'];

		await copy( join( srcPath, 'config' ), join( envPath, 'config' ) );
		await copy( join( srcPath, 'containers' ), join( envPath, '.containers' ) );

		await updateConfig(
			envPath,
			'develop.conf',
			( config ) => config.replace( '#{MAIN_DOMAIN}', Array.isArray( domain ) ? domain[0] : domain ),
		);

		if ( mediaProxy ) {
			await updateConfig( envPath, 'server.conf', createProxyConfig.bind( null, mediaProxy ) );
		}

		if ( spinner ) {
			spinner.succeed( 'Configuration files are copied...' );
		} else {
			console.log( 'Copied configuration files.' );
		}
	};
};
