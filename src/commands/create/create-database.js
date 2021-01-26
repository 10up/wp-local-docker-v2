const database = require( '../../database' );

module.exports = function makeDatabase( spinner ) {
	return async ( envSlug ) => {
		if ( spinner ) {
			spinner.start( 'Creating database...' );
		} else {
			console.log( 'Creating database:' );
		}

		await database.create( envSlug );
		await database.assignPrivs( envSlug );

		if ( spinner ) {
			spinner.succeed( 'Database is created...' );
		} else {
			console.log( ' - Done' );
		}
	};
};
