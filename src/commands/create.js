const inquirer = require( 'inquirer' );
const chalk = require( 'chalk' );
const logSymbols = require( 'log-symbols' );
const fsExtra = require( 'fs-extra' );
const sudo = require( 'sudo-prompt' );
const compose = require( 'docker-compose' );
const shellescape = require( 'shell-escape' );

const { startGlobal } = require( '../gateway' );
const environment = require( '../environment' );
const envUtils = require( '../env-utils' );

const makeSpinner = require( '../utils/make-spinner' );
const makeCommand = require( '../utils/make-command' );

const makeInquirer = require( './create/inquirer' );
const makeDockerCompose = require( './create/make-docker-compose' );
const makeFs = require( './create/make-fs' );
const makeSaveYamlFile = require( './create/save-yaml-file' );
const makeCopyConfigs = require( './create/copy-configs' );
const makeDatabase = require( './create/create-database' );
const makeInstallWordPress = require( './create/install-wordpress' );
const makeSaveJsonFile = require( './create/save-json-file' );
const makeAllHosts = require( './create/all-hosts' );
const makeUpdateHosts = require( './create/update-hosts' );

async function createCommand( spinner, defaults = {} ) {
    const answers = await makeInquirer( inquirer )( defaults );

    const envHosts = makeAllHosts()( answers );
    const envSlug = envUtils.envSlug( answers.hostname );

    const paths = await makeFs( chalk, spinner )( answers );
    const saveYaml = makeSaveYamlFile( chalk, spinner, paths['/'] );

    const dockerComposer = await makeDockerCompose( spinner )( envHosts, answers );
    await saveYaml( 'docker-compose.yml', dockerComposer );
    await saveYaml( 'wp-cli.yml', { ssh: 'docker-compose:phpfpm' } );

    await makeCopyConfigs( spinner, fsExtra )( paths, answers );

    await startGlobal( spinner );
    await makeDatabase( spinner )( envSlug );
    await environment.start( envSlug, spinner );

    await makeInstallWordPress( shellescape, compose, spinner )( envSlug, answers );

    await makeUpdateHosts( sudo, spinner )( envHosts );
    await makeSaveJsonFile( chalk, spinner, paths['/'] )( '.config.json', { envHosts } );

    return {
        ...answers,
        paths,
    };
}

exports.command = 'create';
exports.desc = 'Create a new docker environment.';

exports.handler = makeCommand( chalk, logSymbols, async () => {
    const spinner = makeSpinner();
    const answers = await createCommand( spinner, {} );

    spinner.succeed( 'Successfully Created Site!' );
    if ( answers.wordpressType === 'subdomain' ) {
        spinner.info( 'Note: Subdomain multisites require any additional subdomains to be added manually to your hosts file!' );
    }
} );

exports.createCommand = createCommand;
