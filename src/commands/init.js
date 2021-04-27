const { stat, writeFile } = require( 'fs' ).promises;
const { join } = require( 'path' );

const inquirer = require( 'inquirer' );

const { validateNotEmpty } = require( '../prompt-validators' );
const makeCommand = require( '../utils/make-command' );
const makeInquirer = require( './init/inquirer' );
const makeConfig = require( './init/config' );

exports.command = 'init';
exports.desc = 'Creates a new configuration file to use for a project.';

exports.handler = makeCommand( { checkDocker: false }, async () => {
	const { filename } = await inquirer.prompt( [
		{
			name: 'filename',
			type: 'input',
			message: 'What filename do you want to use?',
			default: 'wp-local-docker.config.js',
			validate: validateNotEmpty,
		},
	] );

	let exists;
	const path = join( process.cwd(), filename );

	try {
		exists = await stat( path );
	} catch ( e ) {
		// do nothing
	}

	if ( exists ) {
		throw new Error( `${ filename } already exists...` );
	}

	const answers = await makeInquirer( inquirer )();
	const template = makeConfig()( answers );

	await writeFile( path, template, {
		encoding: 'utf-8',
		mode: 0o644,
	} );
} );
