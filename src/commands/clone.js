const { mkdtempSync } = require( 'fs' );
const { join } = require( 'path' );
const { tmpdir } = require( 'os' );

const ora = require( 'ora' );

const makeCommand = require( './clone/make-command' );
const makeExecutor = require( './clone/executor' );
const makeGitClone = require( './clone/git-clone' );
const makePullConfig = require( './clone/pull-config' );
const makeVerifyUrl = require( './clone/verify-url' );

exports.command = 'clone <url> [--branch=<branch>] [--config=<config>]';

exports.desc = 'Clones an environment from a remote repository';

exports.builder = function( yargs ) {
    yargs.positional( 'url', {
        describe: 'A remote repository URL',
        type: 'string',
    } );

    yargs.option( 'b', {
        alias: 'branch',
        description: 'Branch name to checkout',
        default: 'master',
        type: 'string',
    } );

    yargs.option( 'c', {
        alias: 'config',
        description: 'Config file name',
        default: 'wp-local-docker.json',
        type: 'string',
    } );
};

exports.handler = makeCommand( async function( { url, branch, verbose, config } ) {
    const spinner = ora( {
        spinner: 'dots',
        color: 'white',
        hideCursor: true,
    } );

    // verify repository URL
    makeVerifyUrl( spinner )( url );

    const tempDir = mkdtempSync( join( tmpdir(), 'wpld-' ) );
    const tempDirExecutor = makeExecutor( tempDir, verbose, spinner );

    // clone repository
    await makeGitClone( tempDirExecutor )( url, branch );

    // read configuration from the config file in the repo if it exists, otherwise ask questions
    const configuration = await makePullConfig( tempDir, spinner )( config );

    console.log( configuration ); // eslint-disable

    if ( spinner.isSpinning ) {
        spinner.stop();
    }
} );
