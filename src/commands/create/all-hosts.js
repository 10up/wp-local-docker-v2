module.exports = function makeAllHosts() {
    return ( { hostname, extraHosts } ) => {
        const allHosts = new Set( [ hostname ] );

        if ( Array.isArray( extraHosts ) && extraHosts.length > 0 ) {
            extraHosts.forEach( ( host ) => {
                allHosts.add( host );
            } );
        }

        return Array.from( allHosts );
    };
};
