const path = require( 'path' );
const os = require( 'os' );

const fs = require( 'fs-extra' );

const makeCommand = require( '../utils/make-command' );
const makeSpinner = require( '../utils/make-spinner' );
const envUtils = require( '../env-utils' );
const { images } = require( '../docker-images' );
const { stop, start, upgradeEnv } = require( '../environment' );
const { readYaml, writeYaml } = require( '../utils/yaml' );

exports.command = 'upgrade';
exports.desc = false; // @todo: "false" means that this command is hidden

exports.handler = makeCommand( { checkDocker: false }, async ( { verbose } ) => {
    const spinner = ! verbose ? makeSpinner() : undefined;

    let env = await envUtils.parseEnvFromCWD();
    if ( ! env ) {
        env = await envUtils.promptEnv();
    }

    const envPath = await envUtils.getPathOrError( env );

    // If we got the path from the cwd, we don't have a slug yet, so get it
    const envSlug = envUtils.envSlug( env );

    await stop( envSlug, spinner );

    // Create a backup of the old yaml.
    const dockerCompose = path.join( envPath, 'docker-compose.yml' );
    const yaml = readYaml( dockerCompose );

    try {
        await writeYaml( `${ dockerCompose }.bak`, yaml );
        console.log( `Created backup of previous configuration ${ envSlug }` );
    } catch ( err ) {
        console.log( err );
    }

    // perform the previous upgrade first
    await upgradeEnv( env );

    console.log( 'Copying required files...' );
    await fs.ensureDir( path.join( envPath, '.containers' ) );
    await fs.copy( path.join( envUtils.srcPath, 'containers' ), path.join( envPath, '.containers' ) );

    // Create a new object for the upgrade yaml.
    const upgraded = Object.assign( {}, yaml );

    // Set docker-compose version.
    upgraded.version = '2.2';

    // Upgrade image.
    const phpVersion = yaml.services.phpfpm.image.split( ':' ).pop();
    if ( phpVersion === '5.5' ) {
        console.warn( 'Support for PHP v5.5 was removed in the latest version of WP Local Docker.' );
        console.error( 'This environment cannot be upgraded.  No changes were made.' );

        process.exit( 1 );
    }
    upgraded.services.phpfpm.image = images[`php${ phpVersion }`];

    // Upgrade volume mounts.
    const deprecatedVolumes = [
        './config/php-fpm/php.ini:/usr/local/etc/php/php.ini:cached',
        './config/php-fpm/docker-php-ext-xdebug.ini:/usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini:cached',
        '~/.ssh:/root/.ssh:cached'
    ];
    const volumes = [ ...upgraded.services.phpfpm.volumes ];
    upgraded.services.phpfpm.volumes = volumes.reduce( ( acc, curr ) => {
        if ( deprecatedVolumes.includes( curr ) ) {
            if ( deprecatedVolumes.indexOf( curr ) === 1 ) {
                acc.push( './config/php-fpm/docker-php-ext-xdebug.ini:/etc/php.d/docker-php-ext-xdebug.ini:cached' );
                return acc;
            }
            return acc;
        }
        acc.push( curr );
        return acc;
    }, [] );

    // Add new environmental variables.
    upgraded.services.phpfpm.environment = {
        'ENABLE_XDEBUG': 'false'
    };

    // Unlike Mac and Windows, Docker is a first class citizen on Linux
    // and doesn't have any kind of translation layer between users and the
    // file system. Because of this the phpfpm container will be running as the
    // wrong user. Here we setup the docker-compose.yml file to rebuild the
    // phpfpm container so that it runs as the user who created the project.
    if ( os.platform() == 'linux' ) {
        upgraded.services.phpfpm.image = `wp-php-fpm-dev-${ phpVersion }-${ process.env.USER }`;
        upgraded.services.phpfpm.build = {
            'dockerfile': '.containers/php-fpm',
            'context': '.',
            'args': {
                'PHP_IMAGE': images[`php${ phpVersion }`],
                'CALLING_USER': process.env.USER,
                'CALLING_UID': process.getuid()
            }
        };
        upgraded.services.phpfpm.volumes.push( `~/.ssh:/home/${ process.env.USER }/.ssh:cached` );
    }
    else {
        // the official containers for this project will have a www-data user.
        upgraded.services.phpfpm.volumes.push( '~/.ssh:/home/www-data/.ssh:cached' );
    }

    try {
        await writeYaml( dockerCompose, upgraded );
        console.log( `Finished updating ${ envSlug } for WP Local Docker v2.6` );
    } catch ( err ) {
        console.error( err );
    }

    start( envSlug, spinner );
} );
