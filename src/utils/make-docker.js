const Docker = require( 'dockerode' );

module.exports = function makeDocker( args = {} ) {
	return new Docker( {
		...args,
	} );
};
