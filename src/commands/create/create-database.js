const database = require( '../../database' );

module.exports = function makeDatabase( spinner ) {
	return async ( envSlug ) => {
		spinner.start( 'Creating database...' );

		await database.create( envSlug );
		await database.assignPrivs( envSlug );

		spinner.succeed( 'Database is created...' );
	};
};
