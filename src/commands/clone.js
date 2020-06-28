const { mkdtempSync } = require( 'fs' );
const { join } = require( 'path' );
const { tmpdir } = require( 'os' );

const git = require( 'nodegit' );
const chalk = require( 'chalk' );
const logSymbols = require( 'log-symbols' );
const inquirer = require( 'inquirer' );
const fsExtra = require( 'fs-extra' );

const makeSpinner = require( '../utils/make-spinner' );
const makeCommand = require( '../utils/make-command' );

const makeGitClone = require( './clone/git-clone' );
const makePullConfig = require( './clone/pull-config' );
const makeInquirer = require( './create/inquirer' );
const makeMoveRepository = require( './clone/move-repository' );

const { createCommand } = require( './create' );

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

exports.handler = makeCommand( chalk, logSymbols, async ( { url, branch, config } ) => {
    const tempDir = mkdtempSync( join( tmpdir(), 'wpld-' ) );
    const spinner = makeSpinner()();

    // clone repository
    await makeGitClone( spinner, chalk, git, inquirer )( tempDir, url, branch );

    // read configuration from the config file in the repo if it exists, otherwise ask questions
    const configuration = await makePullConfig( spinner )( tempDir, config );
    const answers = await makeInquirer( inquirer )( configuration );

    // create environment
    const {
        mount_point: mountPoint,
        snapshot_id: snapshotId,
        paths,
    } = await createCommand( spinner, answers );

    // move repository
    await makeMoveRepository( fsExtra, paths.wordpress )( tempDir, mountPoint || 'wp-content' );

    if ( snapshotId ) {
        // @todo: run wpsnapshots
    }

    if ( spinner.isSpinning ) {
        spinner.stop();
    }
} );
