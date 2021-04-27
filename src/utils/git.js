const chalk = require( 'chalk' );
const inquirer = require( 'inquirer' );

exports.makeClone = function( spinner, statusPrefix ) {
	const git = require( 'nodegit' ); // nodegit must be required here
	let cloneAttempted = false;

	return ( dir, repository, branch ) => git.Clone.clone( repository, dir, {
		checkoutBranch: branch || undefined,
		fetchOpts: {
			callbacks: {
				transferProgress( stats ) {
					if ( spinner ) {
						const total = stats.totalObjects() * 2;
						const progress = stats.receivedObjects() + stats.indexedObjects();
						const info = `${ Math.ceil( 100 * progress / total ) }% (${ progress.toLocaleString() }/${ total.toLocaleString() })`;
						spinner.text = `${ statusPrefix }: ${ info }...`;
					}
				},
				certificateCheck() {
					// certificate check doesn't work correctly on MacOS,
					// thus turn off it there
					return process.platform !== 'darwin';
				},
				credentials: async ( url, user, type ) => {
					if ( ( git.Cred.TYPE.SSH_KEY & type ) > 0 ) {
						return git.Cred.sshKeyFromAgent( user );
					}

					if ( ( git.Cred.TYPE.USERPASS_PLAINTEXT & type ) === 0 ) {
						// return default credetials to emulate an error condition
						// if the current authentication type is not USERPASS_PLAINTEXT
						return git.Cred.defaultNew();
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

					const answers = await inquirer.prompt( questions );
					if ( spinner ) {
						spinner.start( `${ statusPrefix }...` );
					}

					return git.Cred.userpassPlaintextNew( answers.username, answers.password );
				},
			},
		},
	} );
};
