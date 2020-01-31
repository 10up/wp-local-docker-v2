const chalk = require( 'chalk' );
const os = require( 'os' );
const fs = require( 'fs-extra' );
const path = require( 'path' );
const inquirer = require( 'inquirer' );
const promptValidators = require( './prompt-validators' );
const rootPath = path.dirname( require.main.filename );
const globalPath = path.join( rootPath, 'global' );


// Tracks current config
let config = null;

const getConfigDirectory = function() {
    return path.join( os.homedir(), '.wplocaldocker' );
};

const getConfigFilePath = function() {
    return path.join( getConfigDirectory(), 'config.json' );
};

const checkIfConfigured = async function() {
    return await fs.exists( getConfigFilePath() );
};

const resolveHome = function( input ) {
    return input.replace( '~', os.homedir() );
};

const write = async function() {
    // Make sure we have our config directory present
    await fs.ensureDir( getConfigDirectory() );
    await fs.writeJson( getConfigFilePath(), config );
};

const read = async function() {
    let readConfig = {};

    if ( await fs.exists( getConfigFilePath() ) ) {
        readConfig = await fs.readJson( getConfigFilePath() );
    }

    config = Object.assign( {}, readConfig );
};

const get = async function( key ) {
    const defaults = getDefaults();

    if ( config === null ) {
        await read();
    }

    return ( typeof config[ key ] === 'undefined' ) ? defaults[ key ] : config[ key ];
};

const set = async function( key, value ) {
    if ( config === null ) {
        await read();
    }

    config[ key ] = value;

    await write();
};

const getDefaults = function() {
    return {
        sitesPath: path.join( os.homedir(), 'wp-local-docker-sites' ),
        snapshotsPath: path.join( os.homedir(), '.wpsnapshots' ),
        manageHosts: true,
        overwriteGlobal: true
    };
};

const prompt = async function() {
    const defaults = getDefaults();

    const currentDir = await get( 'sitesPath' );
    const currentHosts = await get( 'manageHosts' );
    const currentSnapshots = await get( 'snapshotsPath' );

    const questions = [
        {
            name: 'sitesPath',
            type: 'input',
            message: 'What directory would you like WP Local Docker to create environments within?',
            default: currentDir || defaults.sitesPath,
            validate: promptValidators.validateNotEmpty,
            filter: resolveHome,
            transformer: resolveHome,
        },
        {
            name: 'snapshotsPath',
            type: 'input',
            message: 'What directory would you like to store WP Snapshots data within?',
            default: currentSnapshots || defaults.snapshotsPath,
            validate: promptValidators.validateNotEmpty,
            filter: resolveHome,
            transformer: resolveHome,
        },
        {
            name: 'manageHosts',
            type: 'confirm',
            message: 'Would you like WP Local Docker to manage your hosts file?',
            default: currentHosts !== undefined ? currentHosts : defaults.manageHosts,
        }
    ];

    if ( fs.exists( path.join( getConfigDirectory(), 'global' ) ) ) {
        questions.push(
            {
                name: 'overwriteGlobal',
                type: 'confirm',
                message: 'Do you want to reset your global services configuration? This will reset any customizations you have made.',
                default: false
            }
        );
    }

    const answers = await inquirer.prompt( questions );

    return answers;
};

const promptUnconfigured = async function() {
    const questions = [
        {
            name: 'useDefaults',
            type: 'confirm',
            message: 'WP Local Docker is not configured. Would you like to configure using default settings?',
            default: '',
            validate: promptValidators.validateNotEmpty,
        }
    ];

    const answers = await inquirer.prompt( questions );

    if ( answers.useDefaults === true ) {
        await configureDefaults();
    } else {
        await command();
    }
};

const configureDefaults = async function() {
    const defaults = getDefaults();

    await configure( defaults );
};

const configure = async function( configuration ) {
    const sitesPath = path.resolve( configuration.sitesPath );
    const snapshotsPath = path.resolve( configuration.snapshotsPath );
    const globalServicesPath = path.join( getConfigDirectory(), 'global' );

    if ( configuration.overwriteGlobal ) {
        try {
            await fs.ensureDir( globalServicesPath );
            await fs.copy( globalPath, path.join( getConfigDirectory(), 'global' ) );
        } catch ( ex ) {
            console.log( ex );
            console.error( 'Error: Unable to copy global services definition!' );
            process.exit( 1 );
        }
    }

    // Attempt to create the sites directory
    try {
        await fs.ensureDir( sitesPath );
    } catch ( ex ) {
        console.error( 'Error: Could not create directory for environments!' );
        process.exit( 1 );
    }

    // Make sure we can write to the sites directory
    try {
        const testfile = path.join( sitesPath, 'testfile' );
        await fs.ensureFile( testfile );
        await fs.remove( testfile );
    } catch ( ex ) {
        console.error( 'Error: The environment directory is not writable' );
        process.exit( 1 );
    }

    // Make sure we can write to the snapshots
    try {
        const testfile = path.join( snapshotsPath, 'testfile' );
        await fs.ensureFile( testfile );
        await fs.remove( testfile );
    } catch ( ex ) {
        console.error( 'Error: The snapshots directory is not writable' );
        process.exit( 1 );
    }

    await set( 'sitesPath', sitesPath );
    await set( 'snapshotsPath', snapshotsPath );
    await set( 'manageHosts', configuration.manageHosts );


    console.log( chalk.green( 'Successfully Configured WP Local Docker!' ) );
    console.log();
};

const command = async function() {
    // not really any options for this command, but setting up the same structure anyways
    const answers = await prompt();
    await configure( answers );
};

/**
 * Create the NGINX directive to set a media URL proxy
 *
 * @param  string proxy     	The URL to set the proxy to
 * @param  string curConfig 	Complete content of the existing config file
 * @return string          		New content for the config file
 */
const createProxyConfig = ( proxy, curConfig ) => {

    const proxyMarkup = 'location @production {\r\n' // eslint-disable-line prefer-template
		+ '        resolver 8.8.8.8;\r\n'
		+ '        proxy_pass ' + proxy + '/$uri;\r\n'
		+ '    }';

    const proxyMapObj = {
        '#{TRY_PROXY}': 'try_files $uri @production;',
        '#{PROXY_URL}': proxyMarkup
    };

    const re = new RegExp( Object.keys( proxyMapObj ).join( '|' ), 'gi' );

    const newConfig = curConfig.replace( re, function( matched ) {
        return proxyMapObj[matched];
    } );

    return curConfig.replace( curConfig, newConfig );
};

module.exports = { command, promptUnconfigured, configureDefaults, checkIfConfigured, get, set, getConfigDirectory, createProxyConfig };
