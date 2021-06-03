/**
 * Miscellaneous helper functions to be used throughout the project.
 */

/**
 * Removes slashes at the BEGINNING of a string
 *
 * @param string string 	The string to remove slashes from
 */
const unleadingslashit = function ( string ) {
	return string.replace( /^\/+/g, '' );
};

/**
 * Removes slashes at the END of a string
 *
 * @param string string 	The string to remove slashes from
 */
const untrailingslashit = function ( string ) {
	return string.replace( /\/$/, '' );
};

/**
 * Removes slashes from beginning and end of a string
 *
 * @param string string     The string to remove slashes from
 */
const removeEndSlashes = function ( string ) {
	return unleadingslashit( untrailingslashit( string ) );
};

module.exports = { unleadingslashit, untrailingslashit, removeEndSlashes };
