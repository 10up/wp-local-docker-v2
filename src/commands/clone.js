const { mkdtempSync } = require( 'fs' );
const { join } = require( 'path' );
const { tmpdir } = require( 'os' );

const ora = require( 'ora' );

const makeExecutor = require( './clone/executor' );
const makeGitClone = require( './clone/git-clone' );

exports.command = 'clone <url> [--branch=<branch>]';

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
};

exports.handler = async function( { url, branch, verbose } ) {
    const spinner = ora( {
        spinner: 'dots',
        color: 'white',
        hideCursor: true,
    } );

    const tempDir = mkdtempSync( join( tmpdir(), 'wpld-' ) );
    const tempDirExecutor = makeExecutor( tempDir, verbose, spinner );

    await makeGitClone( tempDirExecutor )( url, branch );

    spinner.stop();
};
