const { join } = require( 'path' );
const { readFile, writeFile } = require( 'fs' ).promises;

const { srcPath } = require( '../../env-utils' );
const { createProxyConfig } = require( '../../configure' );

module.exports = function makeCopyConfigs( spinner, { copy } ) {
	return async ( paths, { mediaProxy, wordpress } ) => {
		const envPath = paths['/'];

		await copy( join( srcPath, 'config' ), join( envPath, 'config' ) );
		await copy( join( srcPath, 'containers' ), join( envPath, '.containers' ) );

		if ( mediaProxy ) {
			const { type } = wordpress || {};
			const nginxConfig = type == 'dev' ? 'develop.conf' : 'default.conf';
			const nginxConfigPath = join( envPath, 'config', 'nginx', nginxConfig );

			const curConfig = await readFile( nginxConfigPath, { encoding: 'utf-8' } );
			await writeFile( nginxConfigPath, createProxyConfig( mediaProxy, curConfig ) );
		}

		if ( spinner ) {
			spinner.succeed( 'Configuration files are copied...' );
		} else {
			console.log( 'Copied configuration files.' );
		}
	};
};
