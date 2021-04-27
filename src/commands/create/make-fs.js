const { join } = require( 'path' );
const { stat, mkdir } = require( 'fs' ).promises;

const envUtils = require( '../../env-utils' );

module.exports = function makeFs( spinner ) {
	return async ( hostname ) => {
		const envPath = await envUtils.envPath( hostname );
		const envPathStats = await stat( envPath ).catch( () => false );

		// @ts-ignore
		if ( envPathStats && envPathStats.isDirectory() ) {
			throw new Error( `Error: ${ hostname } environment already exists. To recreate the environment, please delete it first by running \`10updocker delete ${ hostname }\`` );
		}

		const wordpress = join( envPath, 'wordpress' );
		const containers = join( envPath, '.containers' );
		const config = join( envPath, 'config' );

		const options = {
			mode: 0o755,
			recursive: true,
		};

		await mkdir( envPath, options );
		await mkdir( wordpress, options );
		await mkdir( containers, options );
		await mkdir( config, options );

		if ( spinner ) {
			spinner.succeed( 'Environment directories have been created...' );
		} else {
			console.log( 'Environment directories have been created.' );
		}

		return {
			'/': envPath,
			wordpress,
			containers,
			config,
		};
	};
};
