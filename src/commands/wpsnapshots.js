const path = require( 'path' );
const { execSync } = require( 'child_process' );

const chalk = require( 'chalk' );
const fs = require( 'fs-extra' );
const logSymbols = require( 'log-symbols' );
const shellEscape = require( 'shell-escape' );

const envUtils = require( '../env-utils' );
const gateway = require( '../gateway' );
const configure = require( '../configure' );
const { images } = require( '../docker-images' );
const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );

exports.commmand = 'wpsnapshots';
exports.aliases = [ 'snapshots' ];
exports.desc = 'Runs a wp snapshots command.';

exports.handler = makeCommand( chalk, logSymbols, async function( { _, env, verbose } ) {
    const spinner = ! verbose ? makeSpinner() : undefined;

    // Ensure that the wpsnapshots folder is created and owned by the current user versus letting docker create it so we can enforce proper ownership later
    const wpsnapshotsDir = await configure.get( 'snapshotsPath' );
    await fs.ensureDir( wpsnapshotsDir );

    // Get everything after the snapshots command, so we can pass to the docker container
    let wpsnapshotsCommand = false;
    const command = [];
    for ( let i = 0; i < process.argv.length; i++ ) {
        if ( process.argv[i].toLowerCase() === _[0] ) {
            wpsnapshotsCommand = true;
        } else if ( wpsnapshotsCommand ) {
            command.push( process.argv[i] );
        }
    }

    // false catches the case when no subcommand is passed, and we just pass to snapshots to show usage
    const subcommand = command[0];
    const bypassCommands = [ undefined, 'configure', 'help', 'list', 'create-repository' ];
    const noPathCommands = [ undefined, 'configure', 'help', 'list', 'create-repository', 'delete', 'search', 'download' ];

    // Except for a few whitelisted commands, enforce a configuration before proceeding
    if ( bypassCommands.indexOf( subcommand ) === -1 ) {
        // Verify we have a configuration
        const isConfigured = await fs.pathExists( path.join( wpsnapshotsDir, 'config.json' ) );
        if ( ! isConfigured ) {
            throw new Error( 'WP Snapshots does not have a configuration file. Please run "10updocker wpsnapshots configure" before continuing.' );
        }
    }

    // These commands can be run without being in the context of a WP install
    let envPath = '';
    if ( noPathCommands.indexOf( subcommand ) === -1 ) {
        if ( env ) {
            envPath = await envUtils.envPath( env ).catch( () => '' );
        }

        if ( ! envPath ) {
            const envSlug = await envUtils.parseOrPromptEnv();
            if ( ! envSlug ) {
                throw new Error( 'Unable to determine which environment to use wp snapshots with. Please run this command from within your environment.' );
            } else {
                envPath = await envUtils.envPath( envSlug ).catch( () => '' );
            }
        }
    }

    if ( ! envPath ) {
        try {
            execSync( `docker run -it --rm -v "${ wpsnapshotsDir }:/home/wpsnapshots/.wpsnapshots" ${ images.wpsnapshots } ${ shellEscape( command ) }`, { stdio: 'inherit' } );
        } catch( e ) {
            // do nothing
        }
    } else {
        await gateway.startGlobal( spinner );

        try {
            execSync( `docker run -it --rm --network wplocaldocker -v "${ envPath }/wordpress:/var/www/html" -v "${ wpsnapshotsDir }:/home/wpsnapshots/.wpsnapshots" ${ images.wpsnapshots } --db_user=root ${ shellEscape( command ) }`, { stdio: 'inherit' } );
        } catch( e ) {
            // do nothing
        }
    }
} );
