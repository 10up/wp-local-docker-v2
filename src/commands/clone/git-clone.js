const { createInterface } = require( 'readline' );
const { EOL } = require( 'os' );
const { Writable } = require( 'stream' );

module.exports = function makeGitClone( spinner, chalk, { Clone, Cred } ) {
    const { TYPE } = Cred;

    const mutableStdout = new Writable( {
        write( chunk, encoding, callback ) {
            ! this.muted && process.stdout.write( chunk, encoding );
            callback();
        },
    } );

    const readlineOptions = {
        input: process.stdin,
        output: mutableStdout,
        terminal: true,
    };

    return async ( dir, url, branch ) => {
        let cloneAttempted = false;

        spinner.start( 'Cloning the repository...' );

        try {
            await Clone.clone( url, dir, {
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
                                const readline = createInterface( readlineOptions );

                                readline.on( 'SIGINT', () => {
                                    process.exit( 1 );
                                } );

                                readline.question( 'Username: ', ( username ) => {
                                    mutableStdout.write( 'Password: ' );
                                    mutableStdout.muted = true;

                                    readline.question( '', ( password ) => {
                                        mutableStdout.muted = false;
                                        mutableStdout.write( EOL );

                                        readline.close();

                                        spinner.start( 'Cloning the repository...' );
                                        resolve( Cred.userpassPlaintextNew( username, password ) );
                                    } );
                                } );
                            } );
                        },
                    },
                },
            } );
        } catch ( err ) {
            spinner.stop();
            throw new Error( 'An error happened during cloning your repository. Please, submit an new issue: https://github.com/10up/wp-local-docker-v2/issues' );
        }

        spinner.succeed( 'Cloned the repository...' );
    };
};
