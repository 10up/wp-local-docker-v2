const { join } = require( 'path' );
const { writeFile } = require( 'fs' ).promises;

module.exports = function makeJsonFile( spinner, root ) {
    return async ( filename, data ) => {
        spinner.start( `Saving ${ filename } file...` );
        await writeFile( join( root, filename ), JSON.stringify( data ) );
        spinner.succeed( `${ filename } file is saved...` );
    };
};
