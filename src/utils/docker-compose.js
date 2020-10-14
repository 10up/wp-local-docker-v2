const compose = require( 'docker-compose' );

function interpretComposerResults( { out, err, exitCode } ) {
	if ( exitCode ) {
		throw new Error( err );
	}

	return out;
}

function makeProxyFunction( fn ) {
	return async function( args ) {
		const results = await compose[ fn ]( args );
		return interpretComposerResults( results );
	};
}

exports.down = makeProxyFunction( 'down' );
exports.ps = makeProxyFunction( 'down' );
exports.pullAll = makeProxyFunction( 'pullAll' );
exports.restartAll = makeProxyFunction( 'restartAll' );
exports.upAll = makeProxyFunction( 'upAll' );
