const terminalLink = require( 'terminal-link' );

module.exports = function makeLink( text, link ) {
    if ( ! terminalLink.isSupported ) {
        return link;
    }

    return terminalLink( text, link );
};
