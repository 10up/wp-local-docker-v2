const path = require( 'path' );
const { execSync } = require( 'child_process' );

const fsExtra = require( 'fs-extra' );
const which = require( 'which' );
const shellEscape = require( 'shell-escape' );

const { images } = require( '../docker-images' );
const { ensureNetworkExists, startGlobal } = require( '../gateway' );
const envUtils = require( '../env-utils' );

async function ensureImageExists( spinner, docker ) {
	const image = docker.getImage( images.wpsnapshots );
	const data = await image.inspect().catch( () => false );
	if ( ! data ) {
		if ( spinner ) {
			spinner.start( 'Pulling wpsnapshots image...' );
		} else {
			console.log( 'Pulling wpsnapshots image' );
		}

		const stream = await docker.pull( images.wpsnapshots );

		await new Promise( ( resolve ) => {
			docker.modem.followProgress( stream, resolve, ( event ) => {
				if ( ! spinner ) {
					return;
				}

				const { id, status, progressDetail } = event;
				const { current, total } = progressDetail || {};
				const progress = total ? ` - ${ Math.ceil( ( current || 0 ) * 100 / total ) }%` : '';

				spinner.text = `Pulling wpsnapshots image: [${ id }] ${ status }${ progress }...`;
			} );
		} );

		if ( spinner ) {
			spinner.succeed( 'The wpsnapshots image has been pulled...' );
		} else {
			console.log( ' - Done' );
		}
	}
}

module.exports = function runSnapshots( spinner, docker ) {
	return async ( env, command, stdio ) => {
		const wpsnapshotsDir = await envUtils.getSnapshotsPath();

		// false catches the case when no subcommand is passed, and we just pass to snapshots to show usage
		const subcommand = command[0];
		const bypassCommands = [ undefined, 'configure', 'help', 'list', 'create-repository' ];
		const noPathCommands = [ undefined, 'configure', 'help', 'list', 'create-repository', 'delete', 'search', 'download' ];

		// Except for a few whitelisted commands, enforce a configuration before proceeding
		if ( bypassCommands.indexOf( subcommand ) === -1 ) {
			// Verify we have a configuration
			const isConfigured = await fsExtra.pathExists( path.join( wpsnapshotsDir, 'config.json' ) );
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

		await ensureImageExists( spinner, docker );
		await ensureNetworkExists( docker, spinner );

		let network = '';
		let flags = '-it';

		const dockerExec = await which( 'docker' );
		const volumes = [ `-v "${ wpsnapshotsDir }:/home/wpsnapshots/.wpsnapshots"` ];

		if ( envPath ) {
			await startGlobal( spinner );
			network = ' --network wplocaldocker';
			volumes.push( `-v "${ envPath }/wordpress:/var/www/html"` );
			command.push( '--db_user=root' );
		}

		if ( stdio === 'pipe' ) {
			flags = '-i';
		}

		return execSync( `${ dockerExec } run ${ flags } --rm${ network } ${ volumes.join( ' ' ) } ${ images.wpsnapshots } ${ shellEscape( command ) }`, {
			// @ts-ignore
			stdio,
			maxBuffer: 1 << 20, // 1mb
			encoding: 'utf-8',
		} );
	};
};
