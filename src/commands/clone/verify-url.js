const { URL } = require( 'url' );

module.exports = function makeVerifyUrl( spinner ) {
    return ( url ) => {
        let httpLike = false;

        try {
            new URL( url );
            httpLike = true;
        } catch( err ) {
            // do nothing
        }

        if ( httpLike ) {
            throw new Error( 'HTTP-like repository URLs are not supported.' );
        } else {
            spinner.succeed( 'Verified repository URL...' );
        }
    };
};
