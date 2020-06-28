const { join } = require( 'path' );
const { readFile, writeFile } = require( 'fs' ).promises;

const { srcPath } = require( '../../env-utils' );
const { createProxyConfig } = require( '../../configure' );

module.exports = function makeCopyConfigs( { copy } ) {
    return async ( paths, { proxy, mediaProxy, wordpressType } ) => {
        const envPath = paths['/'];

        await copy( join( srcPath, 'config' ), join( envPath, 'config' ) );
        await copy( join( srcPath, 'containers' ), join( envPath, '.containers' ) );
	
        if ( mediaProxy === true ) {
            const nginxConfig = wordpressType == 'dev' ? 'develop.conf' : 'default.conf';
            const nginxConfigPath = join( envPath, 'config', 'nginx', nginxConfig );

            const curConfig = await readFile( nginxConfigPath );
            await writeFile( nginxConfigPath, createProxyConfig( proxy, curConfig ) );
        }
    };
};
