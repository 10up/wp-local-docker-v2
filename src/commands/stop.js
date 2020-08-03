const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );
const envUtils = require( '../env-utils' );
const { stop, stopAll } = require( '../environment' );

exports.command = 'stop [<env>]';
exports.desc = 'Stops a specific docker environment.';

exports.builder = function( yargs ) {
    yargs.positional( 'env', {
        type: 'string',
        describe: 'Optional. Environment name.',
    } );
};

exports.handler = makeCommand( {}, async ( { verbose, env } ) => {
    const spinner = ! verbose ? makeSpinner() : undefined;
    const all = env === 'all';

    let envName = ( env || '' ).trim();
    if ( ! envName ) {
        envName = await envUtils.parseEnvFromCWD();
    }

    if ( ! envName ) {
        envName = await envUtils.promptEnv();
    }

    if ( all ) {
        await stopAll( spinner );
    } else {
        await stop( envName, spinner );
    }
} );
