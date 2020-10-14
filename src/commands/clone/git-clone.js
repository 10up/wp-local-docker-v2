const { EOL } = require( 'os' );

const { makeClone } = require( '../../utils/git' );

module.exports = function makeGitClone( spinner ) {
	const clone = makeClone( spinner, 'Cloning repository' );

	return async ( dir, repository, branch ) => {
		if ( spinner ) {
			spinner.start( 'Cloning repository...' );
		} else {
			console.log( 'Cloning repository' );
		}

		try {
			await clone( dir, repository, branch );
		} catch ( err ) {
			if ( spinner ) {
				spinner.stop();
			}
			process.stderr.write( err.toString() + EOL );
			throw new Error( 'An error occurred during cloning your repository. Please, submit a new issue: https://github.com/10up/wp-local-docker-v2/issues' );
		}

		if ( spinner ) {
			spinner.succeed( 'Repository is cloned...' );
		} else {
			console.log( ' - Done' );
		}
	};
};
