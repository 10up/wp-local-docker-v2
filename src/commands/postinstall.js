const { join } = require( 'path' );

const fsExtra = require( 'fs-extra' );

const { installCA } = require( '../certificates' );
const { getGlobalDirectory } = require( '../configure' );
const { writeYaml, readYaml } = require( '../utils/yaml' );
const makeCommand = require( '../utils/make-command' );

exports.command = 'postinstall';
exports.desc = false; // makes this command hidden

exports.handler = makeCommand( async function() {
	const isLocal = await fsExtra.pathExists( join( __dirname, '../../package-lock.json' ) );
	if ( isLocal ) {
		return;
	}

	// install CA in the trust store
	installCA( true );

	// add ssl-certs directory to the global docker-compose.yml
	const globalDir = getGlobalDirectory();
	const globalDockerCompose = join( globalDir, 'docker-compose.yml' );
	const globalDockerComposeExists = await fsExtra.pathExists( globalDockerCompose );
	if ( globalDockerComposeExists ) {
		let changed = false;
		const yaml = readYaml( globalDockerCompose );

		if ( yaml && yaml.services && yaml.services.gateway ) {
			if ( ! yaml.services.gateway.volumes || ! Array.isArray( yaml.services.gateway.volumes ) ) {
				yaml.services.gateway.volumes = [];
			}

			const exists = yaml.services.gateway.volumes.some( ( volume ) => volume.split( ':' )[0] === './ssl-certs' );
			if ( ! exists ) {
				yaml.services.gateway.volumes.push( './ssl-certs:/etc/nginx/certs:ro' );
				changed = true;
			}
		}

		if ( changed ) {
			await writeYaml( globalDockerCompose, yaml ).catch( ( err ) => {
				console.error( err );
			} );
		}
	}
} );
