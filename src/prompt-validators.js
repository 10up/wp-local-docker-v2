const validateBool = function( value ) {
    var y = new RegExp( /^y(es)?$/i );
    var n = new RegExp( /^no?$/i );

    if ( typeof value !== 'string' ) {
        return value;
    }

    if ( value.match( y ) !== null ) {
        return 'true';
    } else if ( value.match( n ) !== null ) {
        return 'false';
    }

    return value;
};

/*
Not foolproof, but should catch some more common issues with entering hostnames
 */
const parseHostname = function( value ) {
    // Get rid of any http(s):// prefix
    value = value.replace( /^https?:\/\//i, '' );

    // Get rid of any spaces
    value = value.replace( /\s/i, '' );

    // get rid of any trailing slashes that might exist
    value = value.replace( /\/$/i, '' );

    return value;
};

module.exports = { validateBool, parseHostname };
