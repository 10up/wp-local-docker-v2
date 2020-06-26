const ora = require( 'ora' );

module.exports = function makeSpinner() {
    return ( args = {} ) => {
        const spinner = ora( {
            spinner: 'dots',
            color: 'white',
            hideCursor: true,
            ...args,
        } );

        return new Proxy( spinner, {
            get( target, name ) {
                if ( name === 'promise' ) {
                    return async ( before, promise, after ) => {
                        target.start( before );
                        const result = await promise;
                        target.succeed( after );

                        return result;
                    }; 
                }

                return target[name];
            },
        } );
    };
};
