const { EOL } = require( 'os' );

const MarkdownIt = require( 'markdown-it' );
const chalk = require( 'chalk' );

const { makeLink } = require( './make-link' );

module.exports = function() {
	return ( markdown ) => {
		const md = new MarkdownIt();

		md.renderer.render = function( tokens ) {
			const renderer = new Renderer();
			return renderer.render( tokens );
		};

		return md.render( markdown ) + EOL;
	};
};

class Renderer {

	constructor() {
		this.indents = [];
		this.prevTag = '';
	}

	expandIndent() {
		this.indents.push( '  ' );
	}

	shrinkIndent() {
		this.indents.pop();
	}

	getIndent() {
		return this.indents.join( '' );
	}

	getSpacer( token ) {
		const blockTags = [ 'p', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ];

		if ( token.level > 0 && ( token.tag === 'ul' || token.tag === 'ol' ) ) {
			return '';
		}

		return blockTags.includes( this.prevTag ) && blockTags.includes( token.tag )
			? EOL
			: '';
	}

	render( tokens ) {
		const blocks = [];
		const result = [];
		const ol = [];

		for ( let i = 0; i < tokens.length; i++ ) {
			const token = tokens[i];

			const spacer = this.getSpacer( token );
			if ( spacer ) {
				result.push( spacer );
			}

			switch ( token.type ) {
				case 'ordered_list_open':
					ol.push( 0 );
					this.expandIndent();
					break;
				case 'ordered_list_close':
					ol.pop();
					this.shrinkIndent();
					break;
				case 'bullet_list_open':
					this.expandIndent();
					break;
				case 'bullet_list_close':
					this.shrinkIndent();
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
							result.push( chalk.bold.cyanBright( `${ token.markup } ` ), chalk.bold.cyanBright( result.pop() ), EOL );
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
						result.push( this.render( token.children ) );
					}
					break;
				case 'code_inline':
					result.push( chalk.yellow( token.content ) );
					break;
				case 'text':
					result.push( token.content );
					break;
				case 'softbreak':
					result.push( EOL );
					result.push( this.getIndent() );
					break;
			}

			this.prevTag = token.tag;
		}

		return result.join( '' ).trim();
	}

}
