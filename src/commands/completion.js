const { resolve } = require( 'path' );

const chalk = require( 'chalk' );

exports.command = 'completion <shell>';
exports.desc = 'Displays completion script for selected shell.';

exports.builder = function( yargs ) {
    yargs.positional( 'shell', {
        describe: 'A shell to display completion script for.',
        type: 'string',
    } );
};

exports.handler = ( { shell } ) => {
    switch( shell ) {
        case 'bash': {
            const filename = resolve( __dirname, '../../scripts/10updocker-completion.bash' );
            console.log( '#' );
            console.log( '# wp-local-docker command completion script' );
            console.log( '#' );
            console.log( `# Installation: ${ chalk.bold.cyan( '10updocker completion bash >> ~/.bashrc' ) }` );
            console.log( `#    or ${ chalk.bold.cyan( '10updocker completion bash >> ~/.bash_profile' ) } on OSX.` );
            console.log( '#' );
            console.log( `source ${ filename }` );
            break;
        }
        case 'zsh':
            console.error( chalk.red( 'ZSH is not supported yet.' ) );
            process.exit( 2 );
            break;
        default:
            console.error( `${ chalk.bold.redBright( shell ) } ${ chalk.red( 'shell is not supported.' ) }` );
            process.exit( 1 );
            break;
    }
};
