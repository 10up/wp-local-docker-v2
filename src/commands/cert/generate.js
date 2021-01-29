const { join } = require( 'path' );

const inquirer = require( 'inquirer' );

const envUtils = require( '../../env-utils' );
const { generate } = require( '../../certificates' );
const { readYaml, writeYaml } = require( '../../utils/yaml' );
const makeCommand = require( '../../utils/make-command' );
const makeSpinner = require( '../../utils/make-spinner' );

exports.command = 'generate <domains..>';
exports.desc = 'Generates SSL certificates for given domains.';

exports.builder = function( yargs ) {
	yargs.positional( 'domains', {
		describe: 'Domains to include in the certificate',
		type: 'string',
	} );
};

exports.handler = makeCommand( { checkDocker: false }, async ( { domains, env, verbose } ) => {
	const spinner = ! verbose ? makeSpinner() : undefined;
	const envName = await envUtils.resolveEnvironment( env );
	const slug = envUtils.envSlug( envName );

	const certs = await generateCert( slug, domains, spinner );
	if ( certs ) {
		const envPath = await envUtils.envPath( slug );
		await updateConfig( envPath, certs );
		await checkDockerCompose( envPath, slug, spinner );
	}
} );

async function generateCert( slug, domains, spinner ) {
	if ( spinner ) {
		spinner.start( 'Generating certificates...' );
	} else {
		console.log( 'Generating certificates:' );
	}

	try {
		const certs = await generate( slug, domains );
		if ( certs ) {
			if ( spinner ) {
				spinner.succeed( 'Certificates are generated...' );
			} else {
				console.log( ' - Done' );
			}
		}

		return certs;
	} catch ( err ) {
		if ( spinner ) {
			spinner.fail( `Certificates generation failed... ${ err.toString() }` );
		} else {
			console.log( ` - Failed: ${ err.toString() }` );
		}
	}

	return null;
}

async function updateConfig( envPath, certs ) {
	const config = await envUtils.getEnvConfig( envPath );
	config.certs = certs;
	await envUtils.saveEnvConfig( envPath, config );
}

async function checkDockerCompose( envPath, slug, spinner ) {
	const filename = join( envPath, 'docker-compose.yml' );
	const yaml = readYaml( filename );

	if ( ! yaml || ! yaml.services || ! yaml.services.nginx ) {
		if ( spinner ) {
			spinner.warn( 'Environment\'s docker-compose.yml file hasn\'t been found or it doesn\'t contain nginx service...' );
		} else {
			console.warn( 'Environment\'s docker-compose.yml file hasn\'t been found or it doesn\'t contain nginx service.' );
		}
		return;
	}

	if ( ! yaml.services.nginx.environment ) {
		yaml.services.nginx.environment = {};
	}

	if ( yaml.services.nginx.environment.CERT_NAME === slug ) {
		return;
	}

	const { confirm } = await inquirer.prompt( {
		name: 'confirm',
		type: 'confirm',
		message: 'Do you want to update environment\'s docker-compose.yml file to use the new certificate?',
		default: true,
	} );

	if ( ! confirm ) {
		return;
	}

	yaml.services.nginx.environment.CERT_NAME = slug;

	await writeYaml( filename, yaml );

	if ( spinner ) {
		spinner.succeed( 'Docker compose file has been updated...' );
	} else {
		console.log( 'Docker compose file has been updated.' );
	}
}
