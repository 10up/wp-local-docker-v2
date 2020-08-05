const { EOL } = require( 'os' );

const inquirer = require( 'inquirer' );
const chalk = require( 'chalk' );
const fsExtra = require( 'fs-extra' );
const sudo = require( 'sudo-prompt' );
const compose = require( 'docker-compose' );
const which = require( 'which' );
const mkcert = require( 'mkcert-prebuilt' );
const shellEscape = require( 'shell-escape' );

const { startGlobal } = require( '../gateway' );
const environment = require( '../environment' );
const envUtils = require( '../env-utils' );

const makeSpinner = require( '../utils/make-spinner' );
const makeCommand = require( '../utils/make-command' );
const makeBoxen = require( '../utils/make-boxen' );
const { replaceLinks } = require( '../utils/make-link' );

const makeInquirer = require( './create/inquirer' );
const makeDockerCompose = require( './create/make-docker-compose' );
const makeFs = require( './create/make-fs' );
const makeSaveYamlFile = require( './create/save-yaml-file' );
const makeCopyConfigs = require( './create/copy-configs' );
const makeDatabase = require( './create/create-database' );
const makeInstallWordPress = require( './create/install-wordpress' );
const makeSaveJsonFile = require( './create/save-json-file' );
const makeUpdateHosts = require( './create/update-hosts' );
const makeCert = require( './create/make-cert' );

async function createCommand( spinner, defaults = {} ) {
    const answers = await makeInquirer( inquirer )( defaults );

    const hostname = Array.isArray( answers.domain ) ? answers.domain[0] : answers.domain;
    const envHosts = Array.isArray( answers.domain ) ? answers.domain : [ answers.domain ];
    const envSlug = envUtils.envSlug( hostname );

    const paths = await makeFs( chalk, spinner )( hostname );
    const saveYaml = makeSaveYamlFile( chalk, spinner, paths['/'] );

    const dockerComposer = await makeDockerCompose( spinner )( envSlug, envHosts, answers );
    await saveYaml( 'docker-compose.yml', dockerComposer );
    await saveYaml( 'wp-cli.yml', { ssh: 'docker-compose:phpfpm' } );

    await makeCopyConfigs( spinner, fsExtra )( paths, answers );
    await makeCert( spinner, mkcert, shellEscape )( envSlug, envHosts );

    await startGlobal( spinner );
    await makeDatabase( spinner )( envSlug );
    await environment.start( envSlug, spinner );

    await makeInstallWordPress( compose, spinner )( envSlug, hostname, answers.wordpress );

    await makeSaveJsonFile( chalk, spinner, paths['/'] )( '.config.json', { envHosts } );
    await makeUpdateHosts( which, sudo, spinner )( envHosts );

    return {
        ...answers,
        paths,
    };
}

exports.command = 'create';
exports.desc = 'Create a new docker environment.';
exports.aliases = [ 'new' ];

exports.handler = makeCommand( async () => {
    const spinner = makeSpinner();
    const answers = await createCommand( spinner, {} );

    if ( !! answers.wordpress && answers.wordpress.type === 'subdomain' ) {
        spinner.info( 'Note: Subdomain multisites require any additional subdomains to be added manually to your hosts file!' );
    }

    let info = `Successfully Created Site!${ EOL }${ EOL }`;
    const links = {};

    ( Array.isArray( answers.domain ) ? answers.domain : [ answers.domain ] ).forEach( ( host ) => {
        const home = `https://${ host }/`;
        const admin = `https://${ host }/wp-admin/`;

        links[ home ] = home;
        links[ admin ] = admin;

        info += `Homepage: ${ home }${ EOL }`;
        info += `WP admin: ${ admin }${ EOL }`;
        info += EOL;
    } );

    console.log( replaceLinks( makeBoxen()( info ), links ) );
} );

exports.createCommand = createCommand;
