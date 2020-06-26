const inquirer = require( 'inquirer' );
const chalk = require( 'chalk' );
const logSymbols = require( 'log-symbols' );

const makeSpinner = require( '../utils/make-spinner' );
const makeCommand = require( '../utils/make-command' );

const makeInquirer = require( './create/inquirer' );
const makeDockerCompose = require( './create/make-docker-compose' );
const makeFs = require( './create/make-fs' );
const makeSaveYamlFile = require( './create/save-yaml-file' );

async function createCommand( spinner, defaults = {} ) {
    const answers = await makeInquirer( inquirer )( defaults );
    const paths = await makeFs( spinner )( answers );

    const saveYaml = makeSaveYamlFile( paths['/'] );

    const dockerComposer = await makeDockerCompose()( answers );
    await saveYaml( 'docker-compose.yml', dockerComposer );
    await saveYaml( 'wp-cli.yml', { ssh: 'docker-compose:phpfpm' } );
}

exports.command = 'create';
exports.desc = 'Create a new docker environment.';

exports.handler = makeCommand( chalk, logSymbols, function() {
    const spinner = makeSpinner()();
    return createCommand( spinner );
} );

exports.createCommand = createCommand;
