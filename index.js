#!/usr/bin/env node

const yargs = require( 'yargs' );

const { checkIfConfigured, configureDefaults } = require( './src/configure' );
const { checkForUpdates } = require( './src/command-utils' );

async function bootstrap() {
	// check configuration
	const configured = await checkIfConfigured();
	if ( configured === false ) {
		await configureDefaults();
	}

	// check if a new version of the package exists
	await checkForUpdates();

	// usage and help flag
	yargs.scriptName( '10updocker' );
	yargs.usage( 'Usage: 10updocker <command>' );
	yargs.wrap( Math.min( 150, yargs.terminalWidth() ) );
	yargs.help( 'h' );
	yargs.alias( 'h', 'help' );
	yargs.alias( 'v', 'version' );

	// global options
	yargs.option( 'verbose', {
		description: 'Display extended output',
		default: false,
		type: 'boolean',
	} );

	yargs.option( 'env', {
		description: 'Environment name',
		default: false,
		type: 'string',
	} );

	// define commands, parse and process CLI args
	yargs.commandDir( 'src/commands' );
	yargs.demandCommand();
	yargs.parse();
}

// start
bootstrap();
