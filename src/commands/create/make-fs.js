const { join } = require( 'path' );
const { stat, mkdir } = require( 'fs' ).promises;

const envUtils = require( '../../env-utils' );

module.exports = function makeFs( spinner ) {
    return async ( { hostname } ) => {
        const envPath = await envUtils.envPath( hostname );
        const envPathStats = await stat( envPath ).catch( () => false );

        // @ts-ignore
        if ( envPathStats && envPathStats.isDirectory() ) {
            throw new Error( `Error: ${hostname} environment already exists. To recreate the environment, please delete it first by running \`10updocker delete ${hostname}\`` );
        }

        spinner.start( 'Making root directory...' );
        await mkdir( envPath );
        spinner.succeed( 'Made root directory...' );

        const wordpress = join( envPath, 'wordpress' );
        spinner.start( 'Making wordpress directory...' );
        await mkdir( wordpress );
        spinner.succeed( 'Made wordpress directory...' );

        const containers = join( envPath, '.containers' );
        spinner.start( 'Making containers directory...' );
        await mkdir( containers );
        spinner.succeed( 'Made containers directory...' );

        const config = join( envPath, 'config' );
        spinner.start( 'Making config direcotry...' );
        await mkdir( config );
        spinner.succeed( 'Made config directory...' );

        return {
            '/': envPath,
            wordpress,
            containers,
            config,
        };
    };
};
