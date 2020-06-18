const { mkdtempSync } = require( 'fs' );
const { join } = require( 'path' );
const { tmpdir } = require( 'os' );

const makeExecutor = require( './clone/executor' );
const makeGitClone = require( './clone/git-clone' );

exports.command = 'clone <url> [--branch]';

exports.desc = 'Clones an environment from a remote repository';

exports.builder = function( yargs ) {
    yargs.positional( 'url', {
        describe: 'A remote repository URL',
        type: 'string',
    } );

    yargs.option( 'b', {
        alias: 'branch',
        description: 'A default branch to checkout',
        default: 'master',
        type: 'string',
    } );
};

exports.handler = function( { url, branch } ) {
    const tempDir = mkdtempSync( join( tmpdir(), 'wpld-' ) );
    const tempDirExecutor = makeExecutor( tempDir );

    makeGitClone( tempDirExecutor )( url, branch );
};
