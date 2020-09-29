const { EOL } = require( 'os' );

module.exports = function makeGitClone( spinner, chalk, { Clone, Cred }, { prompt } ) {
	const { TYPE } = Cred;

	return async ( dir, repository, branch ) => {
		let cloneAttempted = false;

		if ( spinner ) {
			spinner.start( 'Cloning repository...' );
		} else {
			console.log( 'Cloning repository' );
		}

		try {
			await Clone.clone( repository, dir, {
				checkoutBranch: branch,
				fetchOpts: {
					callbacks: {
						transferProgress( stats ) {
							if ( spinner ) {
								const total = stats.totalObjects() * 2;
								const progress = stats.receivedObjects() + stats.indexedObjects();
								const info = `${ Math.ceil( 100 * progress / total ) }% (${ progress }/${ total })`;
								spinner.text = `Cloning repository: ${ info }...`;
							}
						},
						certificateCheck() {
							// certificate check doesn't work correctly on MacOS,
							// thus turn off it there
							return process.platform !== 'darwin';
						},
						credentials: async ( url, user, type ) => {
							if ( ( TYPE.SSH_KEY & type ) > 0 ) {
								return Cred.sshKeyFromAgent( user );
							}

							if ( ( TYPE.USERPASS_PLAINTEXT & type ) === 0 ) {
								// return default credetials to emulate an error condition
								// if the current authentication type is not USERPASS_PLAINTEXT
								return Cred.defaultNew();
							}

							if ( spinner ) {
								spinner.stop();
								if ( cloneAttempted ) {
									spinner.fail( chalk.red( 'Invalid credentials, please, try again.' ) );
								}
							} else if ( cloneAttempted ) {
								console.log( 'Invalid credentials, please, try again.' );
							}

							cloneAttempted = true;

							const origin = url.split( '/' ).slice( 0, 3 ).join( '/' );
							const questions = [
								{
									type: 'input',
									name: 'username',
									message: `Username for ${ origin }:`,
								},
								{
									type: 'password',
									name: 'password',
									message( { username } ) {
										const originWithUser = origin.split( '://' ).join( `://${ username }@` );
										return `Password for ${ originWithUser }:`;
									},
								},
							];

							const answers = await prompt( questions );
							if ( spinner ) {
								spinner.start( 'Cloning the repository...' );
							}

							return Cred.userpassPlaintextNew( answers.username, answers.password );
						},
					},
				},
			} );
		} catch ( err ) {
			if ( spinner ) {
				spinner.stop();
			}
			process.stderr.write( err.toString() + EOL );
			throw new Error( 'An error happened during cloning your repository. Please, submit a new issue: https://github.com/10up/wp-local-docker-v2/issues' );
		}

		if ( spinner ) {
			spinner.succeed( 'Repository is cloned...' );
		} else {
			console.log( ' - Done' );
		}
	};
};
