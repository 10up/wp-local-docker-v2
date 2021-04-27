const helper = require( './helpers' );

const validateNotEmpty = function( value ) {
	return ( value.trim().length !== 0 ) ? true : 'This field is required';
};

const validateBool = function( value ) {
	const y = new RegExp( /^y(es)?$/i );
	const n = new RegExp( /^no?$/i );

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

	const parts = value.split( '/' );

	const hostname = parts[0];

	return hostname;
};

/**
 * Check to make sure proxy URLs have a protcol attached
 *
 * @param  string value 	Proxy URL to check against
 * @return string       	The validated/modified proxy URL
 */
const parseProxyUrl = function( value ) {
	const re = /^https?:\/\//i;

	if ( value.length > 3 && ! re.test( value ) ) {
		value = `http://${ value }`;
	}

	return helper.removeEndSlashes( value );
};

module.exports = { validateNotEmpty, validateBool, parseHostname, parseProxyUrl };
