const readYaml = require( 'read-yaml' );
const writeYaml = require( 'write-yaml' );

exports.readYaml = function( filename ) {
	return readYaml.sync( filename, {} );
};

exports.writeYaml = function( filename, data ) {
	return new Promise( ( resolve, reject ) => {
		writeYaml( filename, data, { 'lineWidth': 500 }, ( err ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve();
			}
		} );
	} );
};
