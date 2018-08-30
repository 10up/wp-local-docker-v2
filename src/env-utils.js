/*
 * Trying to keep some variables consistent in name throughout the app, so its clear what each one contains, and
 * we don't run into a case where a variable might actually be the same thing with many different names
 *
 * Variables:
 *  rootPath    Path to the root of WP Local Docker. Every other path is based on this path currently
 *  srcPath     Path to the source code of WP Local Docker generator scripts as well as the config files copied to each project
 *  sitesPath   Path to the folder all environments are ultimately generated inside of
 *  cachePath   Path where we can cache data between docker containers. Ex: npm cache and wp-cli cache
 *  globalPath  Path to the global container installation. Contains the global docker-compose as well as DB Data files
 *
 * Methods & Variables
 *
 * The following have a method in this class (as they vary per environment) and also may be used inline as a variable
 * with the same name
 *
 *  envSlug     Accepts a hostname or envSlug and returns a consistent envSlug
 *  envPath     Path within `sitesPath` for the given environment
 */
const slugify = require( '@sindresorhus/slugify' );
const path = require( 'path' );

const rootPath = path.dirname( require.main.filename );
const srcPath = path.join( rootPath, 'src' );
const sitesPath = path.join( rootPath, 'sites' );
const cachePath = path.join( rootPath, 'cache' );
const globalPath = path.join( rootPath, 'global' );

const envSlug = function( env ) {
    return slugify( env );
};

const envPath = function( env ) {
    let envPath = path.join( sitesPath, envSlug( env ) );

    return envPath;
};

const parseEnvFromCWD = function() {
    let cwd = process.cwd();
    if ( cwd.indexOf( sitesPath ) === -1 ) {
        return false;
    }

    if ( cwd === sitesPath ) {
        return false;
    }

    // Strip the base sitepath from the path
    cwd = cwd.replace( sitesPath, '' ).replace( /^\//i, '' );

    // First segment is now the envSlug, get rid of the rest
    cwd = cwd.split( '/' )[0];

    return cwd;
};

module.exports = { rootPath, srcPath, sitesPath, cachePath, globalPath, envSlug, envPath, parseEnvFromCWD };
