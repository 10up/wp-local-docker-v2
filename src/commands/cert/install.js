const { installCA } = require( '../../certificates' );

exports.command = 'install';
exports.desc = 'Installs a new local CA in the system trust store.';

exports.handler = function() {
	installCA( true );
};
