exports.command = 'cert <command>';
exports.desc = 'Manages certificates.';

exports.builder = ( yargs ) => {
	yargs.commandDir( 'cert' );
};
