const chalk = require( 'chalk' );
const logSymbols = require( 'log-symbols' );

const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );
const envUtils = require( '../env-utils' );
const { deleteAll, deleteEnv } = require( '../environment' );

exports.command = 'delete [<env>]';
exports.desc = 'Deletes a specific environment.';
exports.aliases = [ 'remove' ];

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
        await deleteAll( spinner );
    } else {
        await deleteEnv( envName, spinner );
    }
} );
