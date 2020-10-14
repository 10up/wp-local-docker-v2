const { EOL } = require( 'os' );

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
	const results = await compose.ps( { cwd } );
	const out = interpretComposerResults( results );

	return out.split( EOL ).filter( ( line ) => line.trim().length > 0 ).length > 2;
};
