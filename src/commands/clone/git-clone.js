module.exports = function makeGitClone( spinner, chalk, { Clone, Cred }, { prompt } ) {
    const { TYPE } = Cred;

    return async ( dir, repository, branch ) => {
        let cloneAttempted = false;

        spinner.start( 'Cloning the repository...' );

        try {
            await Clone.clone( repository, dir, {
                checkoutBranch: branch,
                fetchOpts: {
                    callbacks: {
                        certificateCheck() {
                            // certificate check doesn't work correctly on MacOS,
                            // thus turn off it there
                            return process.platform !== 'darwin';
                        },
                        credentials( url, user, type ) {
                            if ( ( TYPE.SSH_KEY & type ) > 0 ) {
                                return Cred.sshKeyFromAgent( user );
                            }

                            if ( ( TYPE.USERPASS_PLAINTEXT & type ) === 0 ) {
                                // return default credetials to emulate an error condition
                                // if the current authentication type is not USERPASS_PLAINTEXT
                                return Cred.defaultNew();
                            }

                            spinner.stop();
                            if ( cloneAttempted ) {
                                spinner.fail( chalk.red( 'Invalid credentials, please, try again.' ) );
                            }

                            cloneAttempted = true;

                            return new Promise( ( resolve ) => {
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

                                prompt( questions ).then( ( answers ) => {
                                    spinner.start( 'Cloning the repository...' );
                                    resolve( Cred.userpassPlaintextNew( answers.username, answers.password ) );
                                } );
                            } );
                        },
                    },
                },
            } );
        } catch ( err ) {
            spinner.stop();
            throw new Error( 'An error happened during cloning your repository. Please, submit a new issue: https://github.com/10up/wp-local-docker-v2/issues' );
        }

        spinner.succeed( 'Cloned the repository...' );
    };
};
