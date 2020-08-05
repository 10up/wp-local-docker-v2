const envUtils = require( '../../env-utils' );
const { generate } = require( '../../certificates' );
const makeCommand = require( '../../utils/make-command' );
const makeSpinner = require( '../../utils/make-spinner' );

exports.command = 'generate <domains..>';
exports.desc = 'Generates SSL certificates for given domains.';

exports.builder = function( yargs ) {
    yargs.positional( 'domains', {
        describe: 'Domains to include in the certificate',
        type: 'string',
    } );
};

exports.handler = makeCommand( { checkDocker: false }, async ( { domains, env, verbose } ) => {
    const spinner = ! verbose ? makeSpinner() : undefined;

    let envName = ( env || '' ).trim();
    if ( ! envName ) {
        envName = await envUtils.parseEnvFromCWD();
    }

    if ( ! envName ) {
        envName = await envUtils.promptEnv();
    }

    if ( ! spinner ) {
        console.log( 'Generating certificates:' );
    }

    await generate( envName, domains );

    if ( spinner ) {
        spinner.succeed( 'Certificates are generated...' );
    }
} );
