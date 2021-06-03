const { EOL } = require( 'os' );

const inquirer = require( 'inquirer' );
const fsExtra = require( 'fs-extra' );
const sudo = require( 'sudo-prompt' );
const which = require( 'which' );
const chalk = require( 'chalk' );

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
	const settings = {
		...answers,
		envSlug: '',
		paths: {},
		certs: {},
	};

	const hostname = Array.isArray( settings.domain ) ? settings.domain[0] : settings.domain;
	const envHosts = Array.isArray( settings.domain ) ? settings.domain : [ settings.domain ];

	settings.envSlug = envUtils.envSlug( hostname );
	settings.paths = await makeFs( spinner )( hostname );
	const saveYaml = makeSaveYamlFile( settings['paths']['/'] );
	settings.certs = await makeCert( spinner )( settings.envSlug, envHosts );

	const dockerComposer = await makeDockerCompose( spinner )( envHosts, settings );
	await saveYaml( 'docker-compose.yml', dockerComposer );
	await saveYaml( 'wp-cli.yml', { ssh: 'docker-compose:phpfpm' } );

	await makeCopyConfigs( spinner, fsExtra )( settings );

	await startGlobal( spinner );
	await makeDatabase( spinner )( settings.envSlug );
	await environment.start( settings.envSlug, spinner );

	await makeInstallWordPress( spinner, chalk )( hostname, settings );

	await makeSaveJsonFile( settings['paths']['/'] )( '.config.json', { envHosts, certs: settings['certs'] } );
	await makeUpdateHosts( which, sudo, spinner )( envHosts );

	return settings;
}

exports.command = 'create';
exports.desc = 'Create a new docker environment.';
exports.aliases = [ 'new' ];

exports.handler = makeCommand( async ( { verbose } ) => {
	const spinner = ! verbose ? makeSpinner() : undefined;
	const answers = await createCommand( spinner, {} );

	if ( spinner && !! answers.wordpress && answers.wordpress.type === 'subdomain' ) {
		spinner.info( 'Note: Subdomain multisites require any additional subdomains to be added manually to your hosts file!' );
	}

	let info = `Successfully Created Site!${ EOL }${ EOL }`;
	const links = {};
	const http = answers.certs ? 'https' : 'http';

	( Array.isArray( answers.domain ) ? answers.domain : [ answers.domain ] ).forEach( ( host ) => {
		const home = `${ http }://${ host }/`;
		const admin = `${ http }://${ host }/wp-admin/`;

		links[ home ] = home;
		links[ admin ] = admin;

		info += `Homepage: ${ home }${ EOL }`;
		info += `WP admin: ${ admin }${ EOL }`;
		info += EOL;
	} );

	console.log( replaceLinks( makeBoxen()( info ), links ) );
} );

exports.createCommand = createCommand;
