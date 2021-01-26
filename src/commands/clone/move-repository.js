const { join } = require( 'path' );

module.exports = function makeMoveRepository( chalk, spinner, { remove, move, readdirSync, chmodSync }, root ) {
	const getDirectories = ( dir ) => {
		const files = readdirSync( dir, { withFileTypes: true } );
		const results = [];

		for ( const file of files ) {
			if ( file.isDirectory() && file.name !== '.git' ) {
				const fullpath = join( dir, file.name );
				results.push( fullpath, ...getDirectories( fullpath ) );
			}
		}

		return results;
	};

	return async ( from, to ) => {
		const dest = join( root, to );

		if ( spinner ) {
			spinner.start( `Moving repository to ${ chalk.cyan( to ) }...` );
		} else {
			console.log( 'Moving repository' );
		}

		await remove( dest );
		await move( from, dest );

		if ( spinner ) {
			spinner.succeed( `Respository is moved to ${ chalk.cyan( to ) }...` );
		} else {
			console.log( ' - Done' );
		}

		chmodSync( dest, 0o755 );
		getDirectories( dest ).forEach( ( dir ) => {
			chmodSync( dir, 0o755 );
		} );
	};
};
