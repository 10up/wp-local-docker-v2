exports.command = 'cache <command>';
exports.desc = 'Manages the build cache.';

exports.builder = ( yargs ) => {
	yargs.commandDir( 'cache' );
};
