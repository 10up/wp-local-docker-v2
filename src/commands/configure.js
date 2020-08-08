const os = require( 'os' );
const path = require( 'path' );

const inquirer = require( 'inquirer' );
const fs = require( 'fs-extra' );

const makeCommand = require( '../utils/make-command' );
const { validateNotEmpty } = require( '../prompt-validators' );
const {
	configure,
	get,
	getConfigDirectory,
	getDefaults,
} = require( '../configure' );

exports.command = 'configure';
exports.desc = 'Set up a configuration for WP Local Docker.';

exports.handler = makeCommand( { checkDocker: false }, async () => {
	const defaults = getDefaults();

	const currentDir = await get( 'sitesPath' );
	const currentHosts = await get( 'manageHosts' );
	const currentSnapshots = await get( 'snapshotsPath' );

	const resolveHome = ( input ) => input.replace( '~', os.homedir() );

	const questions = [
		{
			name: 'sitesPath',
			type: 'input',
			message: 'What directory would you like WP Local Docker to create environments within?',
			default: currentDir || defaults.sitesPath,
			validate: validateNotEmpty,
			filter: resolveHome,
			transformer: resolveHome,
		},
		{
			name: 'snapshotsPath',
			type: 'input',
			message: 'What directory would you like to store WP Snapshots data within?',
			default: currentSnapshots || defaults.snapshotsPath,
			validate: validateNotEmpty,
			filter: resolveHome,
			transformer: resolveHome,
		},
		{
			name: 'manageHosts',
			type: 'confirm',
			message: 'Would you like WP Local Docker to manage your hosts file?',
			default: currentHosts !== undefined ? currentHosts : defaults.manageHosts,
		},
	];

	if ( fs.existsSync( path.join( getConfigDirectory(), 'global' ) ) ) {
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

	await configure( { ...defaults, ...answers } );
} );
