const { join } = require( 'path' );

const inquirer = require( 'inquirer' );

const { resolveEnvironment, envSlug, envPath } = require( '../../env-utils' );
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
    const envName = await resolveEnvironment( env );
    const slug = envSlug( envName );

    await generateCert( slug, domains, spinner );
    await checkDockerCompose( slug, spinner );
} );

async function generateCert( slug, domains, spinner ) {
    if ( spinner ) {
        spinner.start( 'Generating certificates...' );
    } else {
        console.log( 'Generating certificates:' );
    }

    await generate( slug, domains );

    if ( spinner ) {
        spinner.succeed( 'Certificates are generated...' );
    } else {
        console.log( ' - Done' );
    }
}

async function checkDockerCompose( slug, spinner ) {
    const root = await envPath( slug );
    const filename = join( root, 'docker-compose.yml' );
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
