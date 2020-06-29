const { join } = require( 'path' );

const yaml = require( 'write-yaml' );

module.exports = function makeSaveYamlFile( spinner, root ) {
    return ( filename, data ) => new Promise( ( resolve ) => {
        spinner.start( `Saving ${ filename } file...` );
        yaml( join( root, filename ), data, { lineWidth: 500 }, ( err ) => {
            if ( err ) {
                throw err;
            } else {
                spinner.succeed( `Saved ${ filename } file...` );
                resolve();
            }
        } );
    } );
};
