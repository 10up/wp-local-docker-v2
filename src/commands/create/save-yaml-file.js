const { join } = require( 'path' );

const yaml = require( 'write-yaml' );

module.exports = function makeSaveYamlFile( chalk, spinner, root ) {
	return ( filename, data ) => new Promise( ( resolve, reject ) => {
		if ( spinner ) {
			spinner.start( `Saving ${ chalk.cyan( filename ) } file...` );
		}

		yaml( join( root, filename ), data, { lineWidth: 500 }, ( err ) => {
			if ( err ) {
				reject( err );
			} else {
				if ( spinner ) {
					spinner.succeed( `${ chalk.cyan( filename ) } file is saved...` );
				}
				resolve();
			}
		} );
	} );
};
