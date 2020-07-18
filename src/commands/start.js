const chalk = require( 'chalk' );
const logSymbols = require( 'log-symbols' );

const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );
const envUtils = require( '../env-utils' );
const { startAll, start } = require( '../environment' );

exports.command = 'start [<env>]';
exports.desc = 'Starts a specific docker environment.';

exports.builder = function( yargs ) {
    yargs.positional( 'env', {
        type: 'string',
        describe: 'Optional. Environment name.',
    } );
};

exports.handler = makeCommand( chalk, logSymbols, async ( { verbose, env } ) => {
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
        await startAll( spinner );
    } else {
        await start( envName, spinner );
    }
} );
