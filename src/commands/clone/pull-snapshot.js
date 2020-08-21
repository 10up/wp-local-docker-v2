module.exports = function makePullSnapshot( wpsnapshots, inquirer, env ) {
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

		await wpsnapshots( env, [ 'pull', selectedSnapshot ] );
	};
};
