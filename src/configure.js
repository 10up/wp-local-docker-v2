const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const prompt = require( 'prompt' );
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

const configure = async function() {
    let defaultDir = path.join( os.homedir(), 'wp-local-docker-sites' );
    let prompts = {
        properties: {
            sitesPath: {
                description: "What directory would you like WP Local Docker to create environments within?",
                message: "You must choose a directory to place environments",
                type: 'string',
                required: true,
                default: defaultDir,
                before: resolveHome
            }
        }
    };

    prompt.get( prompts, async function( err, result ) {
        if ( err ) {
            console.log();  // so we don't end up cursor on the old prompt line
            process.exit(1);
        }

        let sitesPath = path.resolve( result.sitesPath );

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

        console.log( 'Success!' );
    });
};

const command = async function() {
    // not really any options for this command, but setting up the same structure anyways
    await configure();
};

module.exports = { command, checkIfConfigured, get, set, getConfigDirectory };
