const { execSync } = require( 'child_process' );
const { join } = require( 'path' );
const { readFile, writeFile } = require( 'fs' ).promises;

const mkcert = require( 'mkcert' );
const mkcertPrebuilt = require( 'mkcert-prebuilt' );

const envUtil = require( './env-utils' );
const { getSslCertsDirectory } = require( './configure' );

function getCARoot() {
	return execSync( `${ mkcertPrebuilt } -CAROOT`, { encoding: 'utf-8' } ).trim();
}

function installCA( verbose = false ) {
	try {
		execSync( `${ mkcertPrebuilt } -install`, {
			stdio: verbose ? 'inherit' : 'ignore',
		} );
	} catch ( err ) {
		if ( verbose ) {
			console.error( err );
		}

		return false;
	}

	return true;
}

async function generate( envName, hosts ) {
	const envSlug = envUtil.envSlug( envName );
	const allHosts = [ ...hosts, ...hosts.map( ( host ) => `*.${ host }` ) ];

	const caRoot = getCARoot();
	const caKey = await readFile( join( caRoot, 'rootCA-key.pem' ), { encoding: 'utf-8' } );
	const caCert = await readFile( join( caRoot, 'rootCA.pem' ), { encoding: 'utf-8' } );

	const cert = await mkcert.createCert( {
		caCert,
		caKey,
		domains: allHosts,
		validityDays: 365,
	} );

	const sslDir = await getSslCertsDirectory();
	const filename = join( sslDir, envSlug );
	const certFile = `${ filename }.crt`;
	const keyFile = `${ filename }.key`;

	await writeFile( certFile, cert.cert );
	await writeFile( keyFile, cert.key );

	return {
		cert: certFile,
		key: keyFile,
	};
}

module.exports = {
	installCA,
	generate,
	getCARoot,
};
