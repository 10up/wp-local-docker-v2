const os = require( 'os' );
const path = require( 'path' );

const chalk = require( 'chalk' );
const fsExtra = require( 'fs-extra' );

// Tracks current config
let config = null;

function getConfigDirectory() {
	return path.join( os.homedir(), '.wplocaldocker' );
}

function getConfigFilePath() {
	return path.join( getConfigDirectory(), 'config.json' );
}

function getGlobalDirectory() {
	return path.join( getConfigDirectory(), 'global' );
}

async function getSslCertsDirectory( create = true ) {
	const dir = path.join( getGlobalDirectory(), 'ssl-certs' );

	if ( create ) {
		await fsExtra.ensureDir( dir, { mode: 0o755 } );
	}

	return dir;
}

async function checkIfConfigured() {
	const exists = await fsExtra.pathExists( getConfigFilePath() );
	return exists;
}

async function write() {
	// Make sure we have our config directory present
	await fsExtra.ensureDir( getConfigDirectory(), { mode: 0o755 } );
	await fsExtra.writeJson( getConfigFilePath(), config );
}

async function read() {
	let readConfig = {};

	const exists = await fsExtra.pathExists( getConfigFilePath() );
	if ( exists ) {
		readConfig = await fsExtra.readJson( getConfigFilePath() );
	}

	config = Object.assign( {}, readConfig );
}

async function get( key ) {
	const defaults = getDefaults();

	if ( config === null ) {
		await read();
	}

	return ( typeof config[ key ] === 'undefined' ) ? defaults[ key ] : config[ key ];
}

async function set( key, value ) {
	if ( config === null ) {
		await read();
	}

	config[ key ] = value;

	await write();
}

function getDefaults() {
	return {
		sitesPath: path.join( os.homedir(), 'wp-local-docker-sites' ),
		snapshotsPath: path.join( os.homedir(), '.wpsnapshots' ),
		manageHosts: true,
		overwriteGlobal: true
	};
}

async function configureDefaults() {
	await configure( getDefaults() );
}

async function configure( configuration ) {
	const sitesPath = path.resolve( configuration.sitesPath );
	const snapshotsPath = path.resolve( configuration.snapshotsPath );
	const globalServicesPath = getGlobalDirectory();

	if ( configuration.overwriteGlobal ) {
		try {
			const localGlobalPath = path.join(
				path.dirname( require.main.filename ),
				'global',
			);

			await fsExtra.ensureDir( globalServicesPath, { mode: 0o755 } );
			await fsExtra.copy( localGlobalPath, globalServicesPath );
		} catch ( ex ) {
			console.error( ex );
			console.error( 'Error: Unable to copy global services definition!' );
			process.exit( 1 );
		}
	}

	// Attempt to create the sites directory
	try {
		await fsExtra.ensureDir( sitesPath, { mode: 0o755 } );
	} catch ( ex ) {
		console.error( 'Error: Could not create directory for environments!' );
		process.exit( 1 );
	}

	// Make sure we can write to the sites directory
	try {
		const testfile = path.join( sitesPath, 'testfile' );
		await fsExtra.ensureFile( testfile );
		await fsExtra.remove( testfile );
	} catch ( ex ) {
		console.error( 'Error: The environment directory is not writable' );
		process.exit( 1 );
	}

	// Make sure we can write to the snapshots
	try {
		const testfile = path.join( snapshotsPath, 'testfile' );
		await fsExtra.ensureFile( testfile );
		await fsExtra.remove( testfile );
	} catch ( ex ) {
		console.error( 'Error: The snapshots directory is not writable' );
		process.exit( 1 );
	}

	await set( 'sitesPath', sitesPath );
	await set( 'snapshotsPath', snapshotsPath );
	await set( 'manageHosts', configuration.manageHosts );

	console.log( chalk.green( 'Successfully Configured WP Local Docker!' ) );
}

/**
 * Create the NGINX directive to set a media URL proxy
 *
 * @param {string} proxy The URL to set the proxy to
 * @param {string} curConfig  content of the existing config file
 * @return {string} New content for the config file
 */
function createProxyConfig( proxy, curConfig ) {
	const proxyMarkup = [];

	// the number of spaces in the proxy markpu is intended
	proxyMarkup.push( 'location @production {' );
	proxyMarkup.push( '        resolver 8.8.8.8;' );
	proxyMarkup.push( `        proxy_pass ${ proxy }/$uri;` );
	proxyMarkup.push( '    }' );

	const proxyMapObj = {
		'#{TRY_PROXY}': 'try_files $uri @production;',
		'#{PROXY_URL}': proxyMarkup.join( os.EOL ),
	};

	const re = new RegExp( Object.keys( proxyMapObj ).join( '|' ), 'gi' );
	const newConfig = curConfig.replace( re, function( matched ) {
		return proxyMapObj[matched];
	} );

	return curConfig.replace( curConfig, newConfig );
}

module.exports = {
	configure,
	configureDefaults,
	checkIfConfigured,
	getDefaults,
	get,
	set,
	getConfigDirectory,
	getGlobalDirectory,
	getSslCertsDirectory,
	createProxyConfig,
};
