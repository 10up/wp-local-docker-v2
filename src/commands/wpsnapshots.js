const makeDocker = require( '../utils/make-docker' );
const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );
const runSnapshots = require( '../utils/run-snapshots' );

exports.command = 'wpsnapshots <cmd..>';
exports.aliases = [ 'snapshots' ];
exports.desc = 'Runs a wp snapshots command.';

exports.builder = function( yargs ) {
	yargs.positional( 'cmd', {
		describe: 'Command to run',
		type: 'string',
	} );
};

exports.handler = makeCommand( async function( { _, env, verbose } ) {
	const spinner = ! verbose ? makeSpinner() : undefined;

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

	try {
		const docker = makeDocker();
		const wpsnapshots = runSnapshots( spinner, docker );
		await wpsnapshots( env, command, 'inherit' );
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
} );
