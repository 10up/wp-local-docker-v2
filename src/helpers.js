/**
 * Miscellaneous helper functions to be used throughout the project
 */


/**
 * Removes slashes from beginning and end of a string
 * 
 * @param string string     The string to remove slashes 
 */
const removeSlashes = function( string ) {
    return string.replace( /\/$/, '' ).replace( /^\//, '' );
}

module.exports = { removeSlashes }