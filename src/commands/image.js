exports.command = 'image <command>';
exports.desc = 'Manages docker images used by this environment.';

exports.builder = ( yargs ) => {
	yargs.commandDir( 'image' );
};
