const { mkdtempSync } = require( 'fs' );
const { join } = require( 'path' );
const { tmpdir, EOL } = require( 'os' );

const chalk = require( 'chalk' );
const fsExtra = require( 'fs-extra' );

const { replaceLinks } = require( '../utils/make-link' );
const makeSpinner = require( '../utils/make-spinner' );
const makeCommand = require( '../utils/make-command' );
const makeBoxen = require( '../utils/make-boxen' );
const makeMarkdown = require( '../utils/make-markdown' );
const makeDocker = require( '../utils/make-docker' );
const runSnapshots = require( '../utils/run-snapshots' );

const makeGitClone = require( './clone/git-clone' );
const makePullConfig = require( './clone/pull-config' );
const makeMoveRepository = require( './clone/move-repository' );
const makePullSnapshot = require( './clone/pull-snapshot' );
const { createCommand } = require( './create' );

exports.command = 'clone <url> [--branch=<branch>] [--config=<config>]';

exports.desc = 'Clones an environment from a remote repository.';

exports.builder = function( yargs ) {
	yargs.positional( 'url', {
		describe: 'A remote repository URL',
		type: 'string',
	} );

	yargs.option( 'b', {
		alias: 'branch',
		description: 'Branch name to checkout',
		type: 'string',
	} );

	yargs.option( 'c', {
		alias: 'config',
		description: 'Config file name',
		default: 'wp-local-docker.config.js',
		type: 'string',
	} );
};

exports.handler = makeCommand( async ( { url, branch, config, verbose } ) => {
	const tempDir = mkdtempSync( join( tmpdir(), 'wpld-' ) );
	const spinner = ! verbose ? makeSpinner() : undefined;

	// clone repository
	await makeGitClone( spinner )( tempDir, url, branch );
	// read configuration from the config file in the repo if it exists
	const configuration = await makePullConfig( spinner )( tempDir, config );
	// create environment
	const answers = await createCommand( spinner, configuration || {} );
	// @ts-ignore
	const { mountPoint, snapshot, paths, instructions, envSlug } = answers;

	// move repository
	await makeMoveRepository( chalk, spinner, fsExtra, paths.wordpress )( tempDir, mountPoint || 'wp-content' );

	// pull snapshot if available
	if ( snapshot ) {
		try {
			const docker = makeDocker();
			const wpsnapshots = runSnapshots( spinner, docker );
			const pullSnapshot = makePullSnapshot( spinner, wpsnapshots );

			await pullSnapshot(
				envSlug,
				Array.isArray( answers.domain ) ? answers.domain[0] : answers.domain,
				snapshot,
			);
		} catch ( err ) {
			if ( spinner ) {
				if ( spinner.isSpinning ) {
					spinner.stop();
				}

				spinner.fail( err );
			} else {
				console.error( err );
			}
		}
	}

	let info = `Successfully Cloned Site!${ EOL }${ EOL }`;
	const links = {};
	const http = answers.certs ? 'https' : 'http';

	( Array.isArray( answers.domain ) ? answers.domain : [ answers.domain ] ).forEach( ( host ) => {
		const home = `${ http }://${ host }/`;
		const admin = `${ http }://${ host }/wp-admin/`;

		links[ home ] = home;
		links[ admin ] = admin;

		info += `Homepage: ${ home }${ EOL }`;
		info += `WP admin: ${ admin }${ EOL }`;
		info += EOL;
	} );

	info = replaceLinks( makeBoxen()( info ), links );
	console.log( EOL + info );

	const markdown = ( instructions || '' ).trim();
	if ( markdown.length > 0 ) {
		console.log( EOL + makeMarkdown()( markdown ) );
	}
} );
