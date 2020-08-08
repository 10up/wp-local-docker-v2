const { join } = require( 'path' );
const { writeFile } = require( 'fs' ).promises;

module.exports = function makeJsonFile( chalk, spinner, root ) {
	return async ( filename, data ) => {
		spinner.start( `Saving ${ chalk.cyan( filename ) } file...` );
		await writeFile( join( root, filename ), JSON.stringify( data ) );
		spinner.succeed( `${ chalk.cyan( filename ) } file is saved...` );
	};
};
