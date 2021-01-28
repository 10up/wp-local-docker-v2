const path = require( 'path' );
const { execSync } = require( 'child_process' );

const updateCheck = require( 'update-check' );
const chalk = require( 'chalk' );

const envUtils = require( './env-utils' );

exports.checkIfDockerRunning = function() {
	let output;

	try {
		output = execSync( 'docker system info' );
	} catch {
		return false;
	}

	if ( output.toString().toLowerCase().indexOf( 'version' ) === -1 ) {
		return false;
	}

	return true;
};

exports.checkForUpdates = async function() {
	const pkg = require( path.join( envUtils.rootPath, 'package' ) );
	let update = null;

	try {
		update = await updateCheck( pkg );
	} catch ( err ) {
		console.error( chalk.yellow( 'Failed to automatically check for updates. Please ensure WP Local Docker is up to date.' ) );
	}

	if ( update ) {
		console.warn( chalk.yellow( `WP Local Docker version ${ update.latest } is now available. Please run \`npm update -g wp-local-docker\` to update!` ) );
	}
};
