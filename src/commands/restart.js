const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );
const envUtils = require( '../env-utils' );
const { restart, restartAll } = require( '../environment' );

exports.command = 'restart [<env>]';
exports.desc = 'Restarts a specific docker environment.';

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
        await restartAll( spinner );
    } else {
        await restart( envName, spinner );
    }
} );
