const { join } = require( 'path' );
const { writeFile } = require( 'fs' ).promises;

module.exports = function makeJsonFile( root ) {
	return ( filename, data ) => {
		return writeFile( join( root, filename ), JSON.stringify( data ) );
	};
};
