const { join } = require( 'path' );

const yaml = require( 'write-yaml' );

module.exports = function makeSaveYamlFile( chalk, spinner, root ) {
	return ( filename, data ) => new Promise( ( resolve ) => {
		spinner.start( `Saving ${ chalk.cyan( filename ) } file...` );
		yaml( join( root, filename ), data, { lineWidth: 500 }, ( err ) => {
			if ( err ) {
				throw err;
			} else {
				spinner.succeed( `${ chalk.cyan( filename ) } file is saved...` );
				resolve();
			}
		} );
	} );
};
