const chalk = require( 'chalk' );
const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require( 'inquirer' );
const promptValidators = require( './prompt-validators' );

// Tracks current config
let config = null;

const getConfigDirectory = function() {
    return path.join( os.homedir(), '.wplocaldocker' );
};

const getConfigFilePath = function() {
    return path.join( getConfigDirectory(), 'config.json' );
};

const checkIfConfigured = async function() {
    if ( await fs.exists( getConfigFilePath() ) ) {
        return true;
    }

    return false;
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
    if ( config === null ) {
        await read();
    }

    return config[ key ];
};

const set = async function( key, value ) {
    if ( config === null ) {
        await read();
    }

    config[ key ] = value;

    await write();
};

const prompt = async function() {
    let currentDir = await get( 'sitesPath' );
    let currentHosts = await get( 'manageHosts' );

    let defaultDir = path.join( os.homedir(), 'wp-local-docker-sites' );
    let questions = [
        {
            name: 'sitesPath',
            type: 'input',
            message: "What directory would you like WP Local Docker to create environments within?",
            default: currentDir || defaultDir,
            validate: promptValidators.validateNotEmpty,
            filter: resolveHome,
            transformer: resolveHome,
        },
        {
            name: 'manageHosts',
            type: 'confirm',
            message: "Would you like WP Local Docker to manage your hosts file?",
            default: currentHosts !== undefined ? currentHosts : true,
        }
    ];

    let answers = await inquirer.prompt( questions );

    return answers;
};

const promptUnconfigured = async function() {
    let defaultDir = path.join( os.homedir(), 'wp-local-docker-sites' );
    let questions = [
        {
            name: 'useDefaults',
            type: 'confirm',
            message: "WP Local Docker is not configured. Would you like to configure using default settings?",
            default: '',
            validate: promptValidators.validateNotEmpty,
        }
    ];

    let answers = await inquirer.prompt( questions );

    if ( answers.useDefaults === true ) {
        await configureDefaults();
    } else {
        await command();
    }
};

const configureDefaults = async function() {
    let defaultDir = path.join( os.homedir(), 'wp-local-docker-sites' );

    let configuration = {
        'sitesPath': defaultDir,
        'manageHosts': true,
    };

    await configure( configuration );
};

const configure = async function( configuration ) {
    let sitesPath = path.resolve( configuration.sitesPath );

    // Attempt to create the sites directory
    try {
        await fs.ensureDir( sitesPath );
    } catch (ex) {
        console.error( "Error: Could not create directory for environments!" );
        process.exit(1);
    }

    // Make sure we can write to the sites directory
    try {
        let testfile = path.join( sitesPath, 'testfile' );
        await fs.ensureFile( testfile );
        await fs.remove( testfile );
    } catch (ex) {
        console.error( "Error: The environment directory is not writable" );
        process.exit(1);
    }

    await set( 'sitesPath', sitesPath );
    await set( 'manageHosts', configuration.manageHosts );

    console.log( chalk.green( 'Successfully Configured WP Local Docker!' ) );
    console.log();
};

const command = async function() {
    // not really any options for this command, but setting up the same structure anyways
    let answers = await prompt();
    await configure( answers );
};

module.exports = { command, promptUnconfigured, configureDefaults, checkIfConfigured, get, set, getConfigDirectory };
