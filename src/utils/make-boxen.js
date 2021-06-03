const boxen = require( 'boxen' );

module.exports = function makeBoxen( args = {} ) {
	return ( message ) => boxen( message.trim(), {
		padding: 2,
		align: 'left',
		borderColor: 'magentaBright',
		...args,
	} );
};
