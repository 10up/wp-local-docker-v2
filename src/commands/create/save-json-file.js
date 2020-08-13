const { join } = require( 'path' );
const { writeFile } = require( 'fs' ).promises;

module.exports = function makeJsonFile( chalk, spinner, root ) {
	return async ( filename, data ) => {
		if ( spinner ) {
			spinner.start( `Saving ${ chalk.cyan( filename ) } file...` );
		}

		await writeFile( join( root, filename ), JSON.stringify( data ) );

		if ( spinner ) {
			spinner.succeed( `${ chalk.cyan( filename ) } file is saved...` );
		}
	};
};
