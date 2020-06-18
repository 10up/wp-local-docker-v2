const { mkdtempSync } = require( 'fs' );
const { join } = require( 'path' );
const { tmpdir } = require( 'os' );

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

exports.handler = function( { url, branch, verbose } ) {
    const tempDir = mkdtempSync( join( tmpdir(), 'wpld-' ) );
    const tempDirExecutor = makeExecutor( tempDir, verbose );

    makeGitClone( tempDirExecutor )( url, branch );
};
