const fs = require( 'fs' );
const path = require( 'path' );
const { EOL } = require( 'os' );

const nc = require( 'netcat/client' );

const envUtils = require( './env-utils' );
const config = require( './configure' );
const makeDocker = require( './utils/make-docker' );
const compose = require( './utils/docker-compose' );

// Tracks if we've started global inside of this session
let started = false;

async function ensureNetworkExists( docker, spinner ) {
	if ( ! spinner ) {
		console.log( 'Ensuring global network exists' );
	}

	const networkName = 'wplocaldocker';

	const network = docker.getNetwork( networkName );
	const data = await network.inspect().catch( () => false );
	if ( data ) {
		if ( ! spinner ) {
			console.log( ' - Network exists' );
		}
		return;
	}

	if ( ! spinner ) {
		console.log( ' - Creating network' );
	}

	// --ip-range is only half of the subnet, so that we have a bunch of addresses in front to assign manually
	await docker.createNetwork( {
		Name: networkName,
		IPAM: {
			Driver: 'default',
			Config: [
				{
					Subnet: '10.0.0.0/16',
					IPRange: '10.0.128.0/17',
					Gateway: '10.0.0.1',
				},
			],
		},
	} );
}

async function removeNetwork( docker, spinner ) {
	if ( ! spinner ) {
		console.log( 'Removing Global Network' );
	}

	const network = docker.getNetwork( 'wplocaldocker' );
	const data = await network.inspect().catch( () => false );
	if ( ! data ) {
		return;
	}

	await network.remove();

	if ( ! spinner ) {
		console.log( ' - Network Removed' );
	}
}

async function ensureCacheExists( docker, spinner ) {
	if ( ! spinner ) {
		console.log( 'Ensuring global cache volume exists' );
	}

	const volume = docker.getVolume( envUtils.cacheVolume );
	const data = await volume.inspect().catch( () => false );

	if ( data ) {
		if ( ! spinner ) {
			console.log( ' - Volume Exists' );
		}
	} else {
		if ( ! spinner ) {
			console.log( ' - Creating Volume' );
		}

		await docker.createVolume( {
			Name: envUtils.cacheVolume,
		} );
	}
}

async function removeCacheVolume( docker, spinner ) {
	const volume = docker.getVolume( envUtils.cacheVolume );
	const data = await volume.inspect().catch( () => false );

	if ( data ) {
		if ( ! spinner ) {
			console.log( 'Removing cache volume' );
		}

		await volume.remove();

		if ( ! spinner ) {
			console.log( ' - Volume Removed' );
		}
	}
}

/**
 * Wait for MySQL to come up and finish initializing.
 *
 * The first the time the MySQL container starts it will initialize the data directory. It will open port 3306
 * but not send data back when connected to, instead closing the connection immediately. netcat is used
 * here to connect the the MySQL port and will resolve the promise once MySQL sends data back indicating
 * MySQL is ready for work.
 */
function waitForDB( spinner ) {
	if ( spinner ) {
		spinner.start( 'Waiting for MySQL...' );
	} else {
		console.log( 'Waiting for MySQL...' );
	}

	return new Promise( ( resolve ) => {
		const interval = setInterval( () => {
			const netcat = new nc();

			netcat.address( '127.0.0.1' );
			netcat.port( 3306 );
			netcat.connect();
			netcat.on( 'data', function(  ) {
				netcat.close();

				if ( spinner ) {
					spinner.succeed( 'MySQL has started...' );
				}

				clearInterval( interval );
				resolve();
			} );
		}, 1000 );
	} );
}

async function startGateway( spinner, pull ) {
	let cwd = path.join( config.getConfigDirectory(), 'global' );
	if ( ! fs.existsSync( cwd ) ) {
		cwd = envUtils.globalPath;
	}

	const composeArgs = {
		cwd,
		log: !spinner,
	};

	if ( pull ) {
		if ( spinner ) {
			spinner.start( 'Pulling latest images for global services...' );
		} else {
			console.log( 'Pulling latest images for global services' );
		}

		await compose.pullAll( composeArgs );

		if ( spinner ) {
			spinner.succeed( 'Global images are up-to-date...' );
		}
	}

	if ( spinner ) {
		spinner.start( 'Ensuring global services are running...' );
	} else {
		console.log( 'Ensuring global services are running' );
	}

	await compose.upAll( composeArgs );

	if ( spinner ) {
		spinner.succeed( 'Global services are running...' );
	}

	await waitForDB( spinner );
}

async function stopGateway( spinner ) {
	if ( spinner ) {
		spinner.start( 'Stopping global services...' );
	} else {
		console.log( 'Stopping global services' );
	}

	await compose.down( {
		cwd: envUtils.globalPath,
		log: !spinner,
	} );

	if ( spinner ) {
		spinner.succeed( 'Global services are stopped...' );
	} else {
		console.log();
	}
}

async function restartGateway( spinner ) {
	if ( spinner ) {
		spinner.start( 'Restarting global services...' );
	} else {
		console.log( 'Restarting global services' );
	}

	await compose.restartAll( {
		cwd: envUtils.globalPath,
		log: !spinner,
	} );

	if ( spinner ) {
		spinner.succeed( 'Global services are restarted...' );
	} else {
		console.log();
	}
}

async function startGlobal( spinner, pull ) {
	if ( started === true ) {
		return;
	}

	const docker = makeDocker();

	await ensureNetworkExists( docker, spinner );
	await ensureCacheExists( docker, spinner );
	await startGateway( spinner, pull );

	started = true;
}

async function stopGlobal( spinner ) {
	try {
		const docker = makeDocker();

		await stopGateway( spinner );
		await removeNetwork( docker, spinner );
	} catch ( err ) {
		process.stderr.write( err.toString() + EOL );
	}

	started = false;
}

async function restartGlobal( spinner ) {
	try {
		const docker = makeDocker();

		await ensureNetworkExists( docker, spinner );
		await restartGateway( spinner );

		started = true;
	} catch ( err ) {
		process.stderr.write( err.toString() + EOL );
	}
}

module.exports = {
	startGlobal,
	stopGlobal,
	restartGlobal,
	removeCacheVolume,
	ensureCacheExists,
	ensureNetworkExists,
};
