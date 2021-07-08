const compose = require( 'docker-compose' );

function interpretComposerResults( { out, err, exitCode } ) {
	if ( exitCode ) {
		throw new Error( err );
	}

	return out;
}

function makeProxyFunction( fn ) {
	return async function( ...args ) {
		const results = await compose[ fn ]( ...args );
		return interpretComposerResults( results );
	};
}

exports.down = makeProxyFunction( 'down' );
exports.exec = makeProxyFunction( 'exec' );
exports.logs = makeProxyFunction( 'logs' );
exports.ps = makeProxyFunction( 'ps' );
exports.pullAll = makeProxyFunction( 'pullAll' );
exports.restartAll = makeProxyFunction( 'restartAll' );
exports.run = makeProxyFunction( 'run' );
exports.upAll = makeProxyFunction( 'upAll' );

exports.isRunning = async function( cwd ) {
	try {
		await compose.port( 'nginx', 80, { cwd } );
		return true;
	} catch {
	}

	return false;
};
