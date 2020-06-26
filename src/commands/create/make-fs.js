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

        await spinner.promise(
            'Making root directory...',
            mkdir( envPath ),
            'Made root directory...',
        );

        const wordpress = join( envPath, 'wordpress' );
        await spinner.promise(
            'Making wordpress directory...',
            mkdir( wordpress ),
            'Made wordpress directory...',
        );

        const containers = join( envPath, '.containers' );
        await spinner.promise(
            'Making containers directory...',
            mkdir( containers ),
            'Made containers directory...',
        );

        const config = join( envPath, 'config' );
        await spinner.promise(
            'Making config direcotry...',
            mkdir( config ),
            'Made config directory...',
        );

        return {
            '/': envPath,
            wordpress,
            containers,
            config,
        };
    };
};
