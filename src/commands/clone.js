const { mkdtempSync } = require( 'fs' );
const { join } = require( 'path' );
const { tmpdir } = require( 'os' );

const ora = require( 'ora' );
const git = require( 'nodegit' );
const chalk = require( 'chalk' );
const logSymbols = require( 'log-symbols' );

const makeCommand = require( './clone/make-command' );
const makeGitClone = require( './clone/git-clone' );
const makePullConfig = require( './clone/pull-config' );

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

exports.handler = makeCommand( chalk, logSymbols, async function( { url, branch, config } ) {
    const tempDir = mkdtempSync( join( tmpdir(), 'wpld-' ) );
    const spinner = ora( {
        spinner: 'dots',
        color: 'white',
        hideCursor: true,
    } );

    // clone repository
    await makeGitClone( spinner, chalk, git )( tempDir, url, branch );

    // read configuration from the config file in the repo if it exists, otherwise ask questions
    const configuration = await makePullConfig( spinner )( tempDir, config );

    console.log( configuration ); // eslint-disable

    if ( spinner.isSpinning ) {
        spinner.stop();
    }
} );
