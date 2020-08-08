const { execSync } = require( 'child_process' );

module.exports = function makePullSnapshot( wpsnapshotsDir, images, inquirer, root ) {
	return async ( snapshot ) => {
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
		];

		const { snapshotId } = await inquirer.prompt( questions );

		let selectedSnapshot;
		if ( snapshotId === true ) {
			selectedSnapshot = typeof snapshot === 'string' ? snapshot : snapshot[ 0 ];
		} else if ( snapshotId && typeof snapshotId === 'string' ) {
			selectedSnapshot = snapshotId;
		}

		if ( ! selectedSnapshot ) {
			return;
		}

		try {
			execSync( `docker run -it --rm --network wplocaldocker -v "${ root }:/var/www/html" -v "${ wpsnapshotsDir }:/home/wpsnapshots/.wpsnapshots" ${ images.wpsnapshots } --db_user=root pull ${ selectedSnapshot }`, { stdio: 'inherit' } );
		} catch( e ) {
			// do nothing
		}
	};
};
