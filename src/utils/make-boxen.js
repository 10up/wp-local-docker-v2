const { EOL } = require( 'os' );

const boxen = require( 'boxen' );

module.exports = function makeBoxen( args = {} ) {
    return ( message ) => {
        const data = boxen( message.trim(), {
            padding: 2,
            align: 'left',
            borderColor: 'magentaBright',
            ...args,
        } );

        process.stdout.write( data );
        process.stdout.write( EOL );
    };
};
