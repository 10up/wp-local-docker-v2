const { join } = require( 'path' );
const { writeFile } = require( 'fs' ).promises;

module.exports = function makeJsonFile( root ) {
    return async ( filename, data ) => {
        await writeFile( join( root, filename ), JSON.stringify( data ) );
    };
};
