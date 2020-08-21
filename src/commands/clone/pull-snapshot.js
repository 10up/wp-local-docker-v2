const chalk = require( 'chalk' );
const inquirer = require( 'inquirer' );

module.exports = function makePullSnapshot( spinner, wpsnapshots ) {
	return async ( env, mainDomain, snapshot ) => {
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
				choices: snapshot,
				when() {
					return Array.isArray( snapshot ) && snapshot.length > 1;
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
		];

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

		await wpsnapshots( env, command );
	};
};
