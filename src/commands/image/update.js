const os = require( 'os' );

const inquirer = require( 'inquirer' );
const chalk = require( 'chalk' );

const { stopAll } = require( '../../environment' );
const promptValidators = require( '../../prompt-validators' );
const { globalImages, images } = require( '../../docker-images' );
const makeCommand = require( '../../utils/make-command' );
const makeSpinner = require( '../../utils/make-spinner' );
const makeDocker = require( '../../utils/make-docker' );

exports.command = 'update [--yes] [--remove-built-images]';
exports.desc = 'Updates any docker images used by your environment to the latest versions available for the specified tag. All environments must be stopped to update images.';

exports.builder = function( yargs ) {
	yargs.positional( 'yes', {
		default: undefined,
		type: 'boolean',
		describe: 'Optional. Answer "yes" on all questions.',
	} );

	yargs.positional( 'remove-built-images', {
		default: false,
		type: 'boolean',
		describe: 'Optional. Force removal of custom images built for phpfpm.',
	} );
};

async function removeBuiltImages( docker, spinner ) {
	if ( spinner ) {
		spinner.start( 'Checking previously built images...' );
	} else {
		console.log( 'Removing previously built images so they can be built again' );
	}

	const images = await docker.listImages( { filters: '{"label": ["com.10up.wp-local-docker=user-image"]}' } ).catch( () => false );
	if ( Array.isArray( images ) && images.length > 0 ) {
		for ( let i = 0; i < images.length; i++ ) {
			const name = images[ i ].RepoTags[0];

			if ( spinner ) {
				spinner.start( `Removing ${ chalk.cyan( name ) } image...` );
			}

			const image = docker.getImage( name );
			await image.remove();

			if ( spinner ) {
				spinner.succeed( `${ chalk.cyan( name ) } image has been removed...` );
			}
		}
	} else if ( spinner ) {
		spinner.info( 'No previously built images found. Skipping removal...' );
	}
}

async function updateIfUsed( docker, name, spinner ) {
	if ( spinner ) {
		spinner.start( `Checking ${ chalk.cyan( name ) } image...` );
	} else {
		console.log( `Testing ${ name }` );
	}

	const image = docker.getImage( name );
	const data = await image.inspect().catch( () => false );

	if ( !data ) {
		if ( spinner ) {
			spinner.info( `${ chalk.cyan( name ) } doesn't exist on this system. Skipping update...` );
		} else {
			console.log( `${ name } doesn't exist on this system. Skipping update.` );
		}
	} else {
		if ( spinner ) {
			spinner.text = `Pulling ${ chalk.cyan( name ) } image...`;
		}

		const stream = await docker.pull( name );

		await new Promise( ( resolve ) => {
			docker.modem.followProgress( stream, resolve, ( event ) => {
				if ( spinner ) {
					const { id, status, progressDetail } = event;
					const { current, total } = progressDetail || {};
					const progress = total ? ` - ${ Math.ceil( ( current || 0 ) * 100 / total ) }%` : '';

					spinner.text = `Pulling ${ chalk.cyan( name ) } image: [${ id }] ${ status }${ progress }...`;
				}
			} );
		} );

		if ( spinner ) {
			spinner.succeed( `${ chalk.cyan( name ) } has been updated...` );
		}
	}
}

exports.handler = makeCommand( {}, async function( { yes, verbose, removeBuiltImages: forceRemoveBuiltImages } ) {
	if ( ! yes ) {
		const { confirm } = await inquirer.prompt( {
			name: 'confirm',
			type: 'confirm',
			message: 'Updating images requires all environments to be stopped. Is that okay?',
			validate: promptValidators.validateNotEmpty,
			default: false,
		} );

		if ( ! confirm ) {
			return;
		}
	}

	const spinner = ! verbose ? makeSpinner() : undefined;
	const docker = makeDocker();

	await stopAll( spinner );

	const allImages = [ ...Object.values( globalImages ), ...Object.values( images ) ];
	for ( let i = 0; i < allImages.length; i++ ) {
		await updateIfUsed( docker, allImages[ i ], spinner );
	}

	// delete the built containers on linux so it can be rebuilt with the (possibly) updated phpfpm container
	if ( forceRemoveBuiltImages && os.platform() == 'linux' ) {
		await removeBuiltImages( docker, spinner );
	}

	if ( ! spinner ) {
		console.log( 'Finished. You can now start your environments again.' );
	}
} );
