const { EOL } = require( 'os' );

const MarkdownIt = require( 'markdown-it' );
const chalk = require( 'chalk' );

const { makeLink } = require( './make-link' );

module.exports = function() {
	return ( markdown ) => {
		const md = new MarkdownIt();
		md.renderer.render = renderMarkdown;
		return md.render( markdown ) + EOL;
	};
};

function renderMarkdown( tokens ) {
	const blocks = [];
	const result = [];
	const ol = [];

	for ( let i = 0; i < tokens.length; i++ ) {
		const token = tokens[i];

		switch ( token.type ) {
			case 'ordered_list_open':
				ol.push( 0 );
				break;
			case 'ordered_list_close':
				ol.pop();
				result.push( EOL );
				break;
			case 'bullet_list_close':
				result.push( EOL );
				break;
			case 'list_item_open': {
				blocks.push( token );
				result.push( ''.padEnd( token.level - 1, ' ' ) );
				if ( token.markup === '.' ) {
					if ( ol.length > 0 ) {
						ol[ ol.length - 1 ] = ol[ ol.length - 1 ] + 1;
						result.push( ol.join( '.' ), ') ' );
					}
				} else {
					result.push( '• ' );
				}
				break;
			}
			case 'strong_open':
			case 'em_open':
			case 'link_open':
			case 'heading_open':
			case 'paragraph_open':
				blocks.push( token );
				break;
			case 'list_item_close':
			case 'strong_close':
			case 'em_close':
			case 'link_close':
			case 'heading_close':
			case 'paragraph_close': {
				const prevToken = blocks.pop();
				switch ( prevToken.tag ) {
					case 'h1':
					case 'h2':
					case 'h3':
					case 'h4':
					case 'h5':
					case 'h6':
						result.push( chalk.bold.cyanBright( `${ token.markup } ` ), chalk.bold.cyanBright( result.pop() ), EOL, EOL );
						break;
					case 'a': {
						const href = ( prevToken.attrs.find( ( [ attr ] ) => attr === 'href' ) || [] )[ 1 ];
						result.push( href ? makeLink( result.pop(), href ) : result.pop() );
						break;
					}
					case 'strong':
						result.push( chalk.bold( result.pop() ) );
						break;
					case 'em':
						result.push( chalk.italic( result.pop() ) );
						break;
					case 'p':
						result.push( EOL );
						break;
				}
				break;
			}
			case 'inline':
				if ( Array.isArray( token.children ) && token.children.length > 0 ) {
					result.push( renderMarkdown( token.children ) );
				}
				break;
			case 'code_inline':
				result.push( chalk.yellow( token.content ) );
				break;
			case 'text':
				result.push( token.content );
				break;
		}
	}

	return result.join( '' ).trim();
}
