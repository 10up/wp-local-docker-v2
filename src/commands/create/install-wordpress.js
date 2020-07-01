const envUtils = require( '../../env-utils' );

async function downloadWordPress( wordpressType, compose, cwd, log, spinner ) {
    spinner.start( 'Downloading WordPress...' );
    if ( wordpressType === 'dev' ) {
        await compose.exec( 'phpfpm', 'git clone git://develop.git.wordpress.org/ .', { cwd, log } );

        await compose.run( '10up/wpcorebuild:latest', 'npm install', {
            cwd,
            log,
            composeOptions: [
                '--rm',
                `-v ${cwd}/wordpress:/usr/src/app`,
                `-v ${envUtils.cacheVolume}:/var/www/.npm`,
            ],
        } );

        await compose.run( '10up/wpcorebuild:latest', 'grunt', {
            cwd,
            log,
            composeOptions: [
                '--rm',
                `-v ${cwd}/wordpress:/usr/src/app`,
            ],
        } );

        spinner.succeed( 'Development version of WordPress is downloaded...' );
    } else {
        await compose.exec( 'phpfpm', 'wp core download --version=latest --force', { cwd, log } );
        spinner.succeed( 'WordPress is downloaded...' );
    }
}

async function configure( envSlug, compose, cwd, log, spinner ) {
    const command = `wp config create --force --dbname=${envSlug} --dbuser=wordpress --dbpass=password --dbhost=mysql`;

    spinner.start( 'Configuring WordPress...' );
    await compose.exec( 'phpfpm', command, { cwd, log } );
    spinner.succeed( 'WordPress config is created...' );
}

async function install( answers, compose, cwd, log, spinner ) {
    const http = answers.addHttps ? 'https' : 'http';
    const command = [ 'wp core' ];

    switch ( answers.wordpressType ) {
        case 'single':
        case 'dev':
            command.push( 'install' );
            break;
        case 'subdirectory':
            command.push( 'multisite-install' );
            break;
        case 'subdomain':
            command.push( 'multisite-install' );
            command.push( '--subdomains' );
            break;
        default:
            throw Error( 'Invalid Installation Type' );
    }

    command.push( `--url=${http}://${answers.hostname}` );
    command.push( `--title="${answers.title}"` );
    command.push( `--admin_user="${answers.username}"` );
    command.push( `--admin_password="${answers.password}"` );
    command.push( `--admin_email="${answers.email}"` );

    spinner.start( 'Installing WordPress...' );
    await compose.exec( 'phpfpm', command, { cwd, log } );
    spinner.succeed( 'WordPress is installed...' );
}

async function setRewrites( compose, cwd, log, spinner ) {
    spinner.start( 'Setting rewrite rules structure to /%postname%/...' );
    await compose.exec( 'phpfpm', 'wp rewrite structure /%postname%/', { cwd, log } );
    spinner.succeed( 'Rewrite rules structure is updated to /%postname%/...' );
}

async function emptyContent( compose, cwd, log, spinner ) {
    spinner.start( 'Removing the default WordPress content...' );

    await compose.exec( 'phpfpm', 'wp site empty --yes', { cwd, log } );
    await compose.exec( 'phpfpm', 'wp plugin delete hello akismet', { cwd, log } );
    await compose.exec( 'phpfpm', 'wp theme delete twentyfifteen twentysixteen twentyseventeen twentyeighteen twentynineteen', { cwd, log } );
    await compose.exec( 'phpfpm', 'wp widget delete search-2 recent-posts-2 recent-comments-2 archives-2 categories-2 meta-2', { cwd, log } );

    spinner.succeed( 'The default content is removed...' );
}

module.exports = function makeInstallWordPress( compose, spinner ) {
    return async ( envSlug, answers ) => {
        const { wordpress, wordpressType, emptyContent: clearContent } = answers;
        if ( ! wordpress ) {
            return;
        }

        try {
            const cwd = await envUtils.envPath( envSlug );
            const log = false;

            await downloadWordPress( wordpressType, compose, cwd, log, spinner );
            await configure( envSlug, compose, cwd, log, spinner );
            await install( answers, compose, cwd, log, spinner );
            await setRewrites( compose, cwd, log, spinner );

            if ( clearContent ) {
                await emptyContent( compose, cwd, log, spinner );
            }
        } catch( error ) {
            spinner.stop();
            if ( error.err ) {
                throw new Error( error.err );
            }
        }
    };
};
