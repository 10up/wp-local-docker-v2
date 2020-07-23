const { join } = require( 'path' );
const { stat, mkdir } = require( 'fs' ).promises;

const envUtils = require( '../../env-utils' );

module.exports = function makeFs( chalk, spinner ) {
    return async ( hostname ) => {
        const envPath = await envUtils.envPath( hostname );
        const envPathStats = await stat( envPath ).catch( () => false );

        // @ts-ignore
        if ( envPathStats && envPathStats.isDirectory() ) {
            throw new Error( `Error: ${hostname} environment already exists. To recreate the environment, please delete it first by running \`10updocker delete ${hostname}\`` );
        }

        spinner.start( 'Making root directory...' );
        await mkdir( envPath );
        spinner.succeed( `${ chalk.cyan( envPath ) } directory is created...` );

        const wordpress = join( envPath, 'wordpress' );
        spinner.start( 'Making wordpress directory...' );
        await mkdir( wordpress );
        spinner.succeed( `${ chalk.cyan( wordpress ) } directory is created...` );

        const containers = join( envPath, '.containers' );
        spinner.start( 'Making containers directory...' );
        await mkdir( containers );
        spinner.succeed( `${ chalk.cyan( containers ) } directory is created...` );

        const config = join( envPath, 'config' );
        spinner.start( 'Making config direcotry...' );
        await mkdir( config );
        spinner.succeed( `${ chalk.cyan( config ) } directory is crated...` );

        return {
            '/': envPath,
            wordpress,
            containers,
            config,
        };
    };
};
