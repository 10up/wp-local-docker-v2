const chalk = require( 'chalk' );
const inquirer = require( 'inquirer' );

async function getSnapshotChoices( wpsnapshots, env, snapshot ) {
	const snapshotChoices = [];

	const stdout = await wpsnapshots( env, [
		'search',
		...snapshot,
		'--format',
		'json',
	], 'pipe' );

	try {
		const data = JSON.parse( stdout );
		if ( Array.isArray( data ) ) {
			const dateFormat = {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			};

			data.forEach( ( { id, description, author, created } ) => {
				const date = new Date( created * 1000 );
				snapshotChoices.push( {
					name: `[${ date.toLocaleDateString( 'en-US', dateFormat ) }] ${ author }: ${ description }`,
					value: id,
				} );
			} );
		}
	} catch ( e ) {
		// do nothing
	}

	return [
		...snapshotChoices.sort( ( a, b ) => a.name.localeCompare( b.name ) ),
		{
			name: 'Don\'t use snapshot',
			value: '',
		},
	];
}

module.exports = function makePullSnapshot( spinner, wpsnapshots ) {
	return async ( env, mainDomain, config ) => {
		const info = {
			repository: undefined,
			snapshot: [],
		};

		if ( typeof config === 'string' ) {
			info.snapshot = [ config ];
		} else if ( Array.isArray( config ) ) {
			info.snapshot = config;
		} else if ( typeof config === 'object' ) {
			if ( config.snapshot ) {
				if ( typeof config.snapshot === 'string' ) {
					info.snapshot = [ config.snapshot ];
				} else if ( Array.isArray( config.snapshot ) ) {
					info.snapshot = config.snapshot;
				}
			}

			info.repository = config.repository || undefined;
		}

		const { snapshot, repository } = info;
		if ( ! Array.isArray( snapshot ) || ! snapshot.length ) {
			return;
		}

		const snapshotChoices = await getSnapshotChoices( wpsnapshots, env, snapshot );
		const questions = [
			{
				name: 'snapshotId',
				type: 'confirm',
				message: 'Do you want to pull a snapshot?',
				when() {
					return ( Array.isArray( snapshot ) && snapshot.length === 1 ) || typeof snapshot === 'string';
				}
			},
			{
				name: 'snapshotId',
				type: 'list',
				message: 'What snapshot would you like to use?',
				choices: snapshotChoices,
				when() {
					return snapshotChoices.length > 1;
				},
			},
			{
				name: 'includeFiles',
				type: 'confirm',
				message: 'Do you want to pull files from the snapshot?',
				default: true,
				when( { snapshotId } ) {
					return snapshotId === true || ( typeof snapshotId === 'string' && snapshotId.trim().length > 0 );
				}
			},
			{
				name: 'includeDb',
				type: 'confirm',
				message: 'Do you want to pull the database from the snapshot?',
				default: true,
				when( { snapshotId } ) {
					return snapshotId === true || ( typeof snapshotId === 'string' && snapshotId.trim().length > 0 );
				}
			},
		];

		const { snapshotId, includeFiles, includeDb } = await inquirer.prompt( questions );

		let selectedSnapshot;
		if ( snapshotId === true ) {
			selectedSnapshot = typeof snapshot === 'string' ? snapshot : snapshot[ 0 ];
		} else if ( snapshotId && typeof snapshotId === 'string' ) {
			selectedSnapshot = snapshotId;
		}

		if ( ! selectedSnapshot ) {
			return;
		}

		if ( spinner ) {
			spinner.info( `Using ${ chalk.cyan( selectedSnapshot ) } snapshot...` );
		} else {
			console.log( `Using ${ selectedSnapshot } snapshot...` );
		}

		const command = [
			'pull',
			selectedSnapshot,
			`--main_domain=${ mainDomain }`,
			'--confirm',
			'--confirm_wp_version_change=no',
			'--overwrite_local_copy',
			'--suppress_instructions',
		];

		if ( repository ) {
			command.push( `--repository=${ repository }` );
		}

		if ( includeFiles ) {
			command.push( '--include_files' );
		} else {
			command.push( '--include_files=no' );
		}

		if ( includeDb ) {
			command.push( '--include_db' );
		} else {
			command.push( '--include_db=no' );
		}

		await wpsnapshots( env, command, 'inherit' );
	};
};
