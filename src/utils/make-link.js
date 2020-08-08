const chalk = require( 'chalk' );
const terminalLink = require( 'terminal-link' );

function makeLink( text, link ) {
	if ( ! terminalLink.isSupported ) {
		return link !== text ? `${ text } (${ link })` : link;
	}

	return terminalLink( text, link );
}

function replaceLinks( text, links ) {
	let output = text;

	Object.keys( links ).forEach( ( label ) => {
		output = output.replace( label, makeLink( chalk.cyanBright( label ), links[ label ] ) );
	} );

	return output;
}

module.exports = {
	makeLink,
	replaceLinks,
};
