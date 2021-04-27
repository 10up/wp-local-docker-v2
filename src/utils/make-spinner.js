const ora = require( 'ora' );

module.exports = function makeSpinner( args = {} ) {
	return ora( {
		spinner: 'dots',
		color: 'white',
		hideCursor: true,
		...args,
	} );
};
