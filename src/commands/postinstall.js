const { join } = require( 'path' );

const fsExtra = require( 'fs-extra' );
const readYaml = require( 'read-yaml' );
const writeYaml = require( 'write-yaml' );

const { installCA } = require( '../certificates' );
const { getGlobalDirectory } = require( '../configure' );
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
    const yaml = readYaml.sync( globalDockerCompose );

    let changed = false;

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
        await new Promise( resolve => {
            writeYaml( globalDockerCompose, yaml, { 'lineWidth': 500 }, ( err ) => {
                if ( err ) {
                    console.error( err );
                }

                resolve();
            } );
        } );
    }
} );
